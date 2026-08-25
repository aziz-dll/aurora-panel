import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { termux } from './termux';

const STORE_KEY = 'serverBatteryAlertAt';
const THROTTLE_MS = 60 * 60_000; // aynı düşüş için saatte bir hatırlat

/**
 * Sunucunun (J7 Prime) bataryasını kontrol eder; %25 altına düşmüş ve
 * şarjda değilse client cihazında yerel bildirim gösterir.
 */
export async function checkServerBattery(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  let b;
  try {
    b = await termux.battery();
  } catch {
    return;
  }
  if (!b || b.percent === null) return;

  const low = b.percent <= 25 && !b.charging;
  if (!low) {
    try { localStorage.removeItem(STORE_KEY); } catch { /* yoksay */ }
    return;
  }

  let last = 0;
  try { last = Number(localStorage.getItem(STORE_KEY) ?? 0); } catch { /* yoksay */ }
  if (Date.now() - last < THROTTLE_MS) return;
  try { localStorage.setItem(STORE_KEY, String(Date.now())); } catch { /* yoksay */ }

  await LocalNotifications.schedule({
    notifications: [
      {
        id: 555001,
        title: '🔋 Sunucu şarjı düşük',
        body: `J7 Prime şarjı %${b.percent} — şarja tak, panel kapalı kalmasın.`,
        schedule: { at: new Date(Date.now() + 500), allowWhileIdle: true },
      },
    ],
  });
}
