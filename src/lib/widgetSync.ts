/**
 * Bridges data between the app's data store and the Android homescreen widgets.
 *
 * Writes a JSON snapshot of widget-relevant data to the app's private
 * storage (SharedPreferences via the AuroraStorage Capacitor plugin). The
 * widget providers (Todos / Schedule / Habits / Battery / Exams / QuickNote /
 * Habit30) read this snapshot on update and re-render via RemoteViews.
 *
 * In the APK the panel runs inside an iframe hosted by the loader page.
 * The loader (top frame) owns the native Capacitor bridge; the iframe does
 * NOT have `window.Capacitor`, so a direct `AuroraStorage` call would
 * silently fall back to the web (localStorage) implementation and the
 * homescreen widgets would never see fresh data. Route through the parent
 * instead — same pattern as reminders (`postStateToParent`).
 */
import { AuroraStorage } from './auroraStorage';
import type { DB } from './types';
import {
  habitCompletedOn,
  habitExpectedOn,
  habitRate,
  habitStreak,
  isoFromDate,
  lastNDates,
  tileStatus,
} from './habits';
import { todayISO } from './utils';
import type { MemoryInfo, DiskInfo, CpuSample, BatteryInfo, ThermalInfo } from './termux';

export interface WidgetTodo {
  id: string;
  title: string;
  due?: string;
  priority: string;
}

export interface WidgetLesson {
  day: number;
  start: string;
  end: string;
  name: string;
  room?: string;
  color: string;
}

export interface WidgetHabit {
  id: string;
  title: string;
  type: 'build' | 'quit';
  streak: number;
  rate: number; // 0..100 — son 30 gün
  color: string;
  icon: string;
  done: boolean;
}

export interface WidgetHabitDay {
  iso: string;
  status: 'done' | 'slip' | 'skip';
}

export interface WidgetHabit30 {
  habit: WidgetHabit;
  days: WidgetHabitDay[]; // 30 gün, eski→yeni
  rate: number;
  streak: number;
  totalExpected: number;
  totalDone: number;
}

export interface WidgetExam {
  id: string;
  title: string;
  courseId?: string;
  date: string; // ISO yyyy-mm-dd
  time?: string; // HH:mm
}

export interface WidgetNote {
  id: string;
  title: string;
  body: string;
  updatedAt: number;
}

export interface WidgetData {
  todos: WidgetTodo[];
  lessons: WidgetLesson[];
  habits: WidgetHabit[];
  /** 30-day habit picker widget verisi: en iyi streak yapan habit. */
  habit30: WidgetHabit30 | null;
  exams: WidgetExam[];
  notes: WidgetNote[];
  server: {
    battery: BatteryInfo | null;
    memory: MemoryInfo | null;
    disk: DiskInfo[];
    cpu: CpuSample | null;
    thermal: ThermalInfo | null;
  };
  updatedAt: number;
}

const KEY = 'widget-data';

function buildFromDB(db: DB): WidgetData {
  const t = todayISO();
  const habits = (db.habits ?? [])
    .filter((h) => !h.archived)
    .sort((a, b) => a.title.localeCompare(b.title));

  const widgetsHabits: WidgetHabit[] = habits
    .filter((h) => habitExpectedOn(db.habitLog ?? {}, h, t))
    .slice(0, 6)
    .map((h) => ({
      id: h.id,
      title: h.title,
      type: h.type,
      streak: habitStreak(db.habitLog ?? {}, h, t),
      rate: habitRate(db.habitLog ?? {}, h, t, 30),
      color: h.color,
      icon: h.icon,
      done: habitCompletedOn(db.habitLog ?? {}, h, t),
    }));

  // 30-day picker: tüm aktif habitler içinde en yüksek streak (>=1) yapan
  // habit. Hiçbiri yoksa en yüksek rate.
  const active = habits.map((h) => ({
    habit: h,
    streak: habitStreak(db.habitLog ?? {}, h, t),
    rate: habitRate(db.habitLog ?? {}, h, t, 30),
    done: habitCompletedOn(db.habitLog ?? {}, h, t),
  }));
  let pick = active.find((h) => h.streak >= 2)
           ?? active.reduce<typeof active[number] | null>((best, cur) => {
             if (!best) return cur;
             if (cur.streak > best.streak) return cur;
             if (cur.streak === best.streak && cur.rate > best.rate) return cur;
             return best;
           }, null);

  let habit30: WidgetHabit30 | null = null;
  if (pick) {
    const dates = lastNDates(t, 30);
    const days: WidgetHabitDay[] = dates.map((iso) => ({
      iso,
      status: tileStatus(pick.habit, iso, db.habitLog ?? {}),
    }));
    const totalExpected = days.filter((d) => d.status !== 'skip').length;
    const totalDone = days.filter((d) => d.status === 'done').length;
    habit30 = {
      habit: {
        id: pick.habit.id,
        title: pick.habit.title,
        type: pick.habit.type,
        streak: pick.streak,
        rate: pick.rate,
        color: pick.habit.color,
        icon: pick.habit.icon,
        done: pick.done,
      },
      days,
      rate: pick.rate,
      streak: pick.streak,
      totalExpected,
      totalDone,
    };
  }

  return {
    todos: db.todos
      .filter((td) => !td.done)
      .sort((a, b) => (a.due ?? '9999').localeCompare(b.due ?? '9999'))
      .slice(0, 5)
      .map((td) => ({ id: td.id, title: td.title, due: td.due, priority: td.priority })),
    lessons: db.lessons
      .slice()
      .sort((a, b) => a.day - b.day || a.start.localeCompare(b.start))
      .slice(0, 12),
    habits: widgetsHabits,
    habit30,
    exams: db.exams
      .filter((e) => e.date && new Date(e.date + 'T00:00:00').getTime() >= Date.now() - 86_400_000)
      .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''))
      .slice(0, 6)
      .map((e) => ({ id: e.id, title: e.title, courseId: e.courseId, date: e.date, time: e.time })),
    notes: (db.notes ?? [])
      .slice()
      .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
      .slice(0, 3)
      .map((n) => ({ id: n.id, title: n.title ?? '', body: n.body ?? '', updatedAt: Date.parse(n.updatedAt) || 0 })),
    server: { battery: null, memory: null, disk: [], cpu: null, thermal: null },
    updatedAt: Date.now(),
  };
}

let lastData: WidgetData | null = null;
let lastWritten: string | null = null;
let pendingTimer: ReturnType<typeof setTimeout> | null = null;

function isIframe(): boolean {
  return typeof window !== 'undefined' && window.parent !== window;
}

/**
 * İçerik değişmemişse yazma (pil koruma); değiştiyse 300ms debounce ile
 * native tarafa yazıp widget'ları güncelle. Iframe'deyse parent'a postMessage.
 */
function writeWidgetData(data: WidgetData): void {
  const serialized = JSON.stringify(data);
  if (serialized === lastWritten) return;
  lastWritten = serialized;
  if (isIframe()) {
    window.parent.postMessage({ type: 'aurora-widget-data', payload: data }, '*');
    return;
  }
  if (pendingTimer) clearTimeout(pendingTimer);
  pendingTimer = setTimeout(() => {
    pendingTimer = null;
    AuroraStorage.set({ key: KEY, value: serialized })
      .then(() => AuroraStorage.notifyWidgets())
      .catch(() => { /* plugin yoksa yoksay */ });
  }, 300);
}

export function syncWidgetsFromDB(db: DB): void {
  const data = buildFromDB(db);
  if (lastData) data.server = lastData.server;
  lastData = data;
  writeWidgetData(data);
}

export function updateServerStats(stats: {
  battery: BatteryInfo | null;
  memory: MemoryInfo | null;
  disk: DiskInfo[];
  cpu: CpuSample | null;
  thermal: ThermalInfo | null;
}): void {
  if (!lastData) {
    lastData = {
      todos: [], lessons: [], habits: [], habit30: null,
      exams: [], notes: [],
      server: stats, updatedAt: Date.now(),
    };
  } else {
    lastData = { ...lastData, server: stats, updatedAt: Date.now() };
  }
  writeWidgetData(lastData);
}

void isoFromDate;
