export type Priority = 'low' | 'med' | 'high';

export interface Todo {
  id: string;
  title: string;
  done: boolean;
  priority: Priority;
  due?: string;
  course?: string;
  createdAt: string;
}

export interface Lesson {
  id: string;
  day: number; // 0 = Pazartesi ... 6 = Pazar
  start: string; // "09:00"
  end: string; // "10:30"
  name: string;
  room?: string;
  color: string;
}

export interface Assessment {
  id: string;
  label: string;
  score: number;
}

export interface Course {
  id: string;
  name: string;
  teacher?: string;
  credits: number;
  assessments: Assessment[];
}

export interface Exam {
  id: string;
  title: string;
  courseId?: string;
  date: string; // YYYY-MM-DD
  time?: string;
}

export interface Note {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  updatedAt: string;
}

export type ThemeMode = 'system' | 'light' | 'dark';

export interface Settings {
  studentName: string;
  theme: ThemeMode;
  accent: string;
  weightKg?: number;
  heightCm?: number;
  ageYears?: number;
  filebrowserUrl: string;
  remindersEnabled: boolean;
  todoReminderDays: number;
  examReminderDays: number;
  waterEnabled: boolean;
  waterFrom: string;
  waterTo: string;
  waterEveryHours: number;
  workoutEnabled: boolean;
  workoutTime: string;
}

export type WorkoutLog = Record<string, string[]>;

export interface DB {
  todos: Todo[];
  lessons: Lesson[];
  courses: Course[];
  exams: Exam[];
  notes: Note[];
  workouts: WorkoutLog;
  settings: Settings;
}
