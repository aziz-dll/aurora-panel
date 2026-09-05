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
  web: () => ({
    async schedule({ notifications }: { notifications: AuroraNotificationDraft[] }) {
      const ids: number[] = [];
      for (const n of notifications) {
        if (typeof window === 'undefined' || !('Notification' in window)) continue;
        if (Notification.permission === 'default') {
          try { await Notification.requestPermission(); } catch { /* yoksay */ }
        }
        if (Notification.permission !== 'granted') continue;
        try {
          const notif = new Notification(n.title, { body: n.body });
          notif.onclick = () => { if (n.route) location.hash = n.route; };
          ids.push(typeof n.id === 'number' ? n.id : Date.now() & 0x7fffffff);
        } catch { /* yoksay */ }
      }
      return { scheduled: ids };
    },
    async cancel() { /* no-op */ },
    async cancelAll() { /* no-op */ },
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
  }),
});
