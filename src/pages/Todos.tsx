import { useMemo, useRef, useState, type FormEvent, type ReactNode, type TouchEvent } from 'react';
import { Dialog, Empty } from '../components/Dialog';
import { Page } from '../components/Page';
import { Icon } from '../lib/icons';
import { todos as todoActions } from '../lib/actions';
import { useDB } from '../lib/store';
import { cx, daysUntil, shortDate, todayISO } from '../lib/utils';
import type { Priority, Todo, TodoCategory } from '../lib/types';

type Filter = 'all' | 'active' | 'today' | 'overdue' | 'done';

const FILTERS: Array<{ key: Filter; label: string }> = [
  { key: 'all', label: 'Tümü' },
  { key: 'active', label: 'Aktif' },
  { key: 'today', label: 'Bugün' },
  { key: 'overdue', label: 'Geciken' },
  { key: 'done', label: 'Tamamlanan' },
];

const CATEGORIES: Array<{ key: TodoCategory; label: string; icon: 'school' | 'person' | 'dumbbell' }> = [
  { key: 'school', label: 'Okul', icon: 'school' },
  { key: 'personal', label: 'Kişisel', icon: 'person' },
  { key: 'sport', label: 'Spor', icon: 'dumbbell' },
];

const PRIORITY_META: Record<Priority, { label: string; cls: string }> = {
  high: { label: 'Yüksek', cls: 'bg-error-container text-on-error-container' },
  med: { label: 'Orta', cls: 'bg-tertiary-container text-on-tertiary-container' },
  low: { label: 'Düşük', cls: 'bg-secondary-container text-on-secondary-container' },
};

function dueChipCls(due?: string): string {
  if (!due) return '';
  const diff = daysUntil(due);
  if (diff < 0) return 'bg-error-container text-on-error-container';
  if (diff === 0) return 'bg-tertiary-container text-on-tertiary-container';
  return 'bg-secondary-container text-on-secondary-container';
}

function sortTodos(list: Todo[]): Todo[] {
  const pw: Record<Priority, number> = { high: 0, med: 1, low: 2 };
  return [...list].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    if (a.due && b.due) {
      const c = a.due.localeCompare(b.due);
      if (c !== 0) return c;
    } else if (a.due !== b.due) {
      return a.due ? -1 : 1;
    }
    if (pw[a.priority] !== pw[b.priority]) return pw[a.priority] - pw[b.priority];
    return b.createdAt.localeCompare(a.createdAt);
  });
}

/* Dokunarak sağa kaydırınca silme — CSS transition, kütüphane yok */
function SwipeRow({ children, onDelete }: { children: ReactNode; onDelete: () => void }) {
  const [dx, setDx] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const [axis, setAxis] = useState<'x' | 'y' | null>(null);
  const startX = useRef(0);
  const startY = useRef(0);

  const onTouchStart = (e: TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    setAxis(null);
  };

  const onTouchMove = (e: TouchEvent) => {
    const dxCandidate = e.touches[0].clientX - startX.current;
    const dyCandidate = e.touches[0].clientY - startY.current;
    let ax = axis;
    if (!ax) {
      if (Math.abs(dxCandidate) > 8 || Math.abs(dyCandidate) > 8) {
        ax = Math.abs(dxCandidate) > Math.abs(dyCandidate) ? 'x' : 'y';
        setAxis(ax);
      } else {
        return;
      }
    }
    if (ax === 'x') setDx(Math.min(0, Math.max(-140, dxCandidate)));
  };

  const onTouchEnd = () => {
    if (dx < -80) {
      setLeaving(true);
      setDx(-140);
      setTimeout(onDelete, 160);
      return;
    }
    setDx(0);
    setAxis(null);
  };

  return (
    <li className="relative overflow-hidden rounded-[var(--md-shape-md)]">
      <div className="absolute inset-y-0 right-0 flex items-center pr-5 text-error" aria-hidden="true">
        <Icon name="trash" size={20} />
      </div>
      <div
        className="relative bg-surface-container-low"
        style={{
          transform: `translateX(${dx}px)`,
          opacity: leaving ? 0 : 1,
          transition: axis === 'x' ? 'none' : 'transform 200ms var(--ease-spring), opacity 160ms ease',
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {children}
      </div>
    </li>
  );
}

export default function Todos() {
  const db = useDB();
  const [filter, setFilter] = useState<Filter>('all');
  const [catFilter, setCatFilter] = useState<TodoCategory | 'all'>('all');
  const [query, setQuery] = useState('');
  const [title, setTitle] = useState('');
  const [due, setDue] = useState('');
  const [priority, setPriority] = useState<Priority>('med');
  const [category, setCategory] = useState<TodoCategory>('school');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [showDone, setShowDone] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  const list = useMemo(() => {
    let l = sortTodos(db.todos);
    if (filter === 'active') l = l.filter((t) => !t.done);
    else if (filter === 'done') l = l.filter((t) => t.done);
    else if (filter === 'today') l = l.filter((t) => !t.done && t.due === todayISO());
    else if (filter === 'overdue') l = l.filter((t) => !t.done && t.due && daysUntil(t.due) < 0);
    if (catFilter !== 'all') l = l.filter((t) => (t.category ?? 'school') === catFilter);
    if (query.trim()) {
      const q = query.toLowerCase();
      l = l.filter((t) => t.title.toLowerCase().includes(q) || t.course?.toLowerCase().includes(q));
    }
    return l;
  }, [db.todos, filter, catFilter, query]);

  const activeCount = db.todos.filter((t) => !t.done).length;
  const catCounts = useMemo(() => {
    const counts: Record<TodoCategory, number> = { school: 0, personal: 0, sport: 0 };
    for (const t of db.todos) {
      if (!t.done) counts[t.category ?? 'school']++;
    }
    return counts;
  }, [db.todos]);
  const doneList = list.filter((t) => t.done);
  const openList = list.filter((t) => !t.done);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;
    todoActions.add(t, priority, due, undefined, category);
    setTitle('');
    setDue('');
    setPriority('med');
    setCategory('school');
    setFormOpen(false);
  };

  const saveEdit = () => {
    if (editingId) {
      const t = editText.trim();
      if (t) todoActions.setTitle(editingId, t);
    }
    setEditingId(null);
  };

  const row = (t: Todo) => {
    const cat = CATEGORIES.find((c) => c.key === (t.category ?? 'school')) ?? CATEGORIES[0];
    const pm = PRIORITY_META[t.priority];
    const editing = editingId === t.id;
    return (
      <SwipeRow key={t.id} onDelete={() => todoActions.remove(t.id)}>
        <div className="m3-list-item">
          <button
            onClick={() => todoActions.toggle(t.id)}
            aria-label="Tamamla"
            className={cx('todo-check h-6 w-6', t.done && 'checked')}
          >
            {t.done && <Icon name="check" size={13} />}
          </button>
          <span className="m3-list-lines">
            {editing ? (
              <input
                autoFocus
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onBlur={saveEdit}
                onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                className="m3-list-headline field py-0.5"
                aria-label="Görevi düzenle"
              />
            ) : (
              <button
                onClick={() => {
                  setEditingId(t.id);
                  setEditText(t.title);
                }}
                className={cx('strike m3-list-headline text-left', t.done && 'struck text-on-surface-variant')}
                title="Düzenlemek için dokun"
              >
                {t.title}
              </button>
            )}
            <span className="m3-list-supporting">
              {cat.label}
              {t.course ? ` · ${t.course}` : ''}
            </span>
          </span>
          <span className="m3-list-trailing gap-1.5">
            {t.due && (
              <span className={cx('m3-chip h-6 px-2 text-[11px]', dueChipCls(t.due))}>{shortDate(t.due)}</span>
            )}
            <span
              title={`Öncelik: ${pm.label}`}
              className={cx('h-2.5 w-2.5 shrink-0 rounded-full', {
                high: 'bg-error',
                med: 'bg-tertiary',
                low: 'bg-outline',
              }[t.priority])}
            />
            <button
              onClick={() => todoActions.remove(t.id)}
              aria-label="Sil"
              className="m3-icon-btn h-8 w-8 opacity-0 max-md:hidden group-hover:opacity-100"
            >
              <Icon name="trash" size={16} />
            </button>
          </span>
        </div>
      </SwipeRow>
    );
  };

  return (
    <Page title="Görevler" subtitle={`${activeCount} açık görev`}>
      {/* Filtre çipleri */}
      <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cx('m3-chip shrink-0', filter === f.key && 'm3-chip-selected')}
            aria-pressed={filter === f.key}
          >
            {filter === f.key && <Icon name="check" size={16} />}
            {f.label}
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex gap-2">
          <button
            onClick={() => setCatFilter('all')}
            className={cx('m3-chip', catFilter === 'all' && 'm3-chip-selected')}
            aria-pressed={catFilter === 'all'}
          >
            Hepsi
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              onClick={() => setCatFilter(c.key)}
              className={cx('m3-chip', catFilter === c.key && 'm3-chip-selected')}
              aria-pressed={catFilter === c.key}
            >
              <Icon name={c.icon} size={15} />
              {c.label}
              <span className="text-outline tabular-nums">{catCounts[c.key]}</span>
            </button>
          ))}
        </div>
        <div className="relative ml-auto">
          <Icon name="search" size={15} className="absolute top-1/2 left-2.5 -translate-y-1/2 text-outline" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ara…"
            className="field w-36 py-1.5 pl-8 text-xs md:w-48"
            aria-label="Görevlerde ara"
          />
        </div>
      </div>

      {list.length === 0 ? (
        <Empty emoji="🍃" text="Burada gösterilecek görev yok." />
      ) : (
        <div className="space-y-5 group/list">
          {openList.length > 0 && <ul className="space-y-1">{openList.map(row)}</ul>}

          {doneList.length > 0 && (
            <section>
              {filter !== 'done' && (
                <button
                  onClick={() => setShowDone(!showDone)}
                  className="m3-btn m3-btn-text mb-1 text-on-surface-variant"
                  aria-expanded={showDone}
                >
                  <Icon name={showDone ? 'expandLess' : 'expandMore'} size={18} />
                  Tamamlanan ({doneList.length})
                </button>
              )}
              {(showDone || filter === 'done') && <ul className="space-y-1">{doneList.map(row)}</ul>}
            </section>
          )}
        </div>
      )}

      {/* Yeni görev FAB'ı */}
      <button onClick={() => setFormOpen(true)} className="m3-fab" aria-label="Yeni görev ekle">
        <Icon name="plus" size={24} />
      </button>

      {/* Yeni görev formu */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} title="Yeni Görev">
        <form onSubmit={submit} className="space-y-3">
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Görev…"
            className="field"
            aria-label="Görev başlığı"
          />
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1">
              <span className="label-large text-on-surface-variant">Bitiş</span>
              <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="field" />
            </label>
            <label className="space-y-1">
              <span className="label-large text-on-surface-variant">Kategori</span>
              <select value={category} onChange={(e) => setCategory(e.target.value as TodoCategory)} className="field">
                {CATEGORIES.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div>
            <span className="label-large mb-1 block text-on-surface-variant">Öncelik</span>
            <div className="m3-segmented w-full">
              {(['low', 'med', 'high'] as Priority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={cx('m3-segmented-btn flex-1', priority === p && 'm3-segmented-selected')}
                  aria-pressed={priority === p}
                >
                  {PRIORITY_META[p].label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => setFormOpen(false)} className="m3-btn m3-btn-text">
              Vazgeç
            </button>
            <button type="submit" disabled={!title.trim()} className="m3-btn m3-btn-filled">
              <Icon name="plus" size={16} /> Ekle
            </button>
          </div>
        </form>
      </Dialog>
    </Page>
  );
}
