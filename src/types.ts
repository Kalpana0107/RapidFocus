export type UserRole = "Student" | "Professional" | "Entrepreneur";

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  deadline: string; // ISO date string
  priority: "Critical" | "High" | "Medium" | "Low";
  category: string;
  completed: boolean;
  completedAt?: string | null;
  aiPriorityScore?: number; // 1-10
  aiReasoning?: string;
  suggestedTimeBlock?: string;
  createdAt: string;
  timeSpent?: number; // total seconds spent
  timerMode?: 'stopwatch' | 'timer';
  wasOnTime?: boolean;
  mood?: "Excited" | "Good" | "Neutral" | "Tired" | "Anxious";
  moodUpdatedAt?: string;
}

export interface Goal {
  id: string;
  title: string;
  type: "goal" | "habit";
  targetDays?: number; // Target times per week for goals
  completedDays: string[]; // List of historical completion dates like "YYYY-MM-DD"
  streak: number;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
}
