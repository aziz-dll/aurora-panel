export interface BatteryInfo {
  percent: number | null;
  charging: boolean;
  status: string;
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
