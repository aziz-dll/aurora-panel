import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import './index.css';
import { Sidebar } from './components/Sidebar';
import { DockNav } from './components/DockNav';
import { AuroraBackground } from './components/ui/aurora-background';
import { Icon, type IconName } from './lib/icons';
import { getDB, patchSettings, useDB } from './lib/store';
import { hasReminderPermission, requestReminderPermission, remindersAvailable, syncReminders } from './lib/reminders';
import { checkServerBattery } from './lib/serverBattery';
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const db = useDB();
  const settings = db.settings;

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = settings.theme === 'dark' || (settings.theme === 'system' && mq.matches);
      document.documentElement.classList.toggle('dark', dark);
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#131210' : '#fafaf8');
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
  // — yazma sırasında spam olmasın diye gecikmeli, saat başı de tazele
  useEffect(() => {
    const id = setTimeout(() => void syncReminders(db), 800);
    const iv = setInterval(() => void syncReminders(getDB()), 60 * 60_000);
    return () => {
      clearTimeout(id);
      clearInterval(iv);
    };
  }, [db]);

  // Bildirim izni hiç istenmemişse açılışta bir kez sor
  useEffect(() => {
    if (!remindersAvailable() || !getDB().settings.remindersEnabled) return;
    void (async () => {
      if (!(await hasReminderPermission())) await requestReminderPermission();
    })();
  }, []);

  // Sunucu bataryası düşükse client'ta uyar
  useEffect(() => {
    if (!remindersAvailable()) return;
    void checkServerBattery();
    const iv = setInterval(() => void checkServerBattery(), 60_000);
    return () => clearInterval(iv);
  }, []);

  const Page = PAGES[path] ?? Dashboard;

  const cycleTheme = () => {
    const order: ThemeMode[] = ['system', 'light', 'dark'];
    const next = order[(order.indexOf(settings.theme) + 1) % order.length];
    patchSettings({ theme: next });
  };

  return (
    <div className="flex h-dvh overflow-hidden bg-paper text-ink">
      <AuroraBackground />
      <Sidebar path={path} />

      <div className="relative flex min-w-0 flex-1 flex-col">
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto"
          style={{ scrollbarGutter: 'stable' }}
        >
          <motion.div
            key={path}
            initial={{ opacity: 0, y: 14, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="min-h-full"
          >
            <Page />
          </motion.div>
        </div>

        {/* Mobilde yüzen tema düğmesi — dock ile çakışmaz */}
        <button
          onClick={cycleTheme}
          aria-label="Tema"
          className="glass fixed right-3 top-5 z-40 flex h-9 w-9 items-center justify-center rounded-full border border-line/70 text-soft shadow-[var(--shadow-card)] transition-transform active:scale-90 md:hidden"
        >
          <Icon name={THEME_ICON[settings.theme]} size={15} className={settings.theme === 'system' ? 'opacity-50' : ''} />
        </button>
      </div>

      <DockNav path={path} />
    </div>
  );
}
