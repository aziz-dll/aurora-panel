import { registerPlugin } from '@capacitor/core';

export interface AuroraStoragePlugin {
  set(opts: { key: string; value: string }): Promise<void>;
  get(opts: { key: string }): Promise<{ value: string | null }>;
  remove(opts: { key: string }): Promise<void>;
  keys(): Promise<{ keys: string[] }>;
  notifyWidgets(): Promise<void>;
}

export const AuroraStorage = registerPlugin<AuroraStoragePlugin>('AuroraStorage', {
  // Web fallback: uses localStorage so browser dev works without the native plugin
  web: () => ({
    async set({ key, value }: { key: string; value: string }) {
      try { localStorage.setItem(`aurora:${key}`, value); } catch {}
    },
    async get({ key }: { key: string }) {
      try { return { value: localStorage.getItem(`aurora:${key}`) }; } catch { return { value: null }; }
    },
    async remove({ key }: { key: string }) {
      try { localStorage.removeItem(`aurora:${key}`); } catch {}
    },
    async keys() {
      const keys: string[] = [];
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith('aurora:')) keys.push(k.slice(7));
        }
      } catch {}
      return { keys };
    },
    async notifyWidgets() {
      /* no-op in web */
    },
  }),
});