import mongoose, { Schema } from "mongoose";
import { hashPassword } from "./crypto.js";

// Define the absolute schema structures and records for Nirvana
export interface UserPreferences {
  theme: "light" | "dark";
  soundVolume: number;
  dailyGoalMinutes: number;
  activitiesSelected: string[];
}

export interface User {
  id?: string;
  email: string;
  name: string;
  passwordHash: string;
  role: "user" | "therapist" | "admin";
  age?: number;
  gender?: string;
  preferences: UserPreferences;
  mentalWellnessGoals: string[];
  streakCount: number;
  lastActiveDate?: string;
  createdAt: string;
}

export interface MoodRecord {
  id?: string;
  userId: string;
  score: number;
  emoji: string;
  notes: string;
  date: string;
  createdAt: string;
}

export interface JournalEntry {
  id?: string;
  userId: string;
  title: string;
  content: string;
  moodAttached?: number;
  tags: string[];
  category: "Reflections" | "Gratitude" | "Anxiety Relief" | "Personal Growth" | "Dream Journal" | "Other";
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChatSession {
  id?: string;
  userId: string;
  category: "Stress" | "Anxiety" | "Depression" | "Loneliness" | "Motivation" | "Self Confidence" | "Relationships" | "Career" | "General";
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id?: string;
  sessionId: string;
  sender: "user" | "ai";
  content: string;
  sentiment?: string;
  stressLevel?: number;
  anxietyLevel?: number;
  emotion?: string;
  copingStrategies?: string[];
  mindfulnessSuggestions?: string[];
  breathingExercise?: string;
  createdAt: string;
}

export interface CrisisLog {
  id?: string;
  userId: string;
  userName: string;
  severity: "low" | "medium" | "high" | "critical";
  content: string;
  flaggedWords: string[];
  incidentTime: string;
  status: "active" | "resolved" | "monitoring";
  responseActions: string[];
}

export interface TherapySession {
  id?: string;
  userId: string;
  therapistId?: string;
  therapistName?: string;
  sessionDate: string;
  notes: string;
  summary?: string;
  moodBefore: number;
  moodAfter: number;
  recommendations: string[];
  progressScore: number;
  createdAt: string;
}

export interface Activity {
  id?: string;
  title: string;
  category: "breathing" | "zen_garden" | "forest" | "ocean";
  description: string;
  durationMinutes: number;
  points: number;
}

export interface UserActivity {
  id?: string;
  userId: string;
  activityId: string;
  durationCompleted: number;
  pointsEarned: number;
  completedAt: string;
}

export interface SystemNotification {
  id?: string;
  userId: string;
  title: string;
  content: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

// MongoDB Schemas
const userPreferencesSchema = new Schema({
  theme: { type: String, enum: ["light", "dark"], default: "light" },
  soundVolume: { type: Number, default: 50 },
  dailyGoalMinutes: { type: Number, default: 15 },
  activitiesSelected: [String]
});

const userSchema = new Schema(
  {
    id: { type: String, unique: true, sparse: true },
    email: { type: String, unique: true, required: true },
    name: { type: String, required: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["user", "therapist", "admin"], default: "user" },
    age: Number,
    gender: String,
    preferences: userPreferencesSchema,
    mentalWellnessGoals: [String],
    streakCount: { type: Number, default: 0 },
    lastActiveDate: String,
    createdAt: { type: String, default: () => new Date().toISOString() }
  },
  { collection: "users" }
);

const moodRecordSchema = new Schema(
  {
    id: { type: String, unique: true, sparse: true },
    userId: { type: String, required: true },
    score: { type: Number, min: 1, max: 7, required: true },
    emoji: String,
    notes: String,
    date: String,
    createdAt: { type: String, default: () => new Date().toISOString() }
  },
  { collection: "moods" }
);

const journalEntrySchema = new Schema(
  {
    id: { type: String, unique: true, sparse: true },
    userId: { type: String, required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    moodAttached: Number,
    tags: [String],
    category: { type: String, enum: ["Reflections", "Gratitude", "Anxiety Relief", "Personal Growth", "Dream Journal", "Other"] },
    isPrivate: { type: Boolean, default: false },
    createdAt: { type: String, default: () => new Date().toISOString() },
    updatedAt: { type: String, default: () => new Date().toISOString() }
  },
  { collection: "journals" }
);

const chatSessionSchema = new Schema(
  {
    id: { type: String, unique: true, sparse: true },
    userId: { type: String, required: true },
    category: { type: String, enum: ["Stress", "Anxiety", "Depression", "Loneliness", "Motivation", "Self Confidence", "Relationships", "Career", "General"] },
    title: String,
    createdAt: { type: String, default: () => new Date().toISOString() },
    updatedAt: { type: String, default: () => new Date().toISOString() }
  },
  { collection: "chatSessions" }
);

const chatMessageSchema = new Schema(
  {
    id: { type: String, unique: true, sparse: true },
    sessionId: { type: String, required: true },
    sender: { type: String, enum: ["user", "ai"], required: true },
    content: { type: String, required: true },
    sentiment: String,
    stressLevel: Number,
    anxietyLevel: Number,
    emotion: String,
    copingStrategies: [String],
    mindfulnessSuggestions: [String],
    breathingExercise: String,
    createdAt: { type: String, default: () => new Date().toISOString() }
  },
  { collection: "chatMessages" }
);

const crisisLogSchema = new Schema(
  {
    id: { type: String, unique: true, sparse: true },
    userId: { type: String, required: true },
    userName: String,
    severity: { type: String, enum: ["low", "medium", "high", "critical"] },
    content: String,
    flaggedWords: [String],
    incidentTime: String,
    status: { type: String, enum: ["active", "resolved", "monitoring"], default: "active" },
    responseActions: [String]
  },
  { collection: "crisisLogs" }
);

const therapySessionSchema = new Schema(
  {
    id: { type: String, unique: true, sparse: true },
    userId: { type: String, required: true },
    therapistId: String,
    therapistName: String,
    sessionDate: String,
    notes: String,
    summary: String,
    moodBefore: Number,
    moodAfter: Number,
    recommendations: [String],
    progressScore: Number,
    createdAt: { type: String, default: () => new Date().toISOString() }
  },
  { collection: "therapySessions" }
);

const activitySchema = new Schema(
  {
    id: { type: String, unique: true, sparse: true },
    title: { type: String, required: true },
    category: { type: String, enum: ["breathing", "zen_garden", "forest", "ocean"], required: true },
    description: String,
    durationMinutes: Number,
    points: Number
  },
  { collection: "activities" }
);

const userActivitySchema = new Schema(
  {
    id: { type: String, unique: true, sparse: true },
    userId: { type: String, required: true },
    activityId: { type: String, required: true },
    durationCompleted: Number,
    pointsEarned: Number,
    completedAt: String
  },
  { collection: "userActivities" }
);

const systemNotificationSchema = new Schema(
  {
    id: { type: String, unique: true, sparse: true },
    userId: { type: String, required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    link: String,
    createdAt: { type: String, default: () => new Date().toISOString() }
  },
  { collection: "notifications" }
);

// MongoDB Models
export const UserModel = mongoose.model<User & { _id: any }>("User", userSchema);
export const MoodRecordModel = mongoose.model<MoodRecord & { _id: any }>("MoodRecord", moodRecordSchema);
export const JournalEntryModel = mongoose.model<JournalEntry & { _id: any }>("JournalEntry", journalEntrySchema);
export const ChatSessionModel = mongoose.model<ChatSession & { _id: any }>("ChatSession", chatSessionSchema);
export const ChatMessageModel = mongoose.model<ChatMessage & { _id: any }>("ChatMessage", chatMessageSchema);
export const CrisisLogModel = mongoose.model<CrisisLog & { _id: any }>("CrisisLog", crisisLogSchema);
export const TherapySessionModel = mongoose.model<TherapySession & { _id: any }>("TherapySession", therapySessionSchema);
export const ActivityModel = mongoose.model<Activity & { _id: any }>("Activity", activitySchema);
export const UserActivityModel = mongoose.model<UserActivity & { _id: any }>("UserActivity", userActivitySchema);
export const SystemNotificationModel = mongoose.model<SystemNotification & { _id: any }>("SystemNotification", systemNotificationSchema);

// Define seed activities for dynamic system rendering
const DEFAULT_ACTIVITIES = [
  { id: "act_box_breath", title: "Box Breathing session", category: "breathing" as const, description: "Standard tactical composure breathing cycle used to regulate heart rate.", durationMinutes: 5, points: 50 },
  { id: "act_478_breath", title: "4-7-8 Deep Rest", category: "breathing" as const, description: "Dr. Weil's neural relaxation protocol for deep rest and fast calming.", durationMinutes: 8, points: 80 },
  { id: "act_zen_sand", title: "Zen Stone & Sand Raking", category: "zen_garden" as const, description: "Interactive tactile layout arranging smooth river stone templates.", durationMinutes: 10, points: 100 },
  { id: "act_forest_thought", title: "Thought Catching Meadow", category: "forest" as const, description: "Capturing float-down positive thoughts behind soft forest chimes.", durationMinutes: 6, points: 60 },
  { id: "act_ocean_breath", title: "Binaural Ocean Waves Synced Timer", category: "ocean" as const, description: "Matching your lung capacity to smooth visual barometric tide waves.", durationMinutes: 5, points: 50 }
];

export class Database {
  private static connected = false;

  public static async connect(): Promise<void> {
    if (this.connected) return;

    try {
      const mongoUri = process.env.MONGODB_URI;
      if (!mongoUri) {
        throw new Error("MONGODB_URI environment variable not set");
      }

      await mongoose.connect(mongoUri);
      this.connected = true;
      console.log("✓ Connected to MongoDB");

      // Seed default activities if collection is empty
      const activityCount = await ActivityModel.countDocuments();
      if (activityCount === 0) {
        await ActivityModel.insertMany(DEFAULT_ACTIVITIES);
        console.log("✓ Seeded default activities");
      }

      // Seed default users if collection is empty
      const userCount = await UserModel.countDocuments();
      if (userCount === 0) {
        const defaultUsers = [
          {
            id: "user_client",
            email: "client@nirvana.com",
            name: "Emily Vance",
            passwordHash: hashPassword("password123"),
            role: "user" as const,
            age: 28,
            gender: "Female",
            preferences: {
              theme: "light" as const,
              soundVolume: 50,
              dailyGoalMinutes: 15,
              activitiesSelected: ["act_box_breath", "act_zen_sand"]
            },
            mentalWellnessGoals: ["Reduce Stress", "Calm Daily Anxiety"],
            streakCount: 5,
            lastActiveDate: new Date().toISOString().split("T")[0],
            createdAt: new Date().toISOString()
          },
          {
            id: "user_therapist",
            email: "therapist@nirvana.com",
            name: "Dr. Alistair Finch",
            passwordHash: hashPassword("therapist123"),
            role: "therapist" as const,
            age: 42,
            gender: "Male",
            preferences: {
              theme: "light" as const,
              soundVolume: 50,
              dailyGoalMinutes: 15,
              activitiesSelected: ["act_box_breath", "act_zen_sand"]
            },
            mentalWellnessGoals: ["Navigate Relationship Dynamics"],
            streakCount: 1,
            lastActiveDate: new Date().toISOString().split("T")[0],
            createdAt: new Date().toISOString()
          },
          {
            id: "user_admin",
            email: "admin@nirvana.com",
            name: "Satori Administrator",
            passwordHash: hashPassword("admin123"),
            role: "admin" as const,
            age: 35,
            gender: "Non-binary",
            preferences: {
              theme: "light" as const,
              soundVolume: 50,
              dailyGoalMinutes: 15,
              activitiesSelected: ["act_box_breath", "act_zen_sand"]
            },
            mentalWellnessGoals: [],
            streakCount: 1,
            lastActiveDate: new Date().toISOString().split("T")[0],
            createdAt: new Date().toISOString()
          }
        ];
        await UserModel.insertMany(defaultUsers);
        console.log("✓ Seeded default users");
      }
    } catch (error) {
      console.error("MongoDB connection error:", error);
      throw error;
    }
  }

  public static async load(): Promise<void> {
    await this.connect();
  }

  public static async save(): Promise<void> {
    // MongoDB saves automatically
  }

  // User operations
  public static async findUserByEmail(email: string): Promise<User | null> {
    return UserModel.findOne({ email: email.toLowerCase() }).lean() as Promise<User | null>;
  }

  public static async findUserById(id: string): Promise<User | null> {
    return UserModel.findOne({ id }).lean() as Promise<User | null>;
  }

  public static async addUser(user: User): Promise<void> {
    await UserModel.create(user);
  }

  public static async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    return UserModel.findOneAndUpdate({ id }, updates, { new: true }).lean() as Promise<User | null>;
  }

  public static async deleteUser(id: string): Promise<boolean> {
    const result = await UserModel.deleteOne({ id });
    await Promise.all([
      MoodRecordModel.deleteMany({ userId: id }),
      JournalEntryModel.deleteMany({ userId: id }),
      ChatSessionModel.deleteMany({ userId: id }),
      ChatMessageModel.deleteMany({}),
      TherapySessionModel.deleteMany({ userId: id }),
      UserActivityModel.deleteMany({ userId: id }),
      SystemNotificationModel.deleteMany({ userId: id })
    ]);
    return result.deletedCount > 0;
  }
}
