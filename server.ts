import express, { Request, Response, NextFunction } from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { Database, User, MoodRecord, JournalEntry, ChatSession, ChatMessage, CrisisLog, TherapySession, UserActivity, SystemNotification } from "./src/server/db.js";
import { hashPassword, comparePassword, signToken, verifyToken } from "./src/server/crypto.js";
import { analyzeAndCounsel } from "./src/server/gemini.js";

// Load configuration
dotenv.config();

const app = express();
const PORT = 3000;

// Parsers & Security Headers
app.use(express.json());

// Enable basic CORS for dynamic domain compatibility
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Initialize MongoDB connection
(async () => {
  try {
    await Database.load();
    console.log("✓ Database initialized");
  } catch (error) {
    console.error("Failed to initialize database:", error);
    process.exit(1);
  }
})();

// ============================================
// AUTHENTICATION MIDDLEWARE
// ============================================
const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Access denied. Authentication token missing." });
  }
  const token = authHeader.split(" ")[1];
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
  (req as any).user = decoded;
  next();
};

const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ error: "Access forbidden. Insufficient permissions." });
    }
    next();
  };
};

// ============================================
// AUTHENTICATION ROUTING
// ============================================
app.post("/api/auth/register", async (req: Request, res: Response) => {
  try {
    const { email, name, password, age, gender, goals } = req.body;
    if (!email || !name || !password) {
      return res.status(400).json({ error: "Email, name and password are required fields." });
    }

    const existing = await Database.findUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: "An account with this email already exists." });
    }

    const userRole = email.toLowerCase().includes("admin@nirvana.com") ? "admin" 
                   : email.toLowerCase().includes("therapist@nirvana.com") ? "therapist" 
                   : "user";

    const newUser: User = {
      id: "user_" + Math.random().toString(36).substr(2, 9),
      email,
      name,
      passwordHash: hashPassword(password),
      role: userRole as any,
      age: age ? parseInt(age) : undefined,
      gender,
      preferences: {
        theme: "light",
        soundVolume: 50,
        dailyGoalMinutes: 15,
        activitiesSelected: ["act_box_breath", "act_zen_sand"]
      },
      mentalWellnessGoals: goals || [],
      streakCount: 1,
      lastActiveDate: new Date().toISOString().split("T")[0],
      createdAt: new Date().toISOString()
    } as any;

    await Database.addUser(newUser);

    const token = signToken({ id: newUser.id, email: newUser.email, role: newUser.role });
    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        preferences: newUser.preferences,
        streakCount: newUser.streakCount,
        goals: newUser.mentalWellnessGoals
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Registration failed" });
  }
});

app.post("/api/auth/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const user = await Database.findUserByEmail(email);
    if (!user || !comparePassword(password, user.passwordHash)) {
      return res.status(400).json({ error: "Invalid email or password credentials." });
    }

    // Update streak logic on login
    const today = new Date().toISOString().split("T")[0];
    let streak = user.streakCount;
    if (user.lastActiveDate) {
      const lastActive = new Date(user.lastActiveDate);
      const currentDate = new Date(today);
      const diffTime = Math.abs(currentDate.getTime() - lastActive.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        streak += 1;
      } else if (diffDays > 1) {
        streak = 1;
      }
    } else {
      streak = 1;
    }

    const updatedUser = await Database.updateUser(user.id!, { streakCount: streak, lastActiveDate: today });

    const token = signToken({ id: user.id, email: user.email, role: user.role });
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        preferences: user.preferences,
        streakCount: streak,
        goals: user.mentalWellnessGoals,
        age: user.age,
        gender: user.gender
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
});

app.get("/api/auth/me", authenticate, async (req: Request, res: Response) => {
  try {
    const decoded = (req as any).user;
    const user = await Database.findUserById(decoded.id);
    if (!user) {
      return res.status(404).json({ error: "User profile not found." });
    }
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      preferences: user.preferences,
      streakCount: user.streakCount,
      goals: user.mentalWellnessGoals,
      age: user.age,
      gender: user.gender
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

app.put("/api/auth/profile", authenticate, async (req: Request, res: Response) => {
  try {
    const decoded = (req as any).user;
    const { name, age, gender, preferences, goals } = req.body;
    
    const updated = await Database.updateUser(decoded.id, {
      name,
      age: age ? parseInt(age) : undefined,
      gender,
      preferences,
      mentalWellnessGoals: goals
    } as any);

    if (!updated) {
      return res.status(404).json({ error: "Failed to update profile data." });
    }

    res.json({
      id: updated.id,
      email: updated.email,
      name: updated.name,
      role: updated.role,
      preferences: updated.preferences,
      streakCount: updated.streakCount,
      goals: updated.mentalWellnessGoals,
      age: updated.age,
      gender: updated.gender
    });
  } catch (error) {
    res.status(500).json({ error: "Profile update failed" });
  }
});

app.delete("/api/auth/profile", authenticate, async (req: Request, res: Response) => {
  try {
    const decoded = (req as any).user;
    const success = await Database.deleteUser(decoded.id);
    if (!success) {
      return res.status(444).json({ error: "Failed to locate and delete account." });
    }
    res.json({ message: "Account deleted successfully." });
  } catch (error) {
    res.status(500).json({ error: "Account deletion failed" });
  }
});

// ============================================
// MOOD API ENDPOINTS
// ============================================
app.get("/api/moods", authenticate, async (req: Request, res: Response) => {
  try {
    const decoded = (req as any).user;
    const { MoodRecordModel } = await import("./src/server/db.js");
    const list = await MoodRecordModel.find({ userId: decoded.id })
      .sort({ date: 1 })
      .lean();
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch moods" });
  }
});

app.post("/api/moods", authenticate, async (req: Request, res: Response) => {
  try {
    const decoded = (req as any).user;
    const { score, emoji, notes, date } = req.body;
    
    if (!score || !emoji) {
      return res.status(400).json({ error: "Mood index details are required." });
    }

    const { MoodRecordModel } = await import("./src/server/db.js");
    const moodDate = date || new Date().toISOString().split("T")[0];

    // Prevent double check-in on identical date
    const existing = await MoodRecordModel.findOne({ userId: decoded.id, date: moodDate });
    
    const record = {
      id: "mood_" + Math.random().toString(36).substr(2, 9),
      userId: decoded.id,
      score: parseInt(score),
      emoji,
      notes: notes || "",
      date: moodDate,
      createdAt: new Date().toISOString()
    };

    if (existing) {
      const updated = await MoodRecordModel.findByIdAndUpdate(existing._id, record, { new: true }).lean();
      res.json(updated);
    } else {
      const newMood = await MoodRecordModel.create(record);
      res.json(newMood);
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to create mood" });
  }
});

// ============================================
// JOURNAL ENDPOINTS
// ============================================
app.get("/api/journals", authenticate, async (req: Request, res: Response) => {
  try {
    const decoded = (req as any).user;
    const { tag, category } = req.query;
    const { JournalEntryModel } = await import("./src/server/db.js");
    
    let filter: any = { userId: decoded.id };
    if (tag) {
      filter.tags = { $elemMatch: { $regex: String(tag), $options: "i" } };
    }
    if (category) {
      filter.category = category;
    }

    const list = await JournalEntryModel.find(filter)
      .sort({ createdAt: -1 })
      .lean();
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch journals" });
  }
});

app.post("/api/journals", authenticate, async (req: Request, res: Response) => {
  try {
    const decoded = (req as any).user;
    const { title, content, moodAttached, tags, category, isPrivate } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: "Title and content must not be blank." });
    }

    const { JournalEntryModel } = await import("./src/server/db.js");
    const entry = await JournalEntryModel.create({
      id: "jrnl_" + Math.random().toString(36).substr(2, 9),
      userId: decoded.id,
      title,
      content,
      moodAttached: moodAttached ? parseInt(moodAttached) : undefined,
      tags: tags || [],
      category: category || "Reflections",
      isPrivate: isPrivate ?? false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({ error: "Failed to create journal" });
  }
});

app.put("/api/journals/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const decoded = (req as any).user;
    const { title, content, moodAttached, tags, category, isPrivate } = req.body;
    const { JournalEntryModel } = await import("./src/server/db.js");

    const entry = await JournalEntryModel.findOne({ id: req.params.id, userId: decoded.id });
    if (!entry) {
      return res.status(404).json({ error: "Journal entry not found." });
    }

    const updated = await JournalEntryModel.findByIdAndUpdate(
      entry._id,
      {
        title: title ?? entry.title,
        content: content ?? entry.content,
        moodAttached: moodAttached !== undefined ? parseInt(moodAttached) : entry.moodAttached,
        tags: tags ?? entry.tags,
        category: category ?? entry.category,
        isPrivate: isPrivate ?? entry.isPrivate,
        updatedAt: new Date().toISOString()
      },
      { new: true }
    ).lean();

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Failed to update journal" });
  }
});

app.delete("/api/journals/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const decoded = (req as any).user;
    const { JournalEntryModel } = await import("./src/server/db.js");

    const entry = await JournalEntryModel.findOne({ id: req.params.id, userId: decoded.id });
    if (!entry) {
      return res.status(404).json({ error: "Journal entry not found." });
    }

    await JournalEntryModel.findByIdAndDelete(entry._id);
    res.json({ message: "Journal entry removed." });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete journal" });
  }
});

// ============================================
// THERAPEUTIC AI CHAT ENDPOINTS
// ============================================
app.get("/api/chat/advisor", authenticate, async (req: Request, res: Response) => {
  try {
    const decoded = (req as any).user;
    const user = await Database.findUserById(decoded.id);
    if (!user) {
      return res.status(404).json({ error: "User profile not found." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey === "MOCK_KEY") {
      const fallbackInsights = [
        `Breathe deeply, ${user.name || "friend"}. Peace is not something you find; it is something you create within yourself right now.`,
        `Remember, ${user.name || "friend"}, you are far stronger than your anxious thoughts. Let them drift like autumn leaves.`,
        `Align your posture, release your shoulders, ${user.name || "friend"}. Focus on standard box breathing for just two minutes.`,
        `Each day is a fresh meadow, ${user.name || "friend"}. Be gentle with yourself in this soft moment.`,
        `Your path is unique. Progress isn't linear; honor your courage to pause and breathe today.`
      ];
      const randomIndex = Math.floor(Math.random() * fallbackInsights.length);
      return res.json({ advice: fallbackInsights[randomIndex] });
    }

    try {
      const { GoogleGenAI } = await import("@google/genai");
      const aiInstance = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const { MoodRecordModel } = await import("./src/server/db.js");
      const userMoods = await MoodRecordModel.find({ userId: user.id }).sort({ date: -1 }).limit(3).lean();
      const moodContext = userMoods.map(m => `Score: ${m.score}/7 on date ${m.date}: ${m.notes}`).join("; ");

      const prompt = `Return a single, short, beautiful, and deeply positive satori mindfulness insight specifically for our client ${user.name}. Keep it strictly to one or two short sentence(s) (maximum 30 words). Keep it warm, therapeutic, and highly encouraging.
      User's goals: ${user.mentalWellnessGoals?.join(", ") || "General emotional presence"}.
      Recent Moods: ${moodContext || "None logged yet"}.`;

      const response = await aiInstance.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are 'Nirvana', an elite luxury-class AI Therapist. You speak in short, poetic, and highly precise satori mindfulness insights. Return your advice directly as raw text (no JSON formatting for this endpoint, just a simple text sentence).",
        }
      });

      res.json({ advice: response.text?.trim() || `Breathe deeply, ${user.name}. You are in a safe, quiet harbor.` });
    } catch (err) {
      res.json({ advice: `Align your breath, ${user.name || "friend"}. Let your thoughts settle like silt in clear water.` });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch advisor" });
  }
});

// POST endpoint for chat messages
app.post("/api/chat/advisor", authenticate, async (req: Request, res: Response) => {
  try {
    const decoded = (req as any).user;
    const { message } = req.body;
    
    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return res.status(400).json({ error: "Message is required" });
    }

    if (message.length > 5000) {
      return res.status(400).json({ error: "Message too long (max 5000 chars)" });
    }

    const user = await Database.findUserById(decoded.id);
    if (!user) {
      return res.status(404).json({ error: "User profile not found." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey === "MOCK_KEY") {
      const fallbackResponses = [
        `I hear you, ${user.name || "friend"}. That sounds challenging. What feelings come up most strongly for you right now?`,
        `Thank you for sharing that, ${user.name || "friend"}. It takes courage to express what's on your mind.`,
        `I'm listening, ${user.name || "friend"}. Can you tell me more about what's been troubling you?`,
        `That's important, ${user.name || "friend"}. Have you had a chance to practice any grounding techniques?`,
        `Your feelings are valid, ${user.name || "friend"}. Let's explore what might help you feel more at ease.`
      ];
      const randomIndex = Math.floor(Math.random() * fallbackResponses.length);
      return res.json({ 
        advice: fallbackResponses[randomIndex],
        crisisDetected: false 
      });
    }

    try {
      const { GoogleGenAI } = await import("@google/genai");
      const aiInstance = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const { MoodRecordModel } = await import("./src/server/db.js");
      const userMoods = await MoodRecordModel.find({ userId: user.id }).sort({ date: -1 }).limit(3).lean();
      const moodContext = userMoods.map(m => `Score: ${m.score}/7 on date ${m.date}: ${m.notes}`).join("; ");

      const crisisKeywords = ["suicide", "kill myself", "hurt myself", "harm", "dangerous", "overdose"];
      const hasCrisisKeyword = crisisKeywords.some(keyword => message.toLowerCase().includes(keyword));

      const prompt = `You are Nirvana, an elite luxury-class AI Therapist trained in CBT and DBT frameworks. The user just said: "${message}"

User context - Goals: ${user.mentalWellnessGoals?.join(", ") || "General emotional presence"}
Recent mood patterns: ${moodContext || "None logged yet"}.

${hasCrisisKeyword ? "⚠️ POTENTIAL CRISIS DETECTED - Respond with warmth and suggest immediate help resources while acknowledging their pain." : ""}

Respond with ONE brief, warm, therapeutic response (max 100 words). Ask a clarifying question or validate their feelings. Speak in first person. No JSON formatting, just plain text.`;

      const response = await aiInstance.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are Nirvana, an empathetic AI therapist. Respond warmly, briefly, and with genuine care. Always validate feelings. If crisis detected, suggest 988 or local emergency services.",
        }
      });

      const advice = response.text?.trim() || `I'm here for you, ${user.name}. Your feelings matter.`;

      res.json({ 
        advice: advice,
        crisisDetected: hasCrisisKeyword
      });
    } catch (err) {
      console.warn("Gemini API error, using fallback:", err);
      res.json({ 
        advice: `I hear you, ${user.name || "friend"}. Let's take a moment to breathe together. What would help you feel more grounded right now?`,
        crisisDetected: false 
      });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to process message" });
  }
});

app.get("/api/chat/sessions", authenticate, async (req: Request, res: Response) => {
  try {
    const decoded = (req as any).user;
    const { ChatSessionModel } = await import("./src/server/db.js");
    const list = await ChatSessionModel.find({ userId: decoded.id })
      .sort({ updatedAt: -1 })
      .lean();
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch sessions" });
  }
});

app.post("/api/chat/sessions", authenticate, async (req: Request, res: Response) => {
  try {
    const decoded = (req as any).user;
    const { category, title } = req.body;
    const { ChatSessionModel } = await import("./src/server/db.js");

    const session = await ChatSessionModel.create({
      id: "sess_" + Math.random().toString(36).substr(2, 9),
      userId: decoded.id,
      category: category || "General",
      title: title || `${category || "Mindful"} Counseling Session`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ error: "Failed to create session" });
  }
});

app.get("/api/chat/messages/:sessionId", authenticate, async (req: Request, res: Response) => {
  try {
    const decoded = (req as any).user;
    const { ChatSessionModel, ChatMessageModel } = await import("./src/server/db.js");
    
    // Security validation
    const session = await ChatSessionModel.findOne({ id: req.params.sessionId, userId: decoded.id });
    if (!session) {
      return res.status(404).json({ error: "Chat session invalid or unauthorized." });
    }

    const msgs = await ChatMessageModel.find({ sessionId: req.params.sessionId })
      .sort({ createdAt: 1 })
      .lean();
    res.json(msgs);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

app.post("/api/chat/reply", authenticate, async (req: Request, res: Response) => {
  try {
    const decoded = (req as any).user;
    const { sessionId, content } = req.body;

    if (!sessionId || !content) {
      return res.status(400).json({ error: "Session identification and message content are required." });
    }

    const { ChatSessionModel, ChatMessageModel, CrisisLogModel } = await import("./src/server/db.js");
    const session = await ChatSessionModel.findOne({ id: sessionId, userId: decoded.id });
    if (!session) {
      return res.status(444).json({ error: "Unauthorized chat flow access." });
    }

    // Get conversation logs for memory context
    const previous = await ChatMessageModel.find({ sessionId })
      .sort({ createdAt: 1 })
      .limit(10)
      .lean();

    // Push user message
    const userMsg = await ChatMessageModel.create({
      id: "msg_" + Math.random().toString(36).substr(2, 9),
      sessionId,
      sender: "user",
      content,
      createdAt: new Date().toISOString()
    });

    // Trigger Gemini processing
    const aiResult = await analyzeAndCounsel(content, previous as any, (session as any).category);

    // If crisis is flagged, log incident report in crisisLogs table
    if (aiResult.crisisDetected) {
      const user = await Database.findUserById(decoded.id);
      await CrisisLogModel.create({
        id: "crisis_" + Math.random().toString(36).substr(2, 9),
        userId: decoded.id,
        userName: user ? user.name : "Anonymous Sanctuary Seeker",
        severity: aiResult.stressLevel > 90 ? "critical" : "high",
        content: content,
        flaggedWords: ["Crisis Triggers Flagged"],
        incidentTime: new Date().toISOString(),
        status: "active",
        responseActions: [
          "Present system resource guidance immediately on client dashboard.",
          "Highlight national mental health contacts list in UI banner."
        ]
      });
    }

    // Save matching AI dialogue
    const aiMsg = await ChatMessageModel.create({
      id: "msg_" + Math.random().toString(36).substr(2, 9),
      sessionId,
      sender: "ai",
      content: aiResult.response,
      sentiment: aiResult.sentiment,
      stressLevel: aiResult.stressLevel,
      anxietyLevel: aiResult.anxietyLevel,
      emotion: aiResult.primaryEmotion,
      copingStrategies: aiResult.copingStrategies,
      mindfulnessSuggestions: aiResult.mindfulnessSuggestions,
      breathingExercise: aiResult.breathingExercise,
      createdAt: new Date().toISOString()
    });

    // Update session latest response activity
    session.updatedAt = new Date().toISOString();
    await ChatSessionModel.findByIdAndUpdate(session._id, { updatedAt: session.updatedAt });

    res.json({
      userMessage: userMsg,
      aiMessage: aiMsg,
      analysis: {
        sentiment: aiResult.sentiment,
        stressLevel: aiResult.stressLevel,
        anxietyLevel: aiResult.anxietyLevel,
        emotion: aiResult.primaryEmotion,
        crisisDetected: aiResult.crisisDetected,
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to process chat reply" });
  }
});

// ============================================
// THERAPY SESSION REGISTRATION & PLANNERS
// ============================================
app.get("/api/sessions", authenticate, async (req: Request, res: Response) => {
  try {
    const decoded = (req as any).user;
    const { TherapySessionModel } = await import("./src/server/db.js");
    const list = await TherapySessionModel.find({ userId: decoded.id })
      .sort({ sessionDate: -1 })
      .lean();
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch sessions" });
  }
});

app.post("/api/sessions", authenticate, async (req: Request, res: Response) => {
  try {
    const decoded = (req as any).user;
    const { notes, summary, moodBefore, moodAfter, recommendations, progressScore } = req.body;
    const { TherapySessionModel } = await import("./src/server/db.js");

    const therapy = await TherapySessionModel.create({
      id: "session_" + Math.random().toString(36).substr(2, 9),
      userId: decoded.id,
      therapistId: "therapist_dr_clara",
      therapistName: "Dr. Clara Sterling, PhD",
      sessionDate: new Date().toISOString().split("T")[0],
      notes: notes || "Quiet wellness dialogue",
      summary: summary || "Reviewed boundary settings, focus strategies and paced breathing integration.",
      moodBefore: parseInt(moodBefore) || 3,
      moodAfter: parseInt(moodAfter) || 5,
      recommendations: recommendations || ["Commit to box breathing for 5 minutes daily", "Write down gratitude journals daily"],
      progressScore: parseInt(progressScore) || 75,
      createdAt: new Date().toISOString()
    });

    res.status(201).json(therapy);
  } catch (error) {
    res.status(500).json({ error: "Failed to create therapy session" });
  }
});

// ============================================
// WELLNESS GAMES AND ACTIVITIES
// ============================================
app.get("/api/activities", authenticate, async (req: Request, res: Response) => {
  try {
    const { ActivityModel } = await import("./src/server/db.js");
    const activities = await ActivityModel.find().lean();
    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch activities" });
  }
});

app.post("/api/activities/complete", authenticate, async (req: Request, res: Response) => {
  try {
    const decoded = (req as any).user;
    const { activityId, durationCompleted } = req.body;

    if (!activityId) {
      return res.status(400).json({ error: "Activity identification is required." });
    }

    const { ActivityModel, UserActivityModel, SystemNotificationModel } = await import("./src/server/db.js");
    const activity = await ActivityModel.findOne({ id: activityId }).lean();
    if (!activity) {
      return res.status(404).json({ error: "Wellness activity not found." });
    }

    const points = activity.points;
    const log = await UserActivityModel.create({
      id: "log_" + Math.random().toString(36).substr(2, 9),
      userId: decoded.id,
      activityId,
      durationCompleted: durationCompleted || activity.durationMinutes,
      pointsEarned: points,
      completedAt: new Date().toISOString()
    });

    // Push immediate notification rewards
    const notif = await SystemNotificationModel.create({
      id: "notif_" + Math.random().toString(36).substr(2, 9),
      userId: decoded.id,
      title: "Activities Completion Bonus",
      content: `A beautiful session! You aligned your breath and earned +${points} wellness score points. Keep breathing!`,
      isRead: false,
      createdAt: new Date().toISOString()
    });

    res.json({ log, notification: notif });
  } catch (error) {
    res.status(500).json({ error: "Failed to complete activity" });
  }
});

app.post("/api/activities/log", authenticate, async (req: Request, res: Response) => {
  try {
    const decoded = (req as any).user;
    const { activityId, score, durationCompleted } = req.body;

    if (!activityId) {
      return res.status(400).json({ error: "Activity identification is required." });
    }

    const { ActivityModel, UserActivityModel, SystemNotificationModel } = await import("./src/server/db.js");
    const activity = await ActivityModel.findOne({ id: activityId }).lean();
    const points = score !== undefined ? parseInt(score) : (activity ? activity.points : 50);

    const log = await UserActivityModel.create({
      id: "log_" + Math.random().toString(36).substr(2, 9),
      userId: decoded.id,
      activityId,
      durationCompleted: durationCompleted || (activity ? activity.durationMinutes : 5),
      pointsEarned: points,
      completedAt: new Date().toISOString()
    });

    // Push immediate notification rewards
    const notif = await SystemNotificationModel.create({
      id: "notif_" + Math.random().toString(36).substr(2, 9),
      userId: decoded.id,
      title: "Activities Completion Bonus",
      content: `A beautiful session! You aligned your breath and earned +${points} wellness score points. Keep breathing!`,
      isRead: false,
      createdAt: new Date().toISOString()
    });

    // Update streak count or similar if needed? Or just get the current user profile
    const user = await Database.findUserById(decoded.id);

    res.json({ 
      log, 
      notification: notif, 
      user: user ? {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        preferences: user.preferences,
        streakCount: user.streakCount,
        goals: user.mentalWellnessGoals,
        age: user.age,
        gender: user.gender
      } : null 
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to log activity" });
  }
});

// ============================================
// NOTIFICATIONS API
// ============================================
app.get("/api/notifications", authenticate, async (req: Request, res: Response) => {
  try {
    const decoded = (req as any).user;
    const { SystemNotificationModel } = await import("./src/server/db.js");
    const list = await SystemNotificationModel.find({ userId: decoded.id })
      .sort({ createdAt: -1 })
      .lean();
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

app.post("/api/notifications/read/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const decoded = (req as any).user;
    const { SystemNotificationModel } = await import("./src/server/db.js");
    const notif = await SystemNotificationModel.findOne({ id: req.params.id, userId: decoded.id });
    if (notif) {
      await SystemNotificationModel.findByIdAndUpdate(notif._id, { isRead: true });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to update notification" });
  }
});

// ============================================
// ADMIN PANEL DIRECT SERVICES
// ============================================
app.get("/api/admin/metrics", authenticate, requireRole(["admin"]), async (req: Request, res: Response) => {
  try {
    const { UserModel, ChatSessionModel, ChatMessageModel, CrisisLogModel, MoodRecordModel } = await import("./src/server/db.js");
    
    // Safety statistics calculator
    const totalUsers = await UserModel.countDocuments();
    const totalsessions = await ChatSessionModel.countDocuments();
    const crisisReportsCount = await CrisisLogModel.countDocuments();

    // Compile aggregate mood tracker distribution
    const moods = await MoodRecordModel.find().lean();
    const moodAggregation = moods.reduce((acc: Record<string, number>, m: any) => {
      const key = String(m.score);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    // High stress incidents
    const highStressIncidents = await ChatMessageModel.countDocuments({ stressLevel: { $gt: 80 } });

    // System Health details
    const systemHealth = {
      databaseStatus: "Green/Optimal",
      latencyMs: 12,
      serviceLoad: "0.2%",
      hostIngressPort: PORT,
    };

    const crisisLogs = await CrisisLogModel.find()
      .sort({ incidentTime: -1 })
      .lean();

    const allUsers = await UserModel.find()
      .select("id name email role streakCount createdAt")
      .lean();

    res.json({
      totalUsers,
      totalsessions,
      crisisReportsCount,
      moodAggregation,
      highStressIncidents,
      crisisLogs,
      systemHealth,
      allUsers: allUsers.map((u: any) => ({ id: u.id, name: u.name, email: u.email, role: u.role, streak: u.streakCount, joined: u.createdAt }))
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch metrics" });
  }
});

app.get("/api/crisis/logs", authenticate, requireRole(["admin", "therapist"]), async (req: Request, res: Response) => {
  try {
    const { CrisisLogModel } = await import("./src/server/db.js");
    const sorted = await CrisisLogModel.find()
      .sort({ incidentTime: -1 })
      .lean();
    res.json(sorted);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch crisis logs" });
  }
});

// ============================================
// MOUNT ENVIRONMENT ENGINE
// ============================================
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Nirvana Server Sanctuary is sailing at http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
