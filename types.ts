export interface Instructor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  color: string;
}

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  notes?: string;
}

export interface Lesson {
  id: string;
  studentId: string;
  instructorId: string;
  start: string; // ISO string
  end: string; // ISO string
  confirmed: boolean;
}

export interface AppSettings {
  twilioAccountSid: string;
  twilioAuthToken: string;
  twilioPhoneNumber: string;
  notificationMethod: 'SMS' | 'WHATSAPP';
}

export type ViewState = 'DASHBOARD' | 'PLANNING' | 'STUDENTS' | 'INSTRUCTORS' | 'SETTINGS';

export const COLORS = [
  '#3b82f6', // Blue
  '#ef4444', // Red
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#84cc16', // Lime
];
