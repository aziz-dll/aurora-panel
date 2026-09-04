import { useMemo, useState, type FormEvent } from 'react';
import { Droplet, BookOpen, Dumbbell, Flame, Target, Activity, Sun, Moon, Clock, Heart, Star, CheckSquare, ListChecks, Archive, StickyNote, Repeat, TrendingUp, Zap, Gauge, Cpu, Pencil, Plus, Check, X } from 'lucide-react';
import { Empty } from '../components/Dialog';
import { Page } from '../components/Page';
import { habits as habitActions } from '../lib/actions';
import { useDB } from '../lib/store';
import { cx, todayISO } from '../lib/utils';
import {
  HABIT_COLORS,
  HABIT_ICONS,
  WEEKDAYS_SHORT,
  habitCompletedOn,
  habitExpectedOn,
  habitRate,
  habitStreak,
  lastNDates,
  tileStatus,
} from '../lib/habits';
import type { Habit, HabitCategory, HabitFrequency, HabitType } from '../lib/types';

const CATEGORIES: Array<{ key: HabitCategory; label: string }> = [
  { key: 'health', label: 'Health' },
  { key: 'productivity', label: 'Productivity' },
  { key: 'mind', label: 'Mind' },
  { key: 'social', label: 'Social' },
  { key: 'other', label: 'Other' },
];

const FREQUENCIES: Array<{ key: HabitFrequency; label: string; needsTarget?: boolean; needsWeekdays?: boolean }> = [
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly', needsWeekdays: true },
  { key: 'x-per-week', label: 'X per week', needsTarget: true },
  { key: 'x-per-month', label: 'X per month', needsTarget: true },
];

const DEFAULT_WEEKDAYS = [0, 1, 2, 3, 4]; // Mon-Fri

// Map lucide icon name → component (used in icon picker + tile icons)
const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  dumbbell: Dumbbell,
  drop: Droplet,
  book: BookOpen,
  flame: Flame,
  target: Target,
  activity: Activity,
  sun: Sun,
  moon: Moon,
  clock: Clock,
  heart: Heart,
  star: Star,
  checkSquare: CheckSquare,
  listChecks: ListChecks,
  archive: Archive,
  stickyNote: StickyNote,
  repeat: Repeat,
  trendingUp: TrendingUp,
  zap: Zap,
  gauge: Gauge,
  cpu: Cpu,
};

function HabitIcon({ name, size = 16, className }: { name: string; size?: number; className?: string }) {
  const C = ICON_MAP[name] ?? CheckSquare;
  return <C size={size} className={className} />;
}

const BUILT_THRESHOLD = 21;

function HabitCard({
  habit,
  onToggle,
  onEdit,
  onArchive,
  showGrid,
  onToggleGrid,
}: {
  habit: Habit;
  onToggle: () => void;
  onEdit: () => void;
  onArchive: () => void;
  showGrid: boolean;
  onToggleGrid: () => void;
}) {
  const db = useDB();
  const today = todayISO();
  const done = habitCompletedOn(db.habitLog, habit, today);
  const streak = habitStreak(db.habitLog, habit, today);
  const rate = habitRate(db.habitLog, habit, today, 30);
  const isBuilt = habit.type === 'build' && streak >= BUILT_THRESHOLD;

  return (
    <div
      className={cx(
        'rounded-xl border p-3 transition-all',
        done ? 'shadow-[var(--shadow-card)]' : 'border-line hover:border-accent/30',
      )}
      style={done ? { backgroundColor: `${habit.color}10`, borderColor: `${habit.color}40` } : undefined}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onToggle}
          className="grid h-12 w-12 shrink-0 place-items-center rounded-full transition-all active:scale-95"
          style={done ? { backgroundColor: habit.color, color: '#fff' } : { backgroundColor: `${habit.color}1a`, color: habit.color }}
          aria-label={habit.type === 'quit' ? 'Mark as slip' : 'Mark as done'}
        >
          {done ? <Check size={20} /> : <HabitIcon name={habit.icon} size={20} />}
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className={cx('truncate text-[15px] font-semibold', done && 'opacity-70')}>
              {habit.title}
            </p>
            {isBuilt && <span title={`${BUILT_THRESHOLD}+ day streak`}>🎉</span>}
            {habit.archived && <span title="Archived">📦</span>}
            {habit.type === 'quit' && (
              <span className="rounded-full bg-[#fae4e4] px-1.5 text-[10px] font-semibold text-[#621f1f] dark:bg-[#40222a] dark:text-[#ef8b8b]">
                quit
              </span>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-[11px] text-soft">
            {streak > 0 && (
              <span className="font-medium text-[#d9730d]">
                🔥 {streak} day{streak === 1 ? '' : 's'}
              </span>
            )}
            {rate > 0 && <span>· {rate}% (30d)</span>}
            {habit.frequency === 'weekly' && habit.weekdays && (
              <span>· {habit.weekdays.map((d) => WEEKDAYS_SHORT[d]).join('')}</span>
            )}
            {habit.reminderTime && <span>· ⏰ {habit.reminderTime}</span>}
          </div>
        </div>
        <div className="flex shrink-0 gap-0.5">
          <button
            onClick={onToggleGrid}
            className="btn btn-ghost p-1.5 text-faint"
            aria-label="Toggle streak grid"
            title="Show streak grid"
          >
            <span className="text-[10px] font-semibold uppercase">30d</span>
          </button>
          <button
            onClick={onEdit}
            className="btn btn-ghost p-1.5 text-faint"
            aria-label="Edit"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={onArchive}
            className="btn btn-ghost p-1.5 text-faint"
            aria-label={habit.archived ? 'Unarchive' : 'Archive'}
            title={habit.archived ? 'Unarchive' : 'Archive'}
          >
            <Archive size={14} />
          </button>
        </div>
      </div>

      {showGrid && <TileStreakGrid habit={habit} />}
    </div>
  );
}

function TileStreakGrid({ habit }: { habit: Habit }) {
  const db = useDB();
  const days = lastNDates(todayISO(), 30);
  const todayIso = todayISO();
  // 5 rows × 6 columns (30 cells)
  return (
    <div className="mt-3 flex flex-wrap gap-[3px] pl-[3.75rem]">
      {days.map((iso) => {
        const status = tileStatus(habit, iso, db.habitLog);
        const isToday = iso === todayIso;
        const isFuture = iso > todayIso;
        let bg = 'var(--line)';
        if (status === 'done') bg = habit.color;
        else if (status === 'skip') bg = 'transparent';
        return (
          <div
            key={iso}
            title={iso}
            className={cx(
              'h-5 w-5 rounded-sm transition-all',
              isToday && 'ring-2 ring-[var(--accent)]',
              isFuture && 'opacity-30',
            )}
            style={{ background: status === 'done' ? bg : status === 'slip' ? 'rgba(224, 62, 62, 0.25)' : status === 'skip' ? 'transparent' : 'var(--line)' }}
          />
        );
      })}
    </div>
  );
}

function NewHabitForm({
  initial,
  onClose,
}: {
  initial?: Habit | null;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [type, setType] = useState<HabitType>(initial?.type ?? 'build');
  const [icon, setIcon] = useState(initial?.icon ?? 'checkSquare');
  const [color, setColor] = useState(initial?.color ?? HABIT_COLORS[0]);
  const [frequency, setFrequency] = useState<HabitFrequency>(initial?.frequency ?? 'daily');
  const [target, setTarget] = useState<number>(initial?.target ?? 3);
  const [weekdays, setWeekdays] = useState<number[]>(initial?.weekdays ?? DEFAULT_WEEKDAYS);
  const [reminderTime, setReminderTime] = useState(initial?.reminderTime ?? '09:00');
  const [category, setCategory] = useState<HabitCategory>(initial?.category ?? 'health');

  const freqMeta = FREQUENCIES.find((f) => f.key === frequency)!;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;
    const payload = {
      title: t,
      type,
      icon,
      color,
      frequency,
      target: freqMeta.needsTarget ? target : undefined,
      weekdays: freqMeta.needsWeekdays ? weekdays : undefined,
      reminderTime: reminderTime || undefined,
      category,
    };
    if (initial) habitActions.update(initial.id, payload);
    else habitActions.add(payload);
    onClose();
  };

  return (
    <form onSubmit={submit} className="card mb-4 space-y-3 p-3 animate-[pop-in_240ms_var(--ease-spring)]">
      <div className="flex gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Drink water"
          className="field flex-1"
          autoFocus
        />
      </div>

      <div className="flex gap-1 rounded-lg bg-side p-0.5">
        <button
          type="button"
          onClick={() => setType('build')}
          className={cx('flex-1 rounded-md px-2 py-1 text-[11px]', type === 'build' ? 'bg-paper font-medium shadow-[var(--shadow-card)]' : 'text-soft')}
          aria-pressed={type === 'build'}
        >
          📈 Build
        </button>
        <button
          type="button"
          onClick={() => setType('quit')}
          className={cx('flex-1 rounded-md px-2 py-1 text-[11px]', type === 'quit' ? 'bg-paper font-medium shadow-[var(--shadow-card)]' : 'text-soft')}
          aria-pressed={type === 'quit'}
        >
          🚭 Quit
        </button>
      </div>

      <div>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-faint">Icon</p>
        <div className="grid grid-cols-7 gap-1">
          {HABIT_ICONS.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setIcon(name)}
              className={cx(
                'grid h-9 w-9 place-items-center rounded-md transition-all',
                icon === name ? 'bg-accent-soft ring-2 ring-accent' : 'bg-side text-soft hover:bg-hover',
              )}
              aria-pressed={icon === name}
            >
              <HabitIcon name={name} size={16} />
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-faint">Color</p>
        <div className="flex flex-wrap gap-2">
          {HABIT_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={cx(
                'h-6 w-6 rounded-full transition-transform',
                color === c ? 'scale-110 ring-2 ring-offset-2 ring-offset-paper' : 'opacity-60 hover:opacity-100',
              )}
              style={{
                background: c,
                ...(color === c
                  ? ({ ['--tw-ring-color' as string]: c } as React.CSSProperties)
                  : {}),
              }}
            />
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-faint">Frequency</p>
        <div className="grid grid-cols-2 gap-1.5">
          {FREQUENCIES.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFrequency(f.key)}
              className={cx(
                'rounded-md px-2 py-1.5 text-[11px] transition-colors',
                frequency === f.key ? 'bg-accent text-white' : 'bg-side text-soft hover:bg-hover',
              )}
              aria-pressed={frequency === f.key}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {freqMeta.needsTarget && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-soft">Target</span>
          <input
            type="number"
            min={1}
            max={31}
            value={target}
            onChange={(e) => setTarget(Math.max(1, Math.min(31, Number(e.target.value) || 1)))}
            className="field w-20"
          />
          <span className="text-xs text-soft">{frequency === 'x-per-week' ? 'days/week' : 'days/month'}</span>
        </div>
      )}

      {freqMeta.needsWeekdays && (
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-faint">Days</p>
          <div className="flex gap-1">
            {WEEKDAYS_SHORT.map((d, i) => (
              <button
                key={d}
                type="button"
                onClick={() =>
                  setWeekdays((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i].sort()))
                }
                className={cx(
                  'h-9 flex-1 rounded-md text-[11px] font-medium',
                  weekdays.includes(i) ? 'bg-accent text-white' : 'bg-side text-soft hover:bg-hover',
                )}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-1">
          <span className="text-xs text-soft">Reminder</span>
          <input
            type="time"
            value={reminderTime}
            onChange={(e) => setReminderTime(e.target.value)}
            className="field"
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs text-soft">Category</span>
          <select value={category} onChange={(e) => setCategory(e.target.value as HabitCategory)} className="field">
            {CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={onClose} className="btn btn-ghost flex-1 border border-line">
          <X size={14} /> Cancel
        </button>
        <button type="submit" disabled={!title.trim()} className="btn btn-primary flex-1">
          {initial ? 'Save' : <><Plus size={14} /> Add</>}
        </button>
      </div>
    </form>
  );
}

export default function Habits() {
  const db = useDB();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Habit | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [openGrid, setOpenGrid] = useState<Set<string>>(new Set());
  const today = todayISO();

  const { activeHabits, archivedHabits } = useMemo(() => {
    const active = db.habits.filter((h) => !h.archived);
    const archived = db.habits.filter((h) => h.archived);
    return { activeHabits: active, archivedHabits: archived };
  }, [db.habits]);

  const todayHabits = useMemo(() => {
    return activeHabits
      .filter((h) => habitExpectedOn(db.habitLog, h, today))
      .sort((a, b) => {
        const aDone = habitCompletedOn(db.habitLog, a, today) ? 1 : 0;
        const bDone = habitCompletedOn(db.habitLog, b, today) ? 1 : 0;
        if (aDone !== bDone) return aDone - bDone;
        return a.title.localeCompare(b.title);
      });
  }, [activeHabits, db.habitLog, today]);

  const otherHabits = useMemo(() => {
    return activeHabits
      .filter((h) => !habitExpectedOn(db.habitLog, h, today))
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [activeHabits, db.habitLog, today]);

  const toggleGrid = (id: string) => {
    setOpenGrid((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <Page
      icon="🔁"
      title="Habits"
      subtitle={
        db.habits.length === 0
          ? 'Track daily routines'
          : `${activeHabits.length} active${archivedHabits.length ? ` · ${archivedHabits.length} archived` : ''}`
      }
      actions={
        <button
          onClick={() => setShowArchived(!showArchived)}
          className={cx('btn btn-ghost p-1.5', showArchived && 'bg-accent-soft text-accent')}
          aria-label="Toggle archived"
          title="Show archived"
        >
          <Archive size={14} />
        </button>
      }
    >
      {!adding && !editing && (
        <button onClick={() => setAdding(true)} className="btn btn-primary mb-3 w-full justify-center">
          <Plus size={14} /> New habit
        </button>
      )}
      {adding && <NewHabitForm onClose={() => setAdding(false)} />}
      {editing && <NewHabitForm initial={editing} onClose={() => setEditing(null)} />}

      {db.habits.length === 0 ? (
        <Empty emoji="🌱" text="No habits yet — add your first one to start tracking." />
      ) : (
        <div className="space-y-5">
          {todayHabits.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-semibold text-soft">Today</h2>
              <div className="space-y-2">
                {todayHabits.map((h) => (
                  <HabitCard
                    key={h.id}
                    habit={h}
                    onToggle={() => habitActions.toggle(today, h.id)}
                    onEdit={() => setEditing(h)}
                    onArchive={() => habitActions.archive(h.id, !h.archived)}
                    showGrid={openGrid.has(h.id)}
                    onToggleGrid={() => toggleGrid(h.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {otherHabits.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-semibold text-soft">Not scheduled today</h2>
              <div className="space-y-2">
                {otherHabits.map((h) => (
                  <HabitCard
                    key={h.id}
                    habit={h}
                    onToggle={() => habitActions.toggle(today, h.id)}
                    onEdit={() => setEditing(h)}
                    onArchive={() => habitActions.archive(h.id, !h.archived)}
                    showGrid={openGrid.has(h.id)}
                    onToggleGrid={() => toggleGrid(h.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {showArchived && archivedHabits.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-semibold text-soft">Archived ({archivedHabits.length})</h2>
              <div className="space-y-2">
                {archivedHabits.map((h) => (
                  <HabitCard
                    key={h.id}
                    habit={h}
                    onToggle={() => habitActions.toggle(today, h.id)}
                    onEdit={() => setEditing(h)}
                    onArchive={() => habitActions.archive(h.id, !h.archived)}
                    showGrid={openGrid.has(h.id)}
                    onToggleGrid={() => toggleGrid(h.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {todayHabits.length === 0 && otherHabits.length === 0 && !showArchived && (
            <p className="py-6 text-center text-sm text-faint">No active habits. Click «New habit» to add one.</p>
          )}
        </div>
      )}
    </Page>
  );
}