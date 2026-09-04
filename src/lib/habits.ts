import type { Habit, HabitLog } from './types';

export const HABIT_COLORS = ['#2383e2', '#9065b0', '#0f7b6c', '#d9730d', '#e03e3e', '#c14c8a', '#3d9970', '#b7791f'];

export const HABIT_ICONS = [
  'dumbbell', 'drop', 'book', 'flame', 'target', 'activity', 'sun', 'moon',
  'clock', 'heart', 'star', 'checkSquare', 'listChecks', 'archive',
  'stickyNote', 'repeat', 'trendingUp', 'zap', 'gauge', 'cpu',
] as const;

export const WEEKDAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const DAY_MS = 86_400_000;

export function isoFromDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Returns true if the habit is expected to be done on the given date. */
export function habitExpectedOn(log: HabitLog, habit: Habit, iso: string): boolean {
  if (habit.frequency === 'daily') return true;
  if (habit.frequency === 'weekly') {
    const d = new Date(iso + 'T00:00:00');
    const dow = (d.getDay() + 6) % 7; // 0=Mon ... 6=Sun
    return habit.weekdays?.includes(dow) ?? false;
  }
  if (habit.frequency === 'x-per-week') {
    return !habitWeekCompleted(habit, iso, log);
  }
  if (habit.frequency === 'x-per-month') {
    return !habitMonthCompleted(habit, iso, log);
  }
  return false;
}

/** Build habits: true if marked done. Quit habits: true if marked slipped (means you did NOT slip). */
export function habitCompletedOn(log: HabitLog, habit: Habit, iso: string): boolean {
  if (habit.type === 'quit') {
    return log[habit.id]?.[iso] === false; // explicit false = didn't slip = success
  }
  return log[habit.id]?.[iso] === true;
}

export function habitSetCompletion(log: HabitLog, habit: Habit, iso: string, done: boolean): HabitLog {
  const cur = log[habit.id] ?? {};
  const value = habit.type === 'quit' ? !done : done;
  const next = { ...cur, [iso]: value };
  if (next[iso] === undefined) delete next[iso];
  return { ...log, [habit.id]: next };
}

function habitWeekCompleted(habit: Habit, iso: string, log: HabitLog): boolean {
  // Monday as week start
  const d = new Date(iso + 'T00:00:00');
  const dow = (d.getDay() + 6) % 7;
  const weekStart = new Date(d);
  weekStart.setDate(d.getDate() - dow);
  const target = habit.target ?? 1;
  let count = 0;
  for (let i = 0; i < 7; i++) {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + i);
    const dayIso = isoFromDate(day);
    if (habitExpectedOn(log, habit, dayIso) && habitCompletedOn(log, habit, dayIso)) count++;
  }
  return count >= target;
}

function habitMonthCompleted(habit: Habit, iso: string, log: HabitLog): boolean {
  const d = new Date(iso + 'T00:00:00');
  const year = d.getFullYear();
  const month = d.getMonth();
  const target = habit.target ?? 1;
  let count = 0;
  for (let day = 1; day <= 31; day++) {
    const test = new Date(year, month, day);
    if (test.getMonth() !== month) break;
    const dayIso = isoFromDate(test);
    if (habitExpectedOn(log, habit, dayIso) && habitCompletedOn(log, habit, dayIso)) count++;
  }
  return count >= target;
}

/** Current streak. For build: consecutive "done" expected days. For quit: consecutive "no slip" expected days. */
export function habitStreak(log: HabitLog, habit: Habit, todayISO: string): number {
  if (!habitExpectedOn(log, habit, todayISO)) return 0;
  // Walk back from yesterday (today is counted separately if completed)
  const d = new Date(todayISO + 'T00:00:00');
  let streak = habitCompletedOn(log, habit, todayISO) ? 1 : 0;
  if (streak === 0) {
    // For quit, if you slipped today the streak is 0
    if (habit.type === 'quit' && log[habit.id]?.[todayISO] === true) return 0;
    return 0;
  }
  d.setDate(d.getDate() - 1);
  for (let i = 1; i < 365; i++) {
    const iso = isoFromDate(d);
    if (!habitExpectedOn(log, habit, iso)) {
      d.setDate(d.getDate() - 1);
      continue;
    }
    if (habitCompletedOn(log, habit, iso)) streak++;
    else break;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

/** Completion rate over the last `days` expected days (0..100). */
export function habitRate(log: HabitLog, habit: Habit, todayISO: string, days = 30): number {
  const d = new Date(todayISO + 'T00:00:00');
  let expected = 0, done = 0;
  for (let i = 0; i < days; i++) {
    const iso = isoFromDate(d);
    if (habitExpectedOn(log, habit, iso)) {
      expected++;
      if (habitCompletedOn(log, habit, iso)) done++;
    }
    d.setDate(d.getDate() - 1);
  }
  return expected === 0 ? 0 : Math.round((done / expected) * 100);
}

/** Returns the last `days` ISO dates (oldest first). */
export function lastNDates(todayISO: string, days: number): string[] {
  const out: string[] = [];
  const d = new Date(todayISO + 'T00:00:00');
  for (let i = days - 1; i >= 0; i--) {
    const x = new Date(d);
    x.setDate(d.getDate() - i);
    out.push(isoFromDate(x));
  }
  return out;
}

/** Returns tile status for a habit on a given day:
 * - 'done' = expected + completed (or quit no-slip)
 * - 'slip' = expected + NOT completed (or quit slipped)
 * - 'skip' = not expected on that day
 */
export function tileStatus(habit: Habit, iso: string, log: HabitLog): 'done' | 'slip' | 'skip' {
  if (!habitExpectedOn(log, habit, iso)) return 'skip';
  return habitCompletedOn(log, habit, iso) ? 'done' : 'slip';
}

/** Toggles a day's completion. Returns the new completion state. */
export function toggleDay(habit: Habit, iso: string, log: HabitLog): { log: HabitLog; done: boolean } {
  const currentlyDone = habitCompletedOn(log, habit, iso);
  const next = habitSetCompletion(log, habit, iso, !currentlyDone);
  return { log: next, done: !currentlyDone };
}

void DAY_MS as unknown;