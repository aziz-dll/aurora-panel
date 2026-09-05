import { useEffect, useRef, useState } from 'react';
import './index.css';
import { TopBar } from './components/TopBar';

import { getDB, useDB } from './lib/store';
import { hasReminderPermission, requestReminderPermission, remindersAvailable, syncReminders } from './lib/reminders';
import { checkServerBattery } from './lib/serverBattery';
import { syncWidgetsFromDB } from './lib/widgetSync';
import { useSystemStats } from './lib/useSystemStats';
import Dashboard from './pages/Dashboard';
import Todos from './pages/Todos';
import Schedule from './pages/Schedule';
import Student from './pages/Student';
import Fitness from './pages/Fitness';
import Notes from './pages/Notes';
import Files from './pages/Files';
import Habits from './pages/Habits';
import Server from './pages/Server';
import Settings from './pages/Settings';

export function useHashRoute(): { path: string; query: URLSearchParams } {
  const parse = () => {
    const raw = location.hash.replace(/^#/, '') || '/';
    const [pathname, qs = ''] = raw.split('?');
    return { path: pathname || '/', query: new URLSearchParams(qs) };
  };
  const [state, setState] = useState(parse);
  useEffect(() => {
    const onChange = () => setState(parse());
    window.addEventListener('hashchange', onChange);
    window.addEventListener('popstate', onChange);
    return () => {
      window.removeEventListener('hashchange', onChange);
      window.removeEventListener('popstate', onChange);
    };
  }, []);
  return state;
}

function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return [35, 131, 226];
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}

const PAGES: Record<string, React.ComponentType> = {
  '/': Dashboard,
  '/todos': Todos,
  '/schedule': Schedule,
  '/student': Student,
  '/fitness': Fitness,
  '/habits': Habits,
  '/notes': Notes,
  '/files': Files,
  '/server': Server,
  '/settings': Settings,
};


export default function App() {
  const { path } = useHashRoute();
  const scrollRef = useRef<HTMLDivElement>(null);
  const db = useDB();
  // Server istatistiklerini uygulama boyunca topla — widget'lar taze veri alsın
  useSystemStats();
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
  // — yazma sırasında spam olmasın diye gecikmeli, saat başı de tazele.
  // db objesi her mutation'da referans değiştirir; sadece gerçekten değişen
  // alanları string'e çevirip dependency yapıyoruz — aynı içerikte spam olmasın.
  const syncKey = JSON.stringify({
    rem: db.settings.remindersEnabled,
    remTime: db.settings.reminderTime,
    examLead: db.settings.examLeadMinutes,
    todoDays: db.settings.todoReminderDays,
    examDays: db.settings.examReminderDays,
    channels: db.settings.notifications,
    water: db.settings.waterEnabled && [db.settings.waterFrom, db.settings.waterTo, db.settings.waterEveryHours],
    workout: db.settings.workoutEnabled && db.settings.workoutTime,
    // todo ve exam içeriklerinin parmak izi — tarih/durum değişiklikleri de sync tetikler
    todosFp: db.todos.map((t) => [t.id, t.done, t.due, t.title].join('|')).join('~'),
    examsFp: db.exams.map((e) => [e.id, e.date, e.time].join('|')).join('~'),
    today: Object.keys(db.workouts).length,
  });
  useEffect(() => {
    const id = setTimeout(() => {
      const db = getDB();
      void syncReminders(db);
      syncWidgetsFromDB(db);
    }, 800);
    const iv = setInterval(() => {
      const db = getDB();
      void syncReminders(db);
      syncWidgetsFromDB(db);
    }, 5 * 60_000); // her 5 dakikada tazele — saatlik stale kalıyordu
    return () => {
      clearTimeout(id);
      clearInterval(iv);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncKey]);

  // Bildirim izni hiç istenmemişse açılışta bir kez sor
  useEffect(() => {
    if (!remindersAvailable() || !getDB().settings.remindersEnabled) return;
    void (async () => {
      if (!(await hasReminderPermission())) await requestReminderPermission();
    })();
  }, []);

  // Server bataryası düşükse client'ta uyar
  useEffect(() => {
    if (!remindersAvailable()) return;
    void checkServerBattery();
    const iv = setInterval(() => void checkServerBattery(), 60_000);
    return () => clearInterval(iv);
  }, []);

  const Page = PAGES[path] ?? Dashboard;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-paper text-ink">
      <TopBar path={path} />
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto" style={{ scrollbarGutter: 'stable' }}>
          <div key={path} className="min-h-full animate-[page-in_250ms_var(--ease-out)]">
            <Page />
          </div>
        </div>
      </div>
    </div>
  );
}
