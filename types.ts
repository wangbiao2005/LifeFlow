
export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
}

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Goal {
  id: string;
  title: string;
  category: 'career' | 'finance' | 'health' | 'skill' | 'lifestyle' | 'other';
  description: string;
  milestones: Milestone[];
  progress: number; // 0-100
  deadline?: string;
  difficulty: Difficulty;
}

export type Priority = 'high' | 'medium' | 'low';

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  date: string; // YYYY-MM-DD
  relatedGoalId?: string;
  relatedMilestoneId?: string;
  priority: Priority;
  difficulty: Difficulty;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  taskPlan?: AITaskPlan;
  goalPlan?: AIGoalPlan;
}

export interface AITaskPlan {
  title: string;
  items: {
    title: string;
    priority: Priority;
    difficulty: Difficulty;
  }[];
}

export interface AIGoalPlan {
  title: string;
  description: string;
  category: Goal['category'];
  difficulty: Difficulty;
  milestones: string[];
}

export interface JournalEntry {
  id: string;
  date: string;
  content: string;
  mood: 'great' | 'good' | 'neutral' | 'bad' | 'terrible';
  tags?: string[];
  aiFeedback?: string;
}

export type ViewState = 'dashboard' | 'planner' | 'goals' | 'focus' | 'journal' | 'coach';

export type AIProvider = 'gemini' | 'deepseek' | 'custom';

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  baseUrl: string;
  modelName: string;
}

export interface UserStats {
  level: number;
  currentXP: number;
  totalXP: number;
  streakDays: number;
  lastActiveDate: string;
  avatar?: string;
  lifeVision?: string; // New field for user's dream/motto
}

export type SoundMode = 'none' | 'rain' | 'forest' | 'cafe' | 'ocean' | 'fire' | 'night' | 'thunder' | 'river';

export interface DailyQuote {
  text: string;
  author: string;
  date: string;
}

export type ToastType = 'success' | 'info' | 'encouragement';

export interface ToastMessage {
  id: string;
  text: string;
  type: ToastType;
}

export type CoachMode = 'empathetic' | 'strict' | 'strategic';

export interface CoachContext {
  goals: Goal[];
  tasks: Task[];
  journalEntries: JournalEntry[];
  focusMinutes: number;
  userStats: UserStats;
}
