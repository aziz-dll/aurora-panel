import { useEffect, useState } from 'react';
import { updateServerStats } from './widgetSync';
import {
  termux,
  type BatteryInfo,
  type CpuSample,
  type DiskInfo,
  type MemoryInfo,
  type StorageInfo,
  type SystemInfo,
  type ThermalInfo,
  type UptimeInfo,
  type WifiInfo,
} from './termux';

export interface SystemStats {
  connected: boolean;
  memory: MemoryInfo | null;
  disk: DiskInfo[] | null;
  storage: StorageInfo | null;
  uptime: UptimeInfo | null;
  info: SystemInfo | null;
  cpu: CpuSample | null;
  thermal: ThermalInfo | null;
  wifi: WifiInfo | null;
  battery: BatteryInfo | null;
}

const INITIAL: SystemStats = {
  connected: false,
  memory: null,
  disk: null,
  storage: null,
  uptime: null,
  info: null,
  cpu: null,
  thermal: null,
  wifi: null,
  battery: null,
};

// Singleton: birden fazla bileşen aynı hook'u çağırırsa tek bir polling interval
// çalışsın (useTermuxStatus ile aynı desen). Böylece widget verileri her sayfada
// (yalnızca Server sekmesi değil) güncel kalır.
let sharedStats: SystemStats = INITIAL;
const statSubs = new Set<() => void>();
let statTimer: ReturnType<typeof setInterval> | null = null;

function notifyStats() {
  for (const fn of statSubs) fn();
}

function setStats(next: SystemStats) {
  sharedStats = next;
  notifyStats();
}

async function refreshStats() {
  const ping = await termux.ping();
  const up = ping?.termux === true;
  if (!up) { setStats({ ...INITIAL }); return; }
  const [memory, disk, storage, uptime, info, cpu, thermal, wifi, battery] = await Promise.all([
    termux.memory(),
    termux.disk(),
    termux.storage(),
    termux.uptime(),
    termux.info(),
    termux.cpu(),
    termux.thermal(),
    termux.wifi(),
    termux.battery(),
  ]);
  setStats({ connected: true, memory, disk, storage, uptime, info, cpu, thermal, wifi, battery });
  // Push server stats to AuroraStorage so widgets render fresh data
  updateServerStats({ battery, memory, disk: disk ?? [], storage, cpu, thermal });
}

function ensureStatsPolling(pollMs: number) {
  if (statTimer) return;
  void refreshStats();
  statTimer = setInterval(() => void refreshStats(), pollMs);
}

function maybeStopStatsPolling() {
  if (statSubs.size === 0 && statTimer) {
    clearInterval(statTimer);
    statTimer = null;
  }
}

export function useSystemStats(pollMs = 15_000): SystemStats {
  const [snap, setSnap] = useState<SystemStats>(sharedStats);

  useEffect(() => {
    const sub = () => setSnap(sharedStats);
    statSubs.add(sub);
    ensureStatsPolling(pollMs);
    sub(); // mount'ta güncel state'i çek
    return () => {
      statSubs.delete(sub);
      maybeStopStatsPolling();
    };
  }, [pollMs]);

  return snap;
}