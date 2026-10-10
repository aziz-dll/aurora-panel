/**
 * Offline-first sync engine.
 *
 * Mutasyonlar (habit toggle, todo ekle/sil vb.) önce localStorage'a yazılır.
 * Server'a ulaşılamadığında değişiklikler bir kuyruğa eklenir.
 * Cihaz tekrar online olduğunda kuyruk otomatik olarak server'a gönderilir.
 *
 * Bu modül Capacitor/WebView içinde çalışır — IndexedDB yerine localStorage
 * kullanır çünkü düşük güçlü cihazlarda (J7) daha güvenilir.
 */

const PENDING_KEY = 'aurora-pending-sync';
const MAX_QUEUE = 500; // taşma koruması

export interface PendingAction {
  id: string;
  type: string;
  payload: unknown;
  timestamp: number;
}

function loadQueue(): PendingAction[] {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as PendingAction[];
  } catch {
    return [];
  }
}

function saveQueue(queue: PendingAction[]): void {
  try {
    // Taşma koruması: en son MAX_QUEUE kadar tut
    const trimmed = queue.slice(-MAX_QUEUE);
    localStorage.setItem(PENDING_KEY, JSON.stringify(trimmed));
  } catch {
    // kota dolu, sessiz geç
  }
}

/** Kuyruğa yeni bir aksiyon ekle (offline iken çağrılır). */
export function enqueueAction(action: Omit<PendingAction, 'id' | 'timestamp'>): void {
  const queue = loadQueue();
  queue.push({
    ...action,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
  });
  saveQueue(queue);
}

/** Kuyruktaki tüm aksiyonları döndür. */
export function getPendingActions(): PendingAction[] {
  return loadQueue();
}

/** Belirli aksiyonları kuyruktan sil (başarıyla gönderilenler). */
export function removeActions(ids: string[]): void {
  const queue = loadQueue();
  const idSet = new Set(ids);
  saveQueue(queue.filter((a) => !idSet.has(a.id)));
}

/** Tüm kuyruğu temizle. */
export function clearQueue(): void {
  try {
    localStorage.removeItem(PENDING_KEY);
  } catch {
    // yoksay
  }
}

/**
 * Server'a bağlanıp kuyruğu boşaltmaya çalışır.
 * Başarılı olan aksiyonları kuyruktan siler.
 * Başarısız olursa sessizce döner — bir sonraki interval'de tekrar dener.
 */
export async function flushPendingQueue(serverUrl: string): Promise<boolean> {
  const queue = loadQueue();
  if (queue.length === 0) return true;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const res = await fetch(`${serverUrl}/api/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actions: queue }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      clearQueue();
      return true;
    }
    // Partial success: server hangi ID'leri aldığını döndürebilir
    try {
      const body = await res.json();
      if (body?.acked && Array.isArray(body.acked)) {
        removeActions(body.acked);
      }
    } catch {
      // parse hatası, kuyruğu tut
    }
    return false;
  } catch {
    clearTimeout(timeout);
    return false;
  }
}

/**
 * DB'nin tamamını export edip server'a push eder (full sync).
 * Habit log, todo listesi vs. hepsi tek seferde gider.
 */
export async function pushFullSync(
  serverUrl: string,
  dbSnapshot: unknown,
): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const res = await fetch(`${serverUrl}/api/fullsync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ db: dbSnapshot, syncedAt: Date.now() }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return res.ok;
  } catch {
    clearTimeout(timeout);
    return false;
  }
}

/**
 * Server'dan son değişikleri çeker (pull sync).
 * Widget verileri ve server istatistikleri için kullanılır.
 */
export async function pullFromServer<T>(
  serverUrl: string,
  endpoint: string,
): Promise<T | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const res = await fetch(`${serverUrl}${endpoint}`, {
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    clearTimeout(timeout);
    return null;
  }
}
