import { Capacitor } from '@capacitor/core';
import { AuroraNotification, type AuroraNotificationDraft } from './auroraNotifications';
import type { DB } from './types';
import { daysUntil, todayISO } from './utils';

/** JS tarafı stableId ile aynı — Java'daki stableId ile birebir. */
function hashId(prefix: string, raw: string): string {
  let h = 0 >>> 0;
  const s = prefix + raw;
  for (let i = 0; i < s.length; i++) h = ((h * 31) + s.charCodeAt(i)) >>> 0;
  if (h === 0) h = 1;
  return String(h % 2_000_000_000);
}

export function remindersAvailable(): boolean {
  return Capacitor.isNativePlatform() || (typeof window !== 'undefined' && 'Notification' in window);
}

export async function requestReminderPermission(): Promise<boolean> {
  const r = await AuroraNotification.requestPermission();
  return r.granted;
}

export async function hasReminderPermission(): Promise<boolean> {
  const r = await AuroraNotification.requestPermission();
  return r.granted;
}

export async function sendTestNotification(): Promise<boolean> {
  // Iframe'den geldiyse: parent'a postMessage ile ilet (loader native çağırır)
  if (typeof window !== 'undefined' && window.parent !== window) {
    window.parent.postMessage({ type: 'aurora-notif-test' }, '*');
    return true;
  }
  if (!remindersAvailable()) return false;
  if (!(await hasReminderPermission())) {
    if (!(await requestReminderPermission())) return false;
  }
  const r = await AuroraNotification.sendTest({
    title: '🔔 Aurora test notification',
    body: 'Bildirimler çalışıyor — ödev, sınav, su ve antrenman hatırlatıcıları bu şekilde gelecek.',
    route: '/',
  });
  return r.id > 0;
}

function atTimeISO(dateISO: string, hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  return `${dateISO}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
}

function plusDaysISO(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function nextOccurrence(hhmm: string): Date {
  const [h, m] = hhmm.split(':').map(Number);
  const now = new Date();
  const c = new Date(now);
  c.setHours(h, m, 0, 0);
  if (c.getTime() <= now.getTime()) c.setDate(c.getDate() + 1);
  return c;
}

/**
 * Tüm hatırlatıcıları yeniden planla. Iframe'de çalışıyorsa state'i parent'a
 * postMessage ile gönderir (loader native çağırır), aksi halde direkt kendi planlar.
 */
export async function syncReminders(db: DB): Promise<void> {
  if (typeof window !== 'undefined' && window.parent !== window) {
    postStateToParent(db);
    return;
  }
  if (!remindersAvailable()) return;
  const s = db.settings;
  if (!s.remindersEnabled) {
    await AuroraNotification.cancelAll();
    return;
  }
  if (!(await hasReminderPermission())) {
    // İzin yoksa sessizce iptal et — UI toast'ları loader üzerinden zaten çıkıyor
    return;
  }
  const drafts = buildDrafts(db, s);
  try {
    await AuroraNotification.cancelAll();
    if (drafts.length === 0) return;
    await AuroraNotification.schedule({ notifications: drafts });
  } catch (e) {
    console.warn('schedule failed', e);
  }
}

/** Her kategori için bildirim taslağı üret. Saf fonksiyon — test edilebilir. */
export function buildDrafts(db: DB, s: DB['settings']): AuroraNotificationDraft[] {
  const drafts: AuroraNotificationDraft[] = [];

  // 1) Su hatırlatıcıları — günlük tekrar
  if (s.waterEnabled) {
    const fromH = Number(s.waterFrom.split(':')[0]) || 8;
    const toH = Number(s.waterTo.split(':')[0]) || 22;
    const step = Math.max(1, Math.min(6, s.waterEveryHours || 2));
    for (let h = fromH; h <= toH; h += step) {
      drafts.push({
        id: hashId('w', String(h)),
        title: '💧 Su içme zamanı',
        body: 'Bir bardak su iç — beyninin de buna ihtiyacı var.',
        route: '/fitness',
        everyDay: { hour: h, minute: 0 },
      });
    }
  }

  // 2) Antrenman hatırlatıcısı — bugün yapılmadıysa tek seferlik
  if (s.workoutEnabled) {
    const today = todayISO();
    const doneToday = (db.workouts[today]?.length ?? 0) > 0;
    if (!doneToday) {
      drafts.push({
        id: hashId('wo', 'today'),
        title: '🏋️ Antrenman zamanı',
        body: "Bugünkü antrenman hâlâ bekliyor. 30 dakika yeter, hadi başla!",
        route: '/fitness',
        at: nextOccurrence(s.workoutTime).toISOString(),
      });
    }
  }

  // 3) Todo (ödev) hatırlatıcıları
  if (s.notifications.todoChannel !== false) {
    const openTodos = db.todos
      .filter((x) => !x.done && x.due && daysUntil(x.due) >= s.todoReminderDays)
      .sort((a, b) => (a.due ?? '').localeCompare(b.due ?? ''))
      .slice(0, 32);
    for (const todo of openTodos) {
      const fireDate = plusDaysISO(daysUntil(todo.due!) - s.todoReminderDays);
      drafts.push({
        id: hashId('t', todo.id),
        title: '⏳ Ödev hatırlatıcı',
        body: `«${todo.title}» — ${s.todoReminderDays} gün kaldı. Bugün başla, son geceye bırakma.`,
        route: '/todos',
        at: atTimeISO(fireDate, s.reminderTime),
      });
    }
  }

  // 4) Sınav hatırlatıcıları + bugünkü sınav için N dk önce uyarı
  if (s.notifications.examChannel !== false) {
    const exams = db.exams
      .filter((e) => daysUntil(e.date) >= s.examReminderDays)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 32);
    for (const ex of exams) {
      const fireDate = plusDaysISO(daysUntil(ex.date) - s.examReminderDays);
      drafts.push({
        id: hashId('e', ex.id),
        title: '📝 Sınav hatırlatıcı',
        body: `«${ex.title}» sınavı ${ex.date} — ${s.examReminderDays} gün kaldı, çalışma planı yap.`,
        route: '/student',
        at: atTimeISO(fireDate, s.reminderTime),
      });
    }
    const today = todayISO();
    for (const ex of db.exams.filter((e) => e.date === today && e.time)) {
      const examAt = new Date(atTimeISO(ex.date, ex.time!));
      const at = new Date(examAt.getTime() - s.examLeadMinutes * 60_000);
      if (at.getTime() <= Date.now()) continue;
      drafts.push({
        id: hashId('e30', ex.id),
        title: '⏰ Sınav yaklaşıyor',
        body: `«${ex.title}» sınavına ${s.examLeadMinutes} dakika kaldı (${ex.time}). Son hazırlığını yap!`,
        route: '/student',
        at: at.toISOString(),
      });
    }
  }

  // 5) Habit hatırlatıcıları — her gün aynı saatte
  for (const h of db.habits ?? []) {
    if (h.archived || !h.reminderTime) continue;
    const [hh, mm] = h.reminderTime.split(':').map(Number);
    drafts.push({
      id: hashId('hb', h.id),
      title: h.type === 'quit' ? '🚭 Devam, güçlü ol' : `🔁 ${h.title}`,
      body: h.type === 'quit' ? 'Harika gidiyorsun, böyle devam et!' : 'Alışkanlığını kontrol etme zamanı.',
      route: '/habits',
      everyDay: { hour: hh || 9, minute: mm || 0 },
    });
  }

  return drafts;
}

export function postStateToParent(db: DB): void {
  if (typeof window === 'undefined' || window.parent === window) return;
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
