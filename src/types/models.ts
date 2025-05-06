/**
 * Event type definition based on backend EventSchema
 */
export interface Event {
  _id?: string;
  title: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  place: string;
  isAllDay?: boolean;
  isRepeatable?: boolean;
  frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly' | null;
  repeatCount?: number | null;
  repeatUntil?: string | null; // ISO date string
}

/**
 * Note type definition based on backend Note schema
 */
export interface Note {
  _id?: string;
  title: string;
  category: string;
  content: string;
  creation: string; // ISO date string
  lastMod: string;
  categories: string[];
}

/**
 * Activity type definition based on backend ActivitySchema
 */
export interface Activity {
  _id?: string;
  startDate: string; // ISO date string
  dueDate: string; // ISO date string
  finished: boolean;
  description: string;
}

/**
 * Pomodoro type definition for frontend
 */
export interface Pomodoro {
  _id?: string;
  studyTime: number;
  breakTime: number;
  totalTime?: number;
  completed?: boolean;
  timestamp?: string; // ISO date string
}

/**
 * Project type definition for frontend
 */
export interface Project {
  _id?: string;
  name: string;
  description?: string;
  deadline: string; // ISO date string
  status?: 'not-started' | 'in-progress' | 'completed';
}
