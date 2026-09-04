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

export interface WidgetData {
  todos: WidgetTodo[];
  lessons: WidgetLesson[];
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
    server: { battery: null, memory: null, disk: [], cpu: null, thermal: null },
    updatedAt: Date.now(),
  };
}

let lastData: WidgetData | null = null;

export async function syncWidgetsFromDB(db: DB): Promise<void> {
  const data = buildFromDB(db);
  // Preserve last known server stats if any (set via updateServerStats)
  if (lastData) data.server = lastData.server;
  lastData = data;
  try {
    await AuroraStorage.set({ key: KEY, value: JSON.stringify(data) });
    await AuroraStorage.notifyWidgets();
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
  if (!lastData) return;
  lastData.server = stats;
  lastData.updatedAt = Date.now();
  AuroraStorage.set({ key: KEY, value: JSON.stringify(lastData) }).catch(() => {});
  AuroraStorage.notifyWidgets().catch(() => {});
}