import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Icon, type IconName } from '../lib/icons';
import { todos as todoActions, lessonsOfDay } from '../lib/actions';
import { PROGRAM, computeStreak, wdOf } from '../lib/fitness';
import { useDB } from '../lib/store';
import { termux, type BatteryInfo } from '../lib/termux';
import { trToday } from '../lib/tr';
import type { TodoCategory } from '../lib/types';
import { cx, daysUntil, hhmmToMin, nowMin, shortDate, todayISO } from '../lib/utils';

const CATS: Array<{ key: TodoCategory; label: string }> = [
  { key: 'school', label: 'Okul' },
  { key: 'personal', label: 'Kişisel' },
  { key: 'sport', label: 'Spor' },
];

function greeting(): string {
  const h = new Date().getHours();
  if (h < 6) return 'İyi geceler';
  if (h < 12) return 'Günaydın';
  if (h < 18) return 'İyi günler';
  return 'İyi akşamlar';
}

function BatteryRing({ percent, charging }: { percent: number | null; charging: boolean }) {
  const p = Math.max(0, Math.min(100, percent ?? 0));
  const color =
    p <= 15
      ? 'var(--md-sys-color-error)'
      : charging
        ? 'var(--md-sys-color-tertiary)'
        : 'var(--md-sys-color-primary)';
  return (
    <div className="relative h-16 w-16">
      <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
        <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--md-sys-color-surface-container-highest)" strokeWidth="3.5" />
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
      {charging && (
        <Icon name="batteryChargingFull" size={16} className="absolute -right-1 -top-1 text-tertiary" />
      )}
    </div>
  );
}

function StatCard({
  icon,
  value,
  label,
  href,
  tone,
}: {
  icon: IconName;
  value: string;
  label: string;
  href: string;
  tone: 'primary' | 'secondary' | 'tertiary' | 'error';
}) {
  const toneCls = {
    primary: 'bg-primary-container text-on-primary-container',
    secondary: 'bg-secondary-container text-on-secondary-container',
    tertiary: 'bg-tertiary-container text-on-tertiary-container',
    error: 'bg-error-container text-on-error-container',
  }[tone];
  return (
    <a href={href} className="m3-card m3-card-interactive m3-state block">
      <span className={cx('m3-list-avatar mb-2', toneCls)}>
        <Icon name={icon} size={20} />
      </span>
      <p className="headline-small truncate leading-tight tabular-nums">{value}</p>
      <p className="body-small mt-0.5 truncate text-on-surface-variant">{label}</p>
    </a>
  );
}

export default function Dashboard() {
  const db = useDB();
  const [quick, setQuick] = useState('');
  const [battery, setBattery] = useState<BatteryInfo | null>(null);
  const [termuxUp, setTermuxUp] = useState<boolean | null>(null);
  const [quickCat, setQuickCat] = useState<TodoCategory>('school');

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
    todoActions.add(title, 'med', undefined, undefined, quickCat);
    setQuick('');
  };

  return (
    <div className="mx-auto w-full max-w-[880px] px-4 pb-32 pt-6 md:px-10 md:pb-16">
      {/* Selamlama */}
      <header className="mb-6">
        <span className="m3-chip m3-chip-input mb-3 select-none" role="note">
          <Icon name="calendarDays" size={14} />
          {trToday(new Date())}
        </span>
        <h1 className="headline-medium tracking-tight">
          {greeting()}
          {name ? (
            <>
              {', '}
              <span className="aurora-text">{name}</span>
            </>
          ) : null}
        </h1>
      </header>

      {/* Hızlı görev ekleme */}
      <form onSubmit={quickAdd} className="m3-card m3-card-outlined mb-5 space-y-3 p-3">
        <div className="flex gap-2">
          <input
            value={quick}
            onChange={(e) => setQuick(e.target.value)}
            placeholder="Hızlı görev ekle…"
            className="field flex-1"
            aria-label="Hızlı görev ekleme"
          />
          <button type="submit" disabled={!quick.trim()} className="m3-btn m3-btn-filled px-4" aria-label="Ekle">
            <Icon name="plus" size={18} />
          </button>
        </div>
        <div className="m3-segmented w-full">
          {CATS.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setQuickCat(c.key)}
              className={cx('m3-segmented-btn flex-1', quickCat === c.key && 'm3-segmented-selected')}
              aria-pressed={quickCat === c.key}
            >
              {c.label}
            </button>
          ))}
        </div>
      </form>

      {/* Özet kartları */}
      <div className="mb-5 grid grid-cols-2 gap-2.5 md:grid-cols-4 md:gap-3">
        <StatCard icon="calendarDays" value={String(todayLessons.length)} label="Bugünkü ders" href="#/schedule" tone="primary" />
        <StatCard icon="checkSquare" value={String(openTotal)} label="Açık görev" href="#/todos" tone="secondary" />
        <StatCard icon="localFireDepartment" value={`${streak} g`} label="Antrenman serisi" href="#/fitness" tone="tertiary" />
        <StatCard
          icon="event"
          value={nextExamIn === null ? '—' : `${nextExamIn} g`}
          label={nextExams.length ? nextExams[0].title : 'Sınav yok'}
          href="#/student"
          tone="error"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {/* Bugünün dersleri */}
        <section className="m3-card p-3 md:p-4">
          <h2 className="title-medium mb-3 text-on-surface-variant">Bugünün dersleri</h2>
          {todayLessons.length === 0 ? (
            <p className="body-medium py-3 text-center text-on-surface-variant">Bugün ders yok 🎉</p>
          ) : (
            <ul className="space-y-1">
              {todayLessons.map((l) => {
                const isNow = hhmmToMin(l.start) <= now && now < hhmmToMin(l.end);
                return (
                  <li
                    key={l.id}
                    className={cx('m3-list-item-static min-h-[3rem] bg-surface-container-low', isNow && 'ring-2 ring-primary')}
                    style={{ borderLeft: `3px solid ${l.color}`, borderRadius: 'var(--md-shape-md)' }}
                  >
                    <span className="w-[86px] shrink-0 body-small tabular-nums text-on-surface-variant">
                      {l.start}–{l.end}
                    </span>
                    <span className="m3-list-lines">
                      <span className="m3-list-headline body-medium font-medium">{l.name}</span>
                    </span>
                    {isNow ? (
                      <span className="m3-list-trailing gap-1 font-semibold text-tertiary">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-tertiary" /> Şimdi
                      </span>
                    ) : (
                      l.room && <span className="m3-list-trailing">{l.room}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Görevler */}
        <section className="m3-card p-3 md:p-4">
          <h2 className="title-medium mb-3 flex items-center justify-between text-on-surface-variant">
            Görevler
            <a href="#/todos" className="label-large text-primary hover:underline">
              Tümü →
            </a>
          </h2>
          <div className="mb-2 flex flex-wrap gap-1.5">
            <span className="m3-chip m3-chip-input h-7">{dueToday} bugün</span>
            {overdue > 0 && (
              <span className="m3-chip m3-chip-selected h-7 bg-error-container text-on-error-container">{overdue} geciken</span>
            )}
          </div>
          {openTodos.length === 0 ? (
            <p className="body-medium py-3 text-center text-on-surface-variant">Her şey tamamlandı 🌟</p>
          ) : (
            <ul className="space-y-0.5">
              {openTodos.map((todo) => (
                <li key={todo.id} className="m3-list-item-static min-h-[2.5rem] px-1">
                  <button
                    onClick={() => todoActions.toggle(todo.id)}
                    aria-label="Tamamla"
                    className="todo-check h-[18px] w-[18px]"
                  />
                  <span className="m3-list-lines">
                    <span className="m3-list-headline body-medium">{todo.title}</span>
                  </span>
                  {todo.due && (
                    <span className={cx('m3-list-trailing', todo.due < t && 'font-medium text-error')}>
                      {shortDate(todo.due)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Yaklaşan sınavlar */}
        <section className="m3-card p-3 md:p-4">
          <h2 className="title-medium mb-3 flex items-center justify-between text-on-surface-variant">
            Yaklaşan sınavlar
            <a href="#/student" className="label-large text-primary hover:underline">
              Tümü →
            </a>
          </h2>
          {nextExams.length === 0 ? (
            <p className="body-medium py-3 text-center text-on-surface-variant">Planlanmış sınav yok.</p>
          ) : (
            <ul className="space-y-1.5">
              {nextExams.map((ex) => {
                const diff = daysUntil(ex.date);
                return (
                  <li key={ex.id} className="m3-list-item-static min-h-[2.75rem] bg-surface-container-low">
                    <span className="m3-list-avatar h-8 w-8 bg-secondary-container text-on-secondary-container">
                      <Icon name="event" size={16} />
                    </span>
                    <span className="m3-list-lines">
                      <span className="m3-list-headline body-medium font-medium">{ex.title}</span>
                    </span>
                    <span className="m3-list-trailing">{shortDate(ex.date)}</span>
                    <span
                      className={cx(
                        'm3-chip h-7 shrink-0',
                        diff === 0 ? 'bg-error-container text-on-error-container' : 'm3-chip-input',
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

        {/* Cihaz */}
        <section className="m3-card p-3 md:p-4">
          <h2 className="title-medium mb-3 flex items-center justify-between text-on-surface-variant">
            Cihaz
            <a href="#/settings" className="label-large text-primary hover:underline">
              Ayarlar →
            </a>
          </h2>
          {termuxUp === false ? (
            <div className="flex flex-col items-start gap-1 py-2">
              <p className="body-medium font-medium">Termux API bağlı değil</p>
              <p className="body-small leading-relaxed text-on-surface-variant">
                Bildirim, titreşim ve batarya için sunucuyu <code className="rounded bg-surface-container-high px-1">npm run start</code> ile
                başlat ve Termux:API kur.
              </p>
            </div>
          ) : battery ? (
            <div className="flex items-center gap-4 py-1">
              <BatteryRing percent={battery.percent} charging={battery.charging} />
              <div className="space-y-0.5">
                <p className="body-large font-medium">{battery.charging ? 'Şarj oluyor' : 'Bataryada'}</p>
                <p className="body-small text-on-surface-variant">Termux API çevrimiçi · canlı</p>
              </div>
            </div>
          ) : (
            <p className="body-medium py-6 text-center text-on-surface-variant">Batarya bilgisi bekleniyor…</p>
          )}
        </section>
      </div>

      {/* Antrenman kartı */}
      <a href="#/fitness" className="m3-card m3-card-filled m3-card-interactive m3-state mt-4 flex items-center gap-3">
        <span className="m3-list-avatar bg-tertiary-container text-on-tertiary-container">
          <Icon name="fitnessCenter" size={22} />
        </span>
        <span className="m3-list-lines">
          <span className="m3-list-headline title-small">Bugünün antrenmanı: {PROGRAM[wdOf(new Date())].focus}</span>
          <span className="m3-list-supporting">
            {streak > 0 ? `${streak} günlük seri devam ediyor` : 'Seriyi bugün başlat'}
          </span>
        </span>
        <Icon name="chevronRight" size={20} className="m3-list-trailing" />
      </a>
    </div>
  );
}
