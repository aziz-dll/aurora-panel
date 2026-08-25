import { useEffect, useRef, useState } from 'react';
import './index.css';
import { Sidebar } from './components/Sidebar';
import { DockNav } from './components/DockNav';

import { getDB, useDB } from './lib/store';
import { hasReminderPermission, requestReminderPermission, remindersAvailable, syncReminders } from './lib/reminders';
import { checkServerBattery } from './lib/serverBattery';
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

  return (
    <div className="flex h-dvh overflow-hidden bg-paper text-ink">
      <Sidebar path={path} />

      <div className="relative flex min-w-0 flex-1 flex-col">
        <div ref={scrollRef} className="flex-1 overflow-y-auto" style={{ scrollbarGutter: 'stable' }}>
          <div key={path} className="min-h-full animate-[page-in_250ms_var(--ease-out)]">
            <Page />
          </div>
        </div>
      </div>

      <DockNav path={path} />
    </div>
  );
}
