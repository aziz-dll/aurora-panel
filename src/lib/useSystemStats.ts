import { useEffect, useState } from 'react';
import { updateServerStats } from './widgetSync';
import {
  termux,
  type CpuSample,
  type DiskInfo,
  type MemoryInfo,
  type SystemInfo,
  type ThermalInfo,
  type UptimeInfo,
  type WifiInfo,
} from './termux';

export interface SystemStats {
  connected: boolean;
  memory: MemoryInfo | null;
  disk: DiskInfo[] | null;
  uptime: UptimeInfo | null;
  info: SystemInfo | null;
  cpu: CpuSample | null;
  thermal: ThermalInfo | null;
  wifi: WifiInfo | null;
}

const INITIAL: SystemStats = {
  connected: false,
  memory: null,
  disk: null,
  uptime: null,
  info: null,
  cpu: null,
  thermal: null,
  wifi: null,
};

export function useSystemStats(pollMs = 15_000): SystemStats {
  const [stats, setStats] = useState<SystemStats>(INITIAL);

  useEffect(() => {
    let alive = true;

    async function refresh() {
      const ping = await termux.ping();
      if (!alive) return;
      const up = ping?.termux === true;
      if (!up) {
        setStats({ ...INITIAL });
        return;
      }
      const [memory, disk, uptime, info, cpu, thermal, wifi] = await Promise.all([
        termux.memory(),
        termux.disk(),
        termux.uptime(),
        termux.info(),
        termux.cpu(),
        termux.thermal(),
        termux.wifi(),
      ]);
      if (!alive) return;
      setStats({ connected: true, memory, disk, uptime, info, cpu, thermal, wifi });
      // Push server stats to AuroraStorage so BatteryWidget renders fresh data
      updateServerStats({ battery: null, memory, disk: disk ?? [], cpu, thermal });
    }

    void refresh();
    const t = setInterval(refresh, pollMs);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [pollMs]);

  return stats;
}