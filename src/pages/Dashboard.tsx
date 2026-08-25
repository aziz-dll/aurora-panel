import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Icon } from '../lib/icons';
import { todos as todoActions, lessonsOfDay } from '../lib/actions';
import { PROGRAM, computeStreak, wdOf } from '../lib/fitness';
import { useDB } from '../lib/store';
import { termux, type BatteryInfo } from '../lib/termux';
import { cx, daysUntil, hhmmToMin, longDate, nowMin, shortDate, todayISO } from '../lib/utils';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 6) return 'İyi geceler';
  if (h < 12) return 'Günaydın';
  if (h < 18) return 'İyi günler';
  return 'İyi akşamlar';
}

function BatteryRing({ percent, charging }: { percent: number | null; charging: boolean }) {
  const p = Math.max(0, Math.min(100, percent ?? 0));
  const color = p <= 15 ? '#e03e3e' : charging ? '#0f7b6c' : 'var(--accent)';
  return (
    <div className="relative h-16 w-16">
      <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
        <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--line)" strokeWidth="3.5" />
        <circle
          cx="18"
          cy="18"
          r="15.5"
          fill="none"
          stroke={color}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={`${p * 0.974}, 100`}
          className="transition-all duration-700"
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-sm font-bold tabular-nums">
        {percent !== null ? `%${p}` : '?'}
      </span>
      {charging && <span className="absolute -right-1 -top-1 text-xs">⚡</span>}
    </div>
  );
}

export default function Dashboard() {
  const db = useDB();
  const [quick, setQuick] = useState('');
  const [battery, setBattery] = useState<BatteryInfo | null>(null);
  const [termuxUp, setTermuxUp] = useState<boolean | null>(null);

  const t = todayISO();
  const now = nowMin();
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((x) => x + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let alive = true;
    termux.ping().then((p) => {
      if (!alive) return;
      setTermuxUp(p?.termux === true);
      if (p?.termux) termux.battery().then((b) => alive && setBattery(b));
    });
    return () => {
      alive = false;
    };
  }, []);

  const name = db.settings.studentName.trim();
  const todayLessons = useMemo(() => lessonsOfDay(db.lessons, (new Date().getDay() + 6) % 7), [db.lessons]);
  const openTodos = useMemo(
    () =>
      db.todos
        .filter((x) => !x.done)
        .sort((a, b) => (a.due ?? '9999').localeCompare(b.due ?? '9999') || b.createdAt.localeCompare(a.createdAt))
        .slice(0, 4),
    [db.todos],
  );
  const dueToday = db.todos.filter((x) => !x.done && x.due === t).length;
  const overdue = db.todos.filter((x) => !x.done && x.due && x.due < t).length;
  const openTotal = db.todos.filter((x) => !x.done).length;
  const nextExams = [...db.exams].filter((e) => e.date >= t).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 2);
  const streak = useMemo(() => computeStreak(db.workouts), [db.workouts]);
  const nextExamIn = nextExams.length ? Math.max(0, daysUntil(nextExams[0].date)) : null;

  const quickAdd = (e: FormEvent) => {
    e.preventDefault();
    const title = quick.trim();
    if (!title) return;
    todoActions.add(title);
    setQuick('');
  };

  const stats = [
    { icon: '📅', value: String(todayLessons.length), label: 'Bugünkü ders', href: '#/program' },
    { icon: '✅', value: String(openTotal), label: 'Açık görev', href: '#/gorevler' },
    { icon: '🔥', value: `${streak} g`, label: 'Spor serisi', href: '#/spor' },
    {
      icon: '🗓️',
      value: nextExamIn === null ? '—' : `${nextExamIn} g`,
      label: nextExams.length ? nextExams[0].title : 'Sınav yok',
      href: '#/ogrenci',
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[880px] px-4 pb-32 pt-16 md:px-10 md:pb-16">
      <header className="mb-8">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper px-3 py-1 text-[11.5px] font-medium text-soft shadow-[var(--shadow-card)]">
          <Icon name="calendar" size={11} /> {longDate(new Date())}
        </span>
        <h1 className="mt-3 font-display text-[26px] font-bold tracking-tight md:text-[40px]">
          {greeting()}
          {name ? (
            <>
              {', '}
              <span className="aurora-text">{name}</span>
            </>
          ) : null}{' '}
          👋
        </h1>
        <form onSubmit={quickAdd} className="mt-4 flex gap-2">
          <input
            value={quick}
            onChange={(e) => setQuick(e.target.value)}
            placeholder="Hızlı görev ekle…"
            className="field flex-1"
          />
          <button type="submit" disabled={!quick.trim()} className="btn btn-primary px-4" aria-label="Ekle">
            <Icon name="plus" size={15} /> Ekle
          </button>
        </form>
      </header>

      <div className="mb-4 grid grid-cols-2 gap-2.5 md:grid-cols-4 md:gap-3">
        {stats.map((s) => (
          <a key={s.label} href={s.href} className="card card-lift block p-3.5">
            <span className="text-base select-none md:text-lg">{s.icon}</span>
            <p className="mt-1.5 truncate text-xl font-bold leading-tight tracking-tight tabular-nums md:text-2xl">{s.value}</p>
            <p className="truncate text-[11px] font-medium text-soft">{s.label}</p>
          </a>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="card p-3 md:p-4">
          <h2 className="mb-2.5 flex items-center gap-1.5 text-sm font-semibold text-soft">📅 Bugün dersler</h2>
          {todayLessons.length === 0 ? (
            <p className="py-3 text-center text-sm text-faint">Bugün ders yok 🎉</p>
          ) : (
            <ul className="space-y-1.5">
              {todayLessons.map((l) => {
                const isNow = hhmmToMin(l.start) <= now && now < hhmmToMin(l.end);
                return (
                  <li
                    key={l.id}
                    className={cx('flex items-center gap-2.5 rounded-lg border-l-[3px] bg-side px-2.5 py-2', isNow && 'ring-1 ring-accent')}
                    style={{ borderColor: l.color }}
                  >
                    <span className="w-[86px] shrink-0 text-xs tabular-nums text-soft">
                      {l.start}–{l.end}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{l.name}</span>
                    {isNow ? (
                      <span className="flex shrink-0 items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> Şimdi
                      </span>
                    ) : (
                      l.room && <span className="shrink-0 text-[11px] text-faint">{l.room}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="card p-3 md:p-4">
          <h2 className="mb-2.5 flex items-center justify-between text-sm font-semibold text-soft">
            ✅ Görevler
            <a href="#/gorevler" className="text-xs font-medium text-accent hover:underline">
              Tümü →
            </a>
          </h2>
          <div className="mb-2 flex gap-1.5 text-[11px]">
            <span className="rounded-full bg-hover px-2 py-0.5 text-soft">{dueToday} bugün</span>
            {overdue > 0 && (
              <span className="rounded-full bg-[#fae4e4] px-2 py-0.5 font-medium text-[#621f1f] dark:bg-[#40222a] dark:text-[#ef8b8b]">
                {overdue} geciken
              </span>
            )}
          </div>
          {openTodos.length === 0 ? (
            <p className="py-3 text-center text-sm text-faint">Her şey tamam! 🌟</p>
          ) : (
            <ul className="space-y-1">
              {openTodos.map((todo) => (
                <li key={todo.id} className="flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-hover">
                  <button onClick={() => todoActions.toggle(todo.id)} aria-label="Tamamla" className="todo-check h-4 w-4 rounded-full" />
                  <span className="min-w-0 flex-1 truncate text-sm">{todo.title}</span>
                  {todo.due && (
                    <span className={cx('shrink-0 text-[11px]', todo.due < t ? 'font-medium text-[#e03e3e]' : 'text-faint')}>
                      {shortDate(todo.due)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-3 md:p-4">
          <h2 className="mb-2.5 flex items-center justify-between text-sm font-semibold text-soft">
            🗓️ Yaklaşan sınavlar
            <a href="#/ogrenci" className="text-xs font-medium text-accent hover:underline">
              Panel →
            </a>
          </h2>
          {nextExams.length === 0 ? (
            <p className="py-3 text-center text-sm text-faint">Planlanmış sınav yok.</p>
          ) : (
            <ul className="space-y-2">
              {nextExams.map((ex) => {
                const diff = daysUntil(ex.date);
                return (
                  <li key={ex.id} className="flex items-center justify-between gap-2 rounded-lg bg-side px-2.5 py-2">
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{ex.title}</span>
                    <span className="shrink-0 text-xs text-faint">{shortDate(ex.date)}</span>
                    <span
                      className={cx(
                        'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold',
                        diff === 0 ? 'bg-[#f4b8b8] text-[#3d0c0c] dark:bg-[#4a1f1f] dark:text-[#f19999]' : 'bg-hover text-soft',
                      )}
                    >
                      {diff === 0 ? 'Bugün!' : `${diff} gün`}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="card p-3 md:p-4">
          <h2 className="mb-2.5 flex items-center justify-between text-sm font-semibold text-soft">
            📱 Cihaz
            <a href="#/ayarlar" className="text-xs font-medium text-accent hover:underline">
              Ayarlar →
            </a>
          </h2>
          {termuxUp === false ? (
            <div className="flex flex-col items-start gap-1 py-2">
              <p className="text-sm font-medium">Termux API bağlı değil</p>
              <p className="text-xs leading-relaxed text-faint">
                Bildirim, titreşim ve batarya için <code className="rounded bg-hover px-1">npm run start</code> ile
                sunucuyu çalıştır ve Termux:API kur.
              </p>
            </div>
          ) : battery ? (
            <div className="flex items-center gap-4 py-1">
              <BatteryRing percent={battery.percent} charging={battery.charging} />
              <div className="space-y-0.5 text-sm">
                <p className="font-medium capitalize">{battery.charging ? 'Şarj oluyor ⚡' : 'Pil modu'}</p>
                <p className="text-xs text-faint">Termux API aktif · canlı</p>
              </div>
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-faint">Batarya bilgisi bekleniyor…</p>
          )}
        </section>
      </div>

      <a href="#/spor" className="card card-lift mt-6 flex items-center gap-3 p-4">
        <span className="text-2xl">🏋️</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">Bugünkü antrenman: {PROGRAM[wdOf(new Date())].focus}</p>
          <p className="text-xs text-soft">{streak > 0 ? `${streak} günlük seri devam ediyor 🔥` : 'Seriyi bugün başlat'}</p>
        </div>
        <Icon name="chevronRight" size={16} className="shrink-0 text-faint" />
      </a>
    </div>
  );
}
