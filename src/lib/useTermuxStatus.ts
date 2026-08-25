import { useEffect, useState } from 'react';
import { termux, type BatteryInfo } from './termux';

export function useTermuxStatus(pollMs = 60_000) {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [battery, setBattery] = useState<BatteryInfo | null>(null);

  useEffect(() => {
    let alive = true;

    async function refresh() {
      const ping = await termux.ping();
      if (!alive) return;
      const up = ping?.termux === true;
      setConnected(up);
      if (up) {
        const b = await termux.battery();
        if (alive) setBattery(b);
      } else {
        setBattery(null);
      }
    }

    refresh();
    const t = setInterval(refresh, pollMs);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [pollMs]);

  return { connected, battery };
}
