import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import type { DB } from './types';
import { daysUntil, todayISO } from './utils';

export function remindersAvailable(): boolean {
  return Capacitor.isNativePlatform();
}

export async function requestReminderPermission(): Promise<boolean> {
  if (!remindersAvailable()) return false;
  const cur = await LocalNotifications.checkPermissions();
  if (cur.display === 'granted') return true;
  const req = await LocalNotifications.requestPermissions();
  return req.display === 'granted';
}

export async function hasReminderPermission(): Promise<boolean> {
  if (!remindersAvailable()) return true;
  const cur = await LocalNotifications.checkPermissions();
  return cur.display === 'granted';
}

/** Sends a test notification immediately (~1.5s). */
export async function sendTestNotification(): Promise<boolean> {
  if (window.parent !== window) {
    window.parent.postMessage({ type: 'aurora-test' }, '*');
    return true;
  }
  if (!remindersAvailable()) return false;
  if (!(await hasReminderPermission())) {
    if (!(await requestReminderPermission())) return false;
  }
  await LocalNotifications.schedule({
    notifications: [
      {
        id: 987654321,
        title: '🔔 Aurora test notification',
        body: 'Notifications work! Homework, exam, water and workout reminders will look like this.',
        schedule: { at: new Date(Date.now() + 1500), allowWhileIdle: true },
      },
    ],
  });
  return true;
}

function hashId(prefix: string, raw: string): string {
  let h = 0;
  for (let i = 0; i < raw.length; i++) h = (h * 31 + raw.charCodeAt(i)) >>> 0;
  return `${prefix}${h % 100000}`;
}

function atTime(dateISO: string, hhmm: string): Date {
  const [h, m] = hhmm.split(':').map(Number);
  return new Date(`${dateISO}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`);
}

function plusDaysISO(n: number): string {
  // Local-temel tarih (UTC değil) — gece yarısı civarı 3-saat kayma bug'ını önler.
  const d = new Date();
  d.setDate(d.getDate() + n);
  const p = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return p;
}

interface Draft {
  id: string;
  title: string;
  body: string;
  at?: Date;
  on?: { hour: number; minute: number };
}

/**
 * Called whenever data changes: cancels all scheduled notifications and
 * re-schedules based on settings + current todo/exam list.
 *
 * Two execution paths:
 *  - Iframe (APK shell): postMessage to parent (APK shell schedules natively).
 *  - Native: schedule directly via LocalNotifications.
 *
 * Both paths receive the SAME state shape: settings hoisted to the root
 * alongside todos/exams/workouts. This avoids the previous bug where
 * APK shell expected `st.waterEnabled` but payload had it at `st.settings.waterEnabled`.
 */
export async function syncReminders(db: DB): Promise<void> {
  // If we're inside the APK shell's iframe, hand off to the parent.
  if (window.parent !== window) {
    postStateToParent(db);
    return;
  }
  if (!remindersAvailable()) return;
  const s = db.settings;
  if (!s.remindersEnabled) {
    await clearAll();
    return;
  }
  const perm = await LocalNotifications.checkPermissions();
  if (perm.display !== 'granted') return;

  const drafts = buildDrafts(db, s);
  await clearAll();
  if (drafts.length === 0) return;
  await LocalNotifications.schedule({
    notifications: drafts.map((d) => ({
      id: strId(d.id),
      title: d.title,
      body: d.body,
      schedule: d.at
        ? { at: d.at, allowWhileIdle: true }
        : { on: d.on!, allowWhileIdle: true },
    })),
  });
}

/** Builds the list of notification drafts. Pure function — used by both native and iframe paths. */
export function buildDrafts(db: DB, s: DB['settings']): Draft[] {
  const drafts: Draft[] = [];

  // Water reminder
  if (s.waterEnabled) {
    const fromH = Number(s.waterFrom.split(':')[0]) || 8;
    const toH = Number(s.waterTo.split(':')[0]) || 22;
    const step = Math.max(1, Math.min(6, s.waterEveryHours || 2));
    for (let h = fromH; h <= toH; h += step) {
      drafts.push({
        id: hashId('w', String(h)),
        title: '💧 Time to drink water',
        body: 'Have a glass of water — your brain needs it too.',
        on: { hour: h, minute: 0 },
      });
    }
  }

  // Workout reminder
  if (s.workoutEnabled) {
    const doneToday = (db.workouts[todayISO()]?.length ?? 0) > 0;
    if (!doneToday) {
      drafts.push({
        id: 'wo',
        title: '🏋️ Workout time',
        body: "Today's training is still waiting. Come on, 30 minutes is enough!",
        at: nextOccurrence(s.workoutTime),
      });
    }
  }

  // Todo reminder (toggle kapalıysa atla)
  if (s.notifications.todoChannel !== false) {
    const openTodos = db.todos
      .filter((x) => !x.done && x.due && daysUntil(x.due) >= s.todoReminderDays)
      .sort((a, b) => (a.due ?? '').localeCompare(b.due ?? ''))
      .slice(0, 32);
    for (const todo of openTodos) {
      const fireDate = plusDaysISO(daysUntil(todo.due!) - s.todoReminderDays);
      const at = atTime(fireDate, s.reminderTime);
      if (at.getTime() <= Date.now()) continue;
      drafts.push({
        id: hashId('t', todo.id),
        title: '⏳ Homework reminder',
        body: `«${todo.title}» — ${s.todoReminderDays} day(s) left. Start today, don't leave it for the last night.`,
        at,
      });
    }
  }

  // Exam reminder (toggle kapalıysa atla)
  if (s.notifications.examChannel !== false) {
    const exams = db.exams
      .filter((e) => daysUntil(e.date) >= s.examReminderDays)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 32);
    for (const ex of exams) {
      const fireDate = plusDaysISO(daysUntil(ex.date) - s.examReminderDays);
      const at = atTime(fireDate, s.reminderTime);
      if (at.getTime() <= Date.now()) continue;
      drafts.push({
        id: hashId('e', ex.id),
        title: '📝 Exam reminder',
        body: `«${ex.title}» is on ${ex.date} — ${s.examReminderDays} day(s) left, make a study plan.`,
        at,
      });
    }

    // Exam bugün ve saati varsa sınav saatinden N dk önce
    const today = todayISO();
    const todayExams = db.exams.filter((e) => e.date === today && e.time);
    for (const ex of todayExams) {
      const examAt = atTime(ex.date, ex.time!);
      const at = new Date(examAt.getTime() - s.examLeadMinutes * 60_000);
      if (at.getTime() <= Date.now()) continue;
      drafts.push({
        id: hashId('e30', ex.id),
        title: '⏰ Exam approaching',
        body: `«${ex.title}» starts in ${s.examLeadMinutes} minutes (${ex.time}). Do your final prep!`,
        at,
      });
    }
  }

  // Habit reminders
  for (const h of db.habits ?? []) {
    if (h.archived || !h.reminderTime) continue;
    const at = atTime(todayISO(), h.reminderTime);
    if (at.getTime() <= Date.now()) continue;
    drafts.push({
      id: hashId('hb', h.id),
      title: h.type === 'quit' ? '🚭 Stay strong' : `🔁 ${h.title}`,
      body: h.type === 'quit' ? 'You\'re doing great — keep it up!' : 'Time to check in on your habit.',
      at,
    });
  }

  return drafts;
}

function nextOccurrence(hhmm: string): Date {
  const [h, m] = hhmm.split(':').map(Number);
  const now = new Date();
  const candidate = new Date(now);
  candidate.setHours(h, m, 0, 0);
  if (candidate.getTime() <= now.getTime()) candidate.setDate(candidate.getDate() + 1);
  return candidate;
}

function strId(raw: string): number {
  let n = 0;
  for (let i = 0; i < raw.length; i++) n = (n * 31 + raw.charCodeAt(i)) % 2147483647;
  return n + 1;
}

async function clearAll(): Promise<void> {
  await LocalNotifications.cancelAll();
}

/** Sends the current DB state to the parent (APK shell). */
export function postStateToParent(db: DB): void {
  if (window.parent === window) return;
  // Hoist settings fields to the root so the shell can read them directly
  // (avoids the previous `s.waterEnabled` undefined bug).
  const flat = {
    ...db.settings,
    todos: db.todos,
    exams: db.exams,
    workouts: db.workouts,
    habits: db.habits ?? [],
    habitLog: db.habitLog ?? {},
  };
  window.parent.postMessage({ type: 'aurora-state', payload: flat }, '*');
}