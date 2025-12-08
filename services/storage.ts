import { Instructor, Student, Lesson, AppSettings, COLORS } from '../types';

const KEYS = {
  INSTRUCTORS: 'autoplanning_instructors',
  STUDENTS: 'autoplanning_students',
  LESSONS: 'autoplanning_lessons',
  SETTINGS: 'autoplanning_settings',
};

const DEFAULT_SETTINGS: AppSettings = {
  twilioAccountSid: '',
  twilioAuthToken: '',
  twilioPhoneNumber: '',
  notificationMethod: 'SMS',
};

// Seed data if empty
const seedData = () => {
  if (!localStorage.getItem(KEYS.INSTRUCTORS)) {
    const instructors: Instructor[] = [
      { id: '1', firstName: 'Jean', lastName: 'Dupont', email: 'jean@ecole.fr', phone: '0600000001', color: COLORS[0] },
      { id: '2', firstName: 'Marie', lastName: 'Curie', email: 'marie@ecole.fr', phone: '0600000002', color: COLORS[5] },
    ];
    localStorage.setItem(KEYS.INSTRUCTORS, JSON.stringify(instructors));
  }
  if (!localStorage.getItem(KEYS.SETTINGS)) {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
  }
};

seedData();

export const StorageService = {
  getInstructors: (): Instructor[] => JSON.parse(localStorage.getItem(KEYS.INSTRUCTORS) || '[]'),
  saveInstructors: (data: Instructor[]) => localStorage.setItem(KEYS.INSTRUCTORS, JSON.stringify(data)),

  getStudents: (): Student[] => JSON.parse(localStorage.getItem(KEYS.STUDENTS) || '[]'),
  saveStudents: (data: Student[]) => localStorage.setItem(KEYS.STUDENTS, JSON.stringify(data)),

  getLessons: (): Lesson[] => JSON.parse(localStorage.getItem(KEYS.LESSONS) || '[]'),
  saveLessons: (data: Lesson[]) => localStorage.setItem(KEYS.LESSONS, JSON.stringify(data)),

  getSettings: (): AppSettings => JSON.parse(localStorage.getItem(KEYS.SETTINGS) || JSON.stringify(DEFAULT_SETTINGS)),
  saveSettings: (data: AppSettings) => localStorage.setItem(KEYS.SETTINGS, JSON.stringify(data)),
};
