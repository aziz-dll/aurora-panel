import { useEffect, useState } from 'react';
import { termux, type BatteryInfo } from './termux';

export interface TermuxStatusState {
  connected: boolean | null;
  battery: BatteryInfo | null;
}

// Singleton: birden fazla bileşen aynı hook'u çağırsa tek bir polling interval
// çalışsın, diğerleri aynı state'i okusun. Birden fazla bağımsız interval kurulması
// sunucuya gereksiz yük bindirir.

let sharedState: TermuxStatusState = { connected: null, battery: null };
const subscribers = new Set<() => void>();
let pollTimer: ReturnType<typeof setInterval> | null = null;

function notify() {
  for (const fn of subscribers) fn();
}

function setState(next: TermuxStatusState) {
  sharedState = next;
  notify();
}

async function refresh() {
  const ping = await termux.ping();
  const up = ping?.termux === true;
  if (up) {
    const b = await termux.battery();
    setState({ connected: true, battery: b });
  } else {
    setState({ connected: false, battery: null });
  }
}

function ensurePolling(pollMs: number) {
  if (pollTimer) return;
  void refresh();
  pollTimer = setInterval(() => void refresh(), pollMs);
}

function maybeStopPolling() {
  if (subscribers.size === 0 && pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

export function useTermuxStatus(pollMs = 60_000): TermuxStatusState {
  const [snap, setSnap] = useState<TermuxStatusState>(sharedState);

  useEffect(() => {
    const sub = () => setSnap(sharedState);
    subscribers.add(sub);
    ensurePolling(pollMs);
    sub(); // mount'ta güncel state'i çek
    return () => {
      subscribers.delete(sub);
      maybeStopPolling();
    };
  }, [pollMs]);

  return snap;
}