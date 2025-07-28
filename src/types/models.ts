interface BaseModel {
  _id?: string;
}

export interface Event extends BaseModel {
  title: string;
  startDate: string;
  endDate: string;
  place?: string;
  isAllDay?: boolean;
  isRepeatable?: boolean;
  frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly' | null;
  repeatCount?: number | null;
  repeatUntil?: string | null;
  isStudyCycle?: boolean;
  studyCycleData?: StudyCycleData;
  notifications?: NotificationSetting[];
  invitedUsers?: string[];
}

export interface Note extends BaseModel {
  _id?: string;
  title: string;
  category: string;
  content: string;
  creation: string;
  lastMod: string;
  categories: string[];
}

export interface Activity extends BaseModel {
  startDate: string;
  dueDate: string;
  finished: boolean;
  description: string;
}

export interface Pomodoro extends BaseModel {
  studyTime: number;
  breakTime: number;
  totalTime?: number;
  completed?: boolean;
  timestamp?: string;
}

export interface Project extends BaseModel {
  name: string;
  description?: string;
  deadline: string;
  status?: 'not-started' | 'in-progress' | 'completed';
}

export interface StudyCycleData extends BaseModel {
  studyTime: number;
  breakTime: number;
  totalCycles: number;
  completedCycles: number;
  lastProgress?: string;
}

export interface NotificationSetting {
  type: NotificationType;
  advanceTime: number;
  advanceUnit: string;
  repeat?: RepeatSetting;
}

export type NotificationType = 'system' | 'alert' | 'email' | 'whatsapp';

export interface RepeatSetting {
  type: 'count' | 'interval' | 'until-response';
  count?: number;
  interval?: number;
  responded?: boolean;
}
