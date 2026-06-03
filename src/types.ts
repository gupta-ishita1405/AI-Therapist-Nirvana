export interface UserPreferences {
  theme: "light" | "dark";
  soundVolume: number;
  dailyGoalMinutes: number;
  activitiesSelected: string[];
}

export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: "user" | "therapist" | "admin";
  preferences: UserPreferences;
  streakCount: number;
  goals: string[];
  age?: number;
  gender?: string;
}

export interface MoodRecord {
  id: string;
  userId: string;
  score: number;
  emoji: string;
  notes: string;
  date: string;
  createdAt: string;
}

export interface JournalEntry {
  id: string;
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
  id: string;
  userId: string;
  category: "Stress" | "Anxiety" | "Depression" | "Loneliness" | "Motivation" | "Self Confidence" | "Relationships" | "Career" | "General";
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
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
  id: string;
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
  id: string;
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
  id: string;
  title: string;
  category: "breathing" | "zen_garden" | "forest" | "ocean";
  description: string;
  durationMinutes: number;
  points: number;
}
