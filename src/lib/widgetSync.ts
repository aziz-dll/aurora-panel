/**
 * Bridges data between the app's data store and the Android homescreen widgets.
 *
 * Writes a JSON snapshot of widget-relevant data to the app's private
 * storage (SharedPreferences via the AuroraStorage Capacitor plugin). The
 * widget providers (TodosWidget / BatteryWidget / ScheduleWidget) read this
 * snapshot on update and re-render via RemoteViews.
 */
import { AuroraStorage } from './auroraStorage';
import type { DB } from './types';
import { habitExpectedOn, habitStreak } from './habits';
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
}

export interface WidgetData {
  todos: WidgetTodo[];
  lessons: WidgetLesson[];
  habits: WidgetHabit[];
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
  return {
    todos: db.todos
      .filter((t) => !t.done)
      .sort((a, b) => (a.due ?? '9999').localeCompare(b.due ?? '9999'))
      .slice(0, 5)
      .map((t) => ({ id: t.id, title: t.title, due: t.due, priority: t.priority })),
    lessons: db.lessons
      .slice()
      .sort((a, b) => a.day - b.day || a.start.localeCompare(b.start))
      .slice(0, 12),
    habits: (db.habits ?? [])
      .filter((h) => !h.archived && habitExpectedOn(db.habitLog ?? {}, h, t))
      .sort((a, b) => a.title.localeCompare(b.title))
      .slice(0, 5)
      .map((h) => ({
        id: h.id,
        title: h.title,
        type: h.type,
        streak: habitStreak(db.habitLog ?? {}, h, t),
      })),
    server: { battery: null, memory: null, disk: [], cpu: null, thermal: null },
    updatedAt: Date.now(),
  };
}

let lastData : WidgetData | null = null;

/**
 * In the APK the panel runs inside an iframe hosted by the loader page.

 * The loader (top frame) owns the native Capacitor bridge; the iframe
 * does NOT have `window.Capacitor`, so a direct `AuroraStorage` call would
 * silently fall back to the web (localStorage) implementation and the
 * homescreen widgets would never see fresh data. Route through the parent
 * instead — same pattern as reminders (`postStateToParent`).
 */
function isIframe(): boolean {
  return typeof window !== 'undefined' && window.parent !== window;
}

function writeWidgetData(data: WidgetData): Promise<void> {
  if (isIframe()) {
    window.parent.postMessage({ type: 'aurora-widget-data', payload: data }, '*');
    return Promise.resolve();
  }
  return AuroraStorage.set({ key: KEY, value: JSON.stringify(data) }).then(() => AuroraStorage.notifyWidgets());
}

export async function syncWidgetsFromDB(db: DB): Promise<void> {
  const data = buildFromDB(db);
  // Preserve last known server stats if any (set via updateServerStats)
  if (lastData) data.server = lastData.server;

  lastData = data;
  try {
    await writeWidgetData(data)
  } catch {
    /* web dev or plugin not registered — silently skip */
  }
}

export function updateServerStats(stats: {
  battery: BatteryInfo | null;
  memory: MemoryInfo | null;
  disk: DiskInfo[];
  cpu: CpuSample | null;
  thermal: ThermalInfo | null;
}): void {
  // Polling'de henuz DB snapshot'i yazilmamis olsa bile server stats'i


  // AuroraStorage'a yaz — agirlik widget'i her zaman taze veri görsün.





  if (!lastData) {
    lastData = {
      todos: [],
      lessons: [],
      habits: [],
      server: stats,
      updatedAt: Date.now(),
    };
  } else {
    lastData.server = stats;
    lastData.updatedAt = Date.now();
  }
  void writeWidgetData(lastData).catch(() => {});
}
