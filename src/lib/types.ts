export type Priority = 'low' | 'med' | 'high';
export type TodoCategory = 'school' | 'personal' | 'sport';
export type HabitType = 'build' | 'quit';
export type HabitFrequency = 'daily' | 'weekly' | 'x-per-week' | 'x-per-month';
export type HabitCategory = 'health' | 'productivity' | 'mind' | 'social' | 'other';

export interface Habit {
  id: string;
  title: string;
  /** Lucide icon name (e.g. "dumbbell", "drop", "book"). No emojis. */
  icon: string;
  color: string;
  /** Build = "did you do it?" (green tile). Quit = "did you slip?" (red tile). */
  type: HabitType;
  frequency: HabitFrequency;
  /** Target completions for x-per-week / x-per-month. */
  target?: number;
  /** Days of week for weekly frequency (0=Mon ... 6=Sun). */
  weekdays?: number[];
  reminderTime?: string;
  category?: HabitCategory;
  archived?: boolean;
  createdAt: string;
}

export type HabitLog = Record<string, Record<string, boolean>>; // habitId → dateISO → done?

export interface Todo {
  id: string;
  title: string;
  done: boolean;
  priority: Priority;
  category?: TodoCategory;
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
  examLeadMinutes: number;
  reminderTime: string;
  waterEnabled: boolean;
  waterFrom: string;
  waterTo: string;
  waterEveryHours: number;
  workoutEnabled: boolean;
  workoutTime: string;
  notifications: {
    examChannel: boolean;
    todoChannel: boolean;
    waterChannel: boolean;
    workoutChannel: boolean;
  };
}

export type WorkoutLog = Record<string, string[]>;

export interface DB {
  todos: Todo[];
  lessons: Lesson[];
  courses: Course[];
  exams: Exam[];
  notes: Note[];
  habits: Habit[];
  habitLog: HabitLog;
  workouts: WorkoutLog;
  settings: Settings;
}
