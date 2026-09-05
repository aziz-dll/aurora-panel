import { AuroraNotification } from './auroraNotifications';
import { termux } from './termux';

const STORE_KEY = 'serverBatteryAlertAt';
const THROTTLE_MS = 60 * 60_000; // aynı düşüş için saatte bir hatırlat

/**
 * Sunucu (J7 Prime) bataryasını kontrol eder; %25 altına düşmüş ve şarjda
 * değilse client cihazında yerel bildirim gösterir.
 */
export async function checkServerBattery(): Promise<void> {
  let b: Awaited<ReturnType<typeof termux.battery>>;
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

  await AuroraNotification.schedule({
    notifications: [
      {
        id: 'server-battery',
        title: '🔋 Sunucu bataryası az',
        body: `J7 Prime bataryası %${b.percent} — şarja tak, panelin kapanmasın.`,
        route: '/server',
        delayMinutes: 0,
        at: new Date(Date.now() + 500).toISOString(),
      },
    ],
  });
}
