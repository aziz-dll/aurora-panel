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

/** Deneme amaçlı: ~1.5 sn sonra cihazda bildirim gösterir. */
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
        title: '🔔 Aurora test bildirimi',
        body: 'Bildirimler çalışıyor! Ödev, yazılı, su ve spor hatırlatmaları böyle görünecek.',
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
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

interface Draft {
  id: string;
  title: string;
  body: string;
  at?: Date;
  on?: { hour: number; minute: number };
}

/**
 * Veri değişince çağrılır: tüm planlı bildirimleri sıfırlayıp
 * ayarlara + güncel görev/sınav listesine göre yeniden kurar.
 * Sadece APK'da (native) çalışır. Panel iframe içinde çalışıyorsa
 * (APK kabuğu) planlamayı parent yapar — burada çift planlama olmasın.
 */
export async function syncReminders(db: DB): Promise<void> {
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

  const drafts: Draft[] = [];

  // Su hatırlatması — her gün, saat aralığında N saatte bir
  if (s.waterEnabled) {
    const fromH = Number(s.waterFrom.split(':')[0]) || 8;
    const toH = Number(s.waterTo.split(':')[0]) || 22;
    const step = Math.max(1, Math.min(6, s.waterEveryHours || 2));
    for (let h = fromH; h <= toH; h += step) {
      drafts.push({
        id: hashId('w', String(h)),
        title: '💧 Su içme zamanı',
        body: 'Bir bardak su iç, beyin de susuzluk çekiyor.',
        on: { hour: h, minute: 0 },
      });
    }
  }

  // Spor hatırlatması — bugün yapılmadıysa sıradaki uygun zamanda
  if (s.workoutEnabled) {
    const doneToday = (db.workouts[todayISO()]?.length ?? 0) > 0;
    if (!doneToday) {
      drafts.push({
        id: 'wo',
        title: '🏋️ Spor vakti',
        body: "Bugünkü antrenman hâlâ seni bekliyor. Hadi, 30 dakika yeter!",
        at: nextOccurrence(s.workoutTime),
      });
    }
  }

  // Ödev/görev hatırlatması — deadline'dan N gün önce 18:00
  const openTodos = db.todos
    .filter((x) => !x.done && x.due && daysUntil(x.due) >= s.todoReminderDays)
    .sort((a, b) => (a.due ?? '').localeCompare(b.due ?? ''))
    .slice(0, 32);
  for (const todo of openTodos) {
    const fireDate = plusDaysISO(daysUntil(todo.due!) - s.todoReminderDays);
    const at = atTime(fireDate, '18:00');
    if (at.getTime() <= Date.now()) continue; // hatırlatma anı geçtiyse kurma
    drafts.push({
      id: hashId('t', todo.id),
      title: '⏳ Ödev hatırlatması',
      body: `«${todo.title}» için ${s.todoReminderDays} gün kaldı — bugün başla, son geceye bırakma.`,
      at,
    });
  }

  // Yazılı hatırlatması — sınavdan N gün önce 18:00
  const exams = db.exams
    .filter((e) => daysUntil(e.date) >= s.examReminderDays)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 32);
  for (const ex of exams) {
    const fireDate = plusDaysISO(daysUntil(ex.date) - s.examReminderDays);
    const at = atTime(fireDate, '18:00');
    if (at.getTime() <= Date.now()) continue; // hatırlatma anı geçtiyse kurma
    drafts.push({
      id: hashId('e', ex.id),
      title: '📝 Yazılı hatırlatması',
      body: `«${ex.title}» ${ex.date} tarihinde — ${s.examReminderDays} günün var, çalışma planı yap.`,
      at,
    });
  }

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

/** APK kabuğu (loader) iframe modundayken panel durumunu parent'a iletir. */
export function postStateToParent(db: DB): void {
  if (window.parent === window) return;
  window.parent.postMessage(
    {
      type: 'aurora-state',
      payload: {
        todos: db.todos,
        exams: db.exams,
        workouts: db.workouts,
        settings: db.settings,
      },
    },
    '*',
  );
}
