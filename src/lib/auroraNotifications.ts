import { registerPlugin } from '@capacitor/core';

/**
 * Java tarafıyla bire bir aynı formül: h * 31 + char, unsigned 32-bit.
 * Pozitif int döner. Aynı string → aynı ID.
 */
export function stableId(s: string | number): number {
  let h = 0 >>> 0;
  const str = String(s);
  for (let i = 0; i < str.length; i++) {
    h = ((h * 31) + str.charCodeAt(i)) >>> 0;
  }
  if (h === 0) h = 1;
  return h % 2_000_000_000;
}

/**
 * Yerel AuroraNotificationPlugin ile konuşan istemci.
 * {@code @capacitor/local-notifications} paketine bağlı değildir; tüm mantık
 * Java tarafında (NotificationManager + AlarmManager) çalışır.
 */
export interface AuroraNotificationDraft {
  id?: string | number;
  title: string;
  body: string;
  /** Tıklayınca açılacak aurora://app/<route> deep-link. Varsayılan: '/' */
  route?: string;
  /** Tek seferlik: 'yyyy-MM-ddTHH:mm:ss' (yerel saat) veya epoch ms */
  at?: string | number | Date;
  /** Günlük tekrar: her gün aynı saatte */
  everyDay?: { hour: number; minute: number };
  /** Şimdiden N dakika sonra (kısa test için) */
  delayMinutes?: number;
}

export interface AuroraNotificationPlugin {
  schedule(opts: { notifications: AuroraNotificationDraft[] }): Promise<{ scheduled: number; errors?: string }>;
  cancel(opts: { ids: (string | number)[] }): Promise<void>;
  cancelAll(): Promise<void>;
  requestPermission(): Promise<{ granted: boolean }>;
  openSettings(): Promise<void>;
  sendTest(opts?: { title?: string; body?: string; route?: string }): Promise<{ id: number }>;
}

/**
 * @capacitor/core registerPlugin — native tarafta AuroraNotificationPlugin'e bağlanır.
 * Web fallback: web Notification API'sini kullanır (dev/test için).
 */
export const AuroraNotification = registerPlugin<AuroraNotificationPlugin>('AuroraNotification', {
  web: () => {
    const timers = new Map<string | number, ReturnType<typeof setTimeout>>();
    const fire = (n: AuroraNotificationDraft) => {
      if (typeof window === 'undefined' || !('Notification' in window)) return;
      if (Notification.permission === 'default') {
        void Notification.requestPermission().catch(() => {});
      }
      if (Notification.permission !== 'granted') return;
      try {
        const notif = new Notification(n.title, { body: n.body });
        notif.onclick = () => {
          if (n.route) {
            const hash = n.route.startsWith('#') ? n.route : `#${n.route}`;
            location.hash = hash;
          }
          window.focus();
        };
      } catch { /* yoksay */ }
    };
    const clear = (id: string | number) => {
      const t = timers.get(id);
      if (t) { clearTimeout(t); timers.delete(id); }
    };
    return {
      async schedule({ notifications }: { notifications: AuroraNotificationDraft[] }) {
        const ids: (string | number)[] = [];
        for (const n of notifications) {
          if (typeof window === 'undefined' || !('Notification' in window)) continue;
          const key = n.id ?? `${n.title}:${n.body}`;
          clear(key);
          let target: Date | null = null;
          if (n.everyDay) {
            target = new Date();
            target.setHours(n.everyDay.hour, n.everyDay.minute, 0, 0);
            if (target.getTime() <= Date.now()) target.setDate(target.getDate() + 1);
          } else if (typeof n.at === 'string' || typeof n.at === 'number') {
            target = new Date(n.at);
          } else if (typeof n.delayMinutes === 'number') {
            target = new Date(Date.now() + n.delayMinutes *   60_000);
          }
          if (!target || target.getTime() <= Date.now()) continue;
          const delay = target.getTime() - Date.now();
          timers.set(key, setTimeout(() => { timers.delete(key); fire(n); }, delay));
          ids.push(key);
        }
        return { scheduled: ids };
      },
      async cancel({ ids }: { ids: (string | number)[] }) {
        for (const id of ids) clear(id);
      },
      async cancelAll() {
        for (const t of timers.values()) clearTimeout(t);
        timers.clear();
      },
    async requestPermission() {
      if (typeof window === 'undefined' || !('Notification' in window)) return { granted: false };
      if (Notification.permission === 'default') {
        try { await Notification.requestPermission(); } catch { /* yoksay */ }
      }
      return { granted: Notification.permission === 'granted' };
    },
    async openSettings() { /* no-op */ },
    async sendTest(opts?: { title?: string; body?: string; route?: string }) {
      if (typeof window === 'undefined' || !('Notification' in window)) return { id: 0 };
      if (Notification.permission === 'default') {
        try { await Notification.requestPermission(); } catch { /* yoksay */ }
      }
      if (Notification.permission === 'granted') {
        new Notification(opts?.title ?? '🔔 Aurora test', { body: opts?.body ?? 'Test bildirimi.' });
      }
      return { id: Date.now() & 0x7fffffff };
    },
  };
},
});
