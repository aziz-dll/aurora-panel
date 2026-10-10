import { useMemo, useState, type FormEvent } from 'react';
import { Dialog, Empty } from '../components/Dialog';
import { Page } from '../components/Page';
import { Icon, type IconName } from '../lib/icons';
import { habits as habitActions } from '../lib/actions';
import { useDB } from '../lib/store';
import { cx, todayISO } from '../lib/utils';
import {
  HABIT_COLORS,
  HABIT_ICONS,
  habitCompletedOn,
  habitExpectedOn,
  habitRate,
  habitStreak,
  lastNDates,
  tileStatus,
} from '../lib/habits';
import type { Habit, HabitCategory, HabitFrequency, HabitType } from '../lib/types';

const CATEGORIES: Array<{ key: HabitCategory; label: string }> = [
  { key: 'health', label: 'Sağlık' },
  { key: 'productivity', label: 'Verimlilik' },
  { key: 'mind', label: 'Zihin' },
  { key: 'social', label: 'Sosyal' },
  { key: 'other', label: 'Diğer' },
];

const FREQUENCIES: Array<{ key: HabitFrequency; label: string; needsTarget?: boolean; needsWeekdays?: boolean }> = [
  { key: 'daily', label: 'Günlük' },
  { key: 'weekly', label: 'Haftalık', needsWeekdays: true },
  { key: 'x-per-week', label: 'Haftada X', needsTarget: true },
  { key: 'x-per-month', label: 'Ayda X', needsTarget: true },
];

const TR_WEEKDAYS_SHORT = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

const DEFAULT_WEEKDAYS = [0, 1, 2, 3, 4]; // Pzt-Cum

function HabitIcon({ name, size = 18, className }: { name: string; size?: number; className?: string }) {
  return <Icon name={name as IconName} size={size} className={className} />;
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
  const done = habitExpectedOn(db.habitLog, habit, today) && habitCompletedOn(db.habitLog, habit, today);
  const streak = habitStreak(db.habitLog, habit, today);
  const rate = habitRate(db.habitLog, habit, today, 30);
  const isBuilt = habit.type === 'build' && streak >= BUILT_THRESHOLD;

  return (
    <div
      className={cx('m3-card m3-card-interactive', done && 'ring-1')}
      style={done ? { backgroundColor: `${habit.color}14`, borderColor: `${habit.color}55`, ['--tw-ring-color' as string]: `${habit.color}55` } : undefined}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onToggle}
          className="grid h-12 w-12 shrink-0 place-items-center rounded-full shadow-[var(--elevation-1)] transition-transform active:scale-90"
          style={done ? { backgroundColor: habit.color, color: '#fff' } : { backgroundColor: `${habit.color}1f`, color: habit.color }}
          aria-label={habit.type === 'quit' ? 'Kaydırmadım olarak işaretle' : 'Yaptım olarak işaretle'}
          aria-pressed={done}
        >
          {done ? <Icon name="check" size={22} /> : <HabitIcon name={habit.icon} size={22} />}
        </button>
        <div className="m3-list-lines">
          <div className="flex items-center gap-1.5">
            <p className={cx('m3-list-headline title-small', done && 'opacity-75')}>{habit.title}</p>
            {isBuilt && <Icon name="emojiEvents" size={15} className="shrink-0 text-tertiary" aria-label={`${BUILT_THRESHOLD}+ gün seri`} />}
            {habit.archived && <span className="label-small text-on-surface-variant">arşivli</span>}
            {habit.type === 'quit' && (
              <span className="m3-chip h-5 shrink-0 bg-error-container px-2 text-[10px] text-on-error-container">bırak</span>
            )}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 body-small text-on-surface-variant">
            {streak > 0 && (
              <span className="flex items-center gap-0.5 font-medium text-tertiary">
                <Icon name="localFireDepartment" size={12} /> {streak} gün
              </span>
            )}
            {rate > 0 && <span>· %{rate} (30g)</span>}
            {habit.frequency === 'weekly' && habit.weekdays && (
              <span>· {habit.weekdays.map((d) => TR_WEEKDAYS_SHORT[d]).join(' ')}</span>
            )}
            {habit.reminderTime && (
              <span className="flex items-center gap-0.5">
                · <Icon name="clock" size={11} /> {habit.reminderTime}
              </span>
            )}
          </div>
          {rate > 0 && (
            <div className="m3-progress mt-1.5 h-1">
              <div className="m3-progress-bar" style={{ width: `${rate}%`, background: habit.color }} />
            </div>
          )}
        </div>
        <div className="flex shrink-0">
          <button onClick={onToggleGrid} className="m3-icon-btn h-9 w-9 text-[11px] font-semibold" aria-label="30 günlük ızgarayı aç/kapat">
            30g
          </button>
          <button onClick={onEdit} className="m3-icon-btn h-9 w-9" aria-label="Düzenle">
            <Icon name="pencil" size={17} />
          </button>
          <button
            onClick={onArchive}
            className="m3-icon-btn h-9 w-9"
            aria-label={habit.archived ? 'Arşivden çıkar' : 'Arşivle'}
          >
            <Icon name="archive" size={17} />
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
  // 5 sıra × 6 sütun (30 hücre)
  return (
    <div className="mt-3 flex flex-wrap gap-[3px] pl-[3.75rem]">
      {days.map((iso) => {
        const status = tileStatus(habit, iso, db.habitLog);
        const isToday = iso === todayIso;
        const isFuture = iso > todayIso;
        return (
          <div
            key={iso}
            title={iso}
            className={cx('h-5 w-5 rounded-[var(--md-shape-xs)]', isToday && 'ring-2 ring-primary', isFuture && 'opacity-30')}
            style={{
              background:
                status === 'done'
                  ? habit.color
                  : status === 'slip'
                    ? 'rgba(224, 62, 62, 0.25)'
                    : status === 'skip'
                      ? 'transparent'
                      : 'var(--md-sys-color-surface-container-highest)',
            }}
          />
        );
      })}
    </div>
  );
}

function HabitForm({
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
    <form onSubmit={submit} className="space-y-4">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="örn. Her gün su iç"
        className="field"
        autoFocus
        aria-label="Alışkanlık adı"
      />

      <div className="m3-segmented w-full">
        <button
          type="button"
          onClick={() => setType('build')}
          className={cx('m3-segmented-btn flex-1', type === 'build' && 'm3-segmented-selected')}
          aria-pressed={type === 'build'}
        >
          Kazan
        </button>
        <button
          type="button"
          onClick={() => setType('quit')}
          className={cx('m3-segmented-btn flex-1', type === 'quit' && 'm3-segmented-selected')}
          aria-pressed={type === 'quit'}
        >
          Bırak
        </button>
      </div>

      <div>
        <p className="label-medium mb-1.5 text-on-surface-variant">Simge</p>
        <div className="grid grid-cols-7 gap-1">
          {HABIT_ICONS.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setIcon(name)}
              className={cx(
                'grid h-9 w-9 place-items-center rounded-[var(--md-shape-sm)] transition-colors',
                icon === name ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container-high text-on-surface-variant',
              )}
              aria-pressed={icon === name}
              aria-label={`Simge: ${name}`}
            >
              <HabitIcon name={name} size={17} />
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="label-medium mb-1.5 text-on-surface-variant">Renk</p>
        <div className="flex flex-wrap gap-2">
          {HABIT_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={cx(
                'h-7 w-7 rounded-full transition-transform',
                color === c ? 'scale-110 ring-2 ring-primary ring-offset-2 ring-offset-surface-container-high' : 'opacity-60 hover:opacity-100',
              )}
              style={{ background: c }}
              aria-label={`${c} rengi`}
            />
          ))}
        </div>
      </div>

      <div>
        <p className="label-medium mb-1.5 text-on-surface-variant">Sıklık</p>
        <div className="grid grid-cols-2 gap-1.5">
          {FREQUENCIES.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFrequency(f.key)}
              className={cx(
                'm3-chip w-full justify-center',
                frequency === f.key && 'm3-chip-selected',
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
          <span className="body-small text-on-surface-variant">Hedef</span>
          <input
            type="number"
            min={1}
            max={31}
            value={target}
            onChange={(e) => setTarget(Math.max(1, Math.min(31, Number(e.target.value) || 1)))}
            className="field w-20"
            aria-label="Hedef sayısı"
          />
          <span className="body-small text-on-surface-variant">{frequency === 'x-per-week' ? 'gün/hafta' : 'gün/ay'}</span>
        </div>
      )}

      {freqMeta.needsWeekdays && (
        <div>
          <p className="label-medium mb-1 text-on-surface-variant">Günler</p>
          <div className="flex gap-1">
            {TR_WEEKDAYS_SHORT.map((d, i) => (
              <button
                key={d}
                type="button"
                onClick={() =>
                  setWeekdays((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i].sort()))
                }
                className={cx(
                  'h-9 flex-1 rounded-[var(--md-shape-sm)] text-[11px] font-medium transition-colors',
                  weekdays.includes(i) ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant',
                )}
                aria-pressed={weekdays.includes(i)}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-1">
          <span className="label-large text-on-surface-variant">Hatırlatma</span>
          <input
            type="time"
            value={reminderTime}
            onChange={(e) => setReminderTime(e.target.value)}
            className="field"
          />
        </label>
        <label className="space-y-1">
          <span className="label-large text-on-surface-variant">Kategori</span>
          <select value={category} onChange={(e) => setCategory(e.target.value as HabitCategory)} className="field">
            {CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onClose} className="m3-btn m3-btn-text">
          Vazgeç
        </button>
        <button type="submit" disabled={!title.trim()} className="m3-btn m3-btn-filled">
          {initial ? (
            'Kaydet'
          ) : (
            <>
              <Icon name="plus" size={16} /> Ekle
            </>
          )}
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

  const cardProps = (h: Habit) => ({
    habit: h,
    onToggle: () => habitActions.toggle(today, h.id),
    onEdit: () => setEditing(h),
    onArchive: () => habitActions.archive(h.id, !h.archived),
    showGrid: openGrid.has(h.id),
    onToggleGrid: () => toggleGrid(h.id),
  });

  return (
    <Page
      title="Alışkanlıklar"
      subtitle={
        db.habits.length === 0
          ? 'Günlük rutinlerini takip et'
          : `${activeHabits.length} aktif${archivedHabits.length ? ` · ${archivedHabits.length} arşivli` : ''}`
      }
      actions={
        <button
          onClick={() => setShowArchived(!showArchived)}
          className={cx('m3-btn m3-btn-tonal', showArchived && 'm3-chip-selected')}
          aria-pressed={showArchived}
        >
          <Icon name="archive" size={16} /> Arşiv
        </button>
      }
    >
      {db.habits.length === 0 ? (
        <Empty emoji="🌱" text="Henüz alışkanlık yok — ilkini ekleyerek başla." />
      ) : (
        <div className="space-y-5">
          {todayHabits.length > 0 && (
            <section>
              <h2 className="title-medium mb-2 text-on-surface-variant">Bugün</h2>
              <div className="space-y-2">
                {todayHabits.map((h) => (
                  <HabitCard key={h.id} {...cardProps(h)} />
                ))}
              </div>
            </section>
          )}

          {otherHabits.length > 0 && (
            <section>
              <h2 className="title-medium mb-2 text-on-surface-variant">Bugün planlanmadı</h2>
              <div className="space-y-2">
                {otherHabits.map((h) => (
                  <HabitCard key={h.id} {...cardProps(h)} />
                ))}
              </div>
            </section>
          )}

          {showArchived && archivedHabits.length > 0 && (
            <section>
              <h2 className="title-medium mb-2 text-on-surface-variant">Arşivlenenler ({archivedHabits.length})</h2>
              <div className="space-y-2">
                {archivedHabits.map((h) => (
                  <HabitCard key={h.id} {...cardProps(h)} />
                ))}
              </div>
            </section>
          )}

          {todayHabits.length === 0 && otherHabits.length === 0 && !showArchived && (
            <p className="body-medium py-6 text-center text-on-surface-variant">
              Aktif alışkanlık yok. «Yeni alışkanlık» ile ekle.
            </p>
          )}
        </div>
      )}

      {/* Yeni alışkanlık FAB'ı */}
      <button onClick={() => setAdding(true)} className="m3-fab" aria-label="Yeni alışkanlık">
        <Icon name="plus" size={24} />
      </button>

      <Dialog open={adding} onClose={() => setAdding(false)} title="Yeni Alışkanlık">
        <HabitForm onClose={() => setAdding(false)} />
      </Dialog>

      <Dialog open={editing !== null} onClose={() => setEditing(null)} title="Alışkanlığı Düzenle">
        <HabitForm initial={editing} onClose={() => setEditing(null)} />
      </Dialog>
    </Page>
  );
}
