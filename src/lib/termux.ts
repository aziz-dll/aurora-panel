export interface BatteryInfo {
  percent: number | null;
  charging: boolean;
  status: string;
}

export interface MemoryInfo {
  total: number; // MB
  free: number; // MB (free + buffers + cached)
  used: number; // MB
}

export interface DiskInfo {
  fs: string;
  mount: string;
  total: number; // GB
  used: number; // GB
  free: number; // GB
  pct: number; // 0..100
}

export interface UptimeInfo {
  seconds: number;
  bootISO: string;
}

export interface SystemInfo {
  model: string;
  manufacturer: string;
  android: string;
  sdk: number;
  hostname: string;
}

export interface CpuSample {
  usage: number; // 0..100
  cores: number;
}

export interface ThermalInfo {
  zones: Array<{ name: string; tempC: number }>;
}

export interface WifiInfo {
  ip: string | null;
  ssid: string | null;
}

export interface PingResult {
  termux: boolean;
}

async function req<T>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(path, {
      headers: { 'Content-Type': 'application/json' },
      ...init,
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function ok(r: unknown): boolean {
  return r !== null;
}

export const termux = {
  ping(): Promise<PingResult | null> {
    return req<PingResult>('/api/ping');
  },
  battery(): Promise<BatteryInfo | null> {
    return req<BatteryInfo>('/api/battery');
  },
  memory(): Promise<MemoryInfo | null> {
    return req<MemoryInfo>('/api/memory');
  },
  disk(): Promise<DiskInfo[] | null> {
    return req<DiskInfo[]>('/api/disk');
  },
  uptime(): Promise<UptimeInfo | null> {
    return req<UptimeInfo>('/api/uptime');
  },
  info(): Promise<SystemInfo | null> {
    return req<SystemInfo>('/api/info');
  },
  cpu(): Promise<CpuSample | null> {
    return req<CpuSample>('/api/cpu');
  },
  thermal(): Promise<ThermalInfo | null> {
    return req<ThermalInfo>('/api/thermal');
  },
  wifi(): Promise<WifiInfo | null> {
    return req<WifiInfo>('/api/wifi');
  },
  notify(title: string, content: string): Promise<boolean> {
    return req('/api/notify', { method: 'POST', body: JSON.stringify({ title, content }) }).then(ok);
  },
  toast(message: string): Promise<boolean> {
    return req('/api/toast', { method: 'POST', body: JSON.stringify({ message }) }).then(ok);
  },
  vibrate(ms: number): Promise<boolean> {
    return req('/api/vibrate', { method: 'POST', body: JSON.stringify({ ms }) }).then(ok);
  },
  copy(text: string): Promise<boolean> {
    return req('/api/clipboard', { method: 'POST', body: JSON.stringify({ text }) }).then(ok);
  },
};

export function formatUptime(sec: number): string {
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (d > 0) return `${d} gün ${h} sa`;
  if (h > 0) return `${h} sa ${m} dk`;
  return `${m} dk`;
}