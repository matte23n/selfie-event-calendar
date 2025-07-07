interface BaseModel {
  _id?: string;
}

/**
 * Event type definition based on backend EventSchema
 */
export interface Event extends BaseModel {
  title: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  place?: string;
  isAllDay?: boolean;
  isRepeatable?: boolean;
  frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly' | null;
  repeatCount?: number | null;
  repeatUntil?: string | null; // ISO date string
  isStudyCycle?: boolean; // Flag for study cycle events
  studyCycleData?: StudyCycleData; // Additional data for study cycle events
  notifications?: NotificationSetting[];
  invitedUsers?: string[]; // Array of user IDs or emails
}

/**
 * Note type definition based on backend Note schema
 */
export interface Note extends BaseModel {
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
export interface Activity extends BaseModel {
  startDate: string; // ISO date string
  dueDate: string; // ISO date string
  finished: boolean;
  description: string;
}

/**
 * Pomodoro type definition for frontend
 */
export interface Pomodoro extends BaseModel {
  studyTime: number;
  breakTime: number;
  totalTime?: number;
  completed?: boolean;
  timestamp?: string; // ISO date string
}

/**
 * Project type definition for frontend
 */
export interface Project extends BaseModel {
  name: string;
  description?: string;
  deadline: string; // ISO date string
  status?: 'not-started' | 'in-progress' | 'completed';
}

/**
 * Study Cycle Data for a calendar event
 */
export interface StudyCycleData extends BaseModel {
  studyTime: number; // minutes per study session
  breakTime: number; // minutes per break
  totalCycles: number; // total number of cycles 
  completedCycles: number; // number of completed cycles
  lastProgress?: string; // ISO date string for last progress
}

export interface NotificationSetting {
  type: NotificationType;
  advanceTime: number; // in minutes
  advanceUnit: string;
  repeat?: RepeatSetting;
}

export type NotificationType = 'system' | 'alert' | 'email' | 'whatsapp';

export interface RepeatSetting {
  type: 'count' | 'interval' | 'until-response';
  count?: number; // Number of times to repeat
  interval?: number; // Repeat interval in minutes
  responded?: boolean; // For until-response type
}
