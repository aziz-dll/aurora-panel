import { useEffect, useRef, useState } from 'react';
import './index.css';
import { Sidebar } from './components/Sidebar';
import { Icon, type IconName } from './lib/icons';
import { titleFor } from './lib/nav';
import { patchSettings, useDB } from './lib/store';
import { syncReminders } from './lib/reminders';
import type { ThemeMode } from './lib/types';
import Dashboard from './pages/Dashboard';
import Todos from './pages/Todos';
import Schedule from './pages/Schedule';
import Student from './pages/Student';
import Fitness from './pages/Fitness';
import Notes from './pages/Notes';
import Files from './pages/Files';
import Settings from './pages/Settings';

function useHashRoute(): string {
  const [path, setPath] = useState(() => location.hash.slice(1) || '/');
  useEffect(() => {
    const onChange = () => setPath(location.hash.slice(1) || '/');
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return path;
}

function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return [35, 131, 226];
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}

const PAGES: Record<string, React.ComponentType> = {
  '/': Dashboard,
  '/gorevler': Todos,
  '/program': Schedule,
  '/ogrenci': Student,
  '/spor': Fitness,
  '/notlar': Notes,
  '/dosyalar': Files,
  '/ayarlar': Settings,
};

const THEME_ICON: Record<ThemeMode, IconName> = { system: 'moon', light: 'sun', dark: 'moon' };

export default function App() {
  const path = useHashRoute();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const db = useDB();
  const settings = db.settings;

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = settings.theme === 'dark' || (settings.theme === 'system' && mq.matches);
      document.documentElement.classList.toggle('dark', dark);
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#191919' : '#ffffff');
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [settings.theme]);

  useEffect(() => {
    const root = document.documentElement;
    const [r, g, b] = hexToRgb(settings.accent);
    root.style.setProperty('--accent', settings.accent);
    root.style.setProperty('--accent-soft', `rgba(${r}, ${g}, ${b}, 0.13)`);
  }, [settings.accent]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [path]);

  // Hatırlatıcıları veriyle senkron tut (APK'da çalışır)
  useEffect(() => {
    void syncReminders(db);
    const id = setInterval(() => void syncReminders(db), 15 * 60_000);
    return () => clearInterval(id);
  }, [db]);

  const Page = PAGES[path] ?? Dashboard;

  const cycleTheme = () => {
    const order: ThemeMode[] = ['system', 'light', 'dark'];
    const next = order[(order.indexOf(settings.theme) + 1) % order.length];
    patchSettings({ theme: next });
  };

  return (
    <div className="flex h-dvh overflow-hidden bg-paper text-ink">
      <Sidebar path={path} open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <div key={path} className="animate-[page-in_300ms_var(--ease-out)]">
            <Page />
          </div>
        </div>

        {/* Mobil alt bar — başparmak hizasında menü + tema */}
        <nav
          className="sticky bottom-0 z-30 flex items-center gap-1 border-t border-line bg-paper/95 px-3 pt-1.5 backdrop-blur md:hidden"
          style={{ paddingBottom: 'max(0.375rem, env(safe-area-inset-bottom))' }}
        >
          <button onClick={() => setDrawerOpen(true)} className="btn btn-ghost p-2" aria-label="Menü">
            <Icon name="menu" size={18} />
          </button>
          <span className="min-w-0 flex-1 truncate text-center text-sm font-semibold">{titleFor(path)}</span>
          <button onClick={cycleTheme} className="btn btn-ghost p-2" aria-label="Tema">
            <Icon name={THEME_ICON[settings.theme]} size={17} className={settings.theme === 'system' ? 'opacity-50' : ''} />
          </button>
        </nav>
      </div>
    </div>
  );
}
