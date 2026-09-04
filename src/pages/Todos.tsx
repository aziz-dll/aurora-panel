import { useMemo, useState, type FormEvent } from 'react';
import { Empty } from '../components/Dialog';
import { Page } from '../components/Page';
import { Icon } from '../lib/icons';
import { todos as todoActions } from '../lib/actions';
import { useDB } from '../lib/store';
import { cx, daysUntil, shortDate, todayISO } from '../lib/utils';
import type { Priority, Todo, TodoCategory } from '../lib/types';

type Filter = 'all' | 'active' | 'today' | 'overdue' | 'done';

const FILTERS: Array<{ key: Filter; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'today', label: 'Today' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'done', label: 'Done' },
];

const CATEGORY_META: Record<TodoCategory, { emoji: string; label: string; cls: string }> = {
  school: { emoji: '🏫', label: 'School', cls: 'bg-[#ddebf1] text-[#183347] dark:bg-[#1e3346] dark:text-[#8fc4ea]' },
  personal: { emoji: '👤', label: 'Personal', cls: 'bg-[#fdecc8] text-[#402c1b] dark:bg-[#3d2f1a] dark:text-[#ecc06a]' },
  sport: { emoji: '🏋️', label: 'Fitness', cls: 'bg-[#fae4e4] text-[#621f1f] dark:bg-[#40222a] dark:text-[#ef8b8b]' },
};

const CATEGORIES: Array<{ key: TodoCategory; label: string; emoji: string }> = [
  { key: 'school', label: 'School', emoji: '🏫' },
  { key: 'personal', label: 'Personal', emoji: '👤' },
  { key: 'sport', label: 'Fitness', emoji: '🏋️' },
];

const PRIORITY_META: Record<Priority, { label: string; color: string }> = {
  high: { label: 'High', color: '#e03e3e' },
  med: { label: 'Medium', color: '#d9730d' },
  low: { label: 'Low', color: '#9b948f' },
};

function dueMeta(due?: string): { text: string; cls: string } | null {
  if (!due) return null;
  const diff = daysUntil(due);
  if (diff < 0) return { text: shortDate(due), cls: 'bg-[#fae4e4] text-[#621f1f] dark:bg-[#40222a] dark:text-[#ef8b8b]' };
  if (diff === 0) return { text: 'Today', cls: 'bg-[#fdecc8] text-[#402c1b] dark:bg-[#3d2f1a] dark:text-[#ecc06a]' };
  return { text: shortDate(due), cls: 'bg-hover text-soft' };
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
  };

  const saveEdit = () => {
    if (editingId) {
      const t = editText.trim();
      if (t) todoActions.setTitle(editingId, t);
    }
    setEditingId(null);
  };

  const row = (t: Todo) => {
    const dm = dueMeta(t.due);
    const pm = PRIORITY_META[t.priority];
    const cat = CATEGORY_META[t.category ?? 'school'];
    const editing = editingId === t.id;
    return (
      <li key={t.id} className="group flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-hover">
        <button
          onClick={() => todoActions.toggle(t.id)}
          aria-label="Tamamla"
          title={`${cat.emoji} ${cat.label}`}
          className={cx('todo-check h-5 w-5 rounded-full', t.done && 'checked')}
        >
          {t.done && <Icon name="check" size={11} />}
        </button>
        <span
          title={cat.label}
          className={cx('shrink-0 rounded-full px-1.5 text-[10px]', cat.cls)}
        >
          {cat.emoji}
        </span>

        {editing ? (
          <input
            autoFocus
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={saveEdit}
            onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
            className="min-w-0 flex-1 rounded-md border-b-2 border-accent bg-transparent px-0.5 py-0.5"
          />
        ) : (
          <button
            onClick={() => {
              setEditingId(t.id);
              setEditText(t.title);
            }}
            className={cx('strike min-w-0 flex-1 truncate text-left text-sm', t.done && 'struck text-faint')}
            title="Edit"
          >
            {t.title}
          </button>
        )}

        <div className="flex shrink-0 items-center gap-1.5">
          {t.course && (
            <span className="hidden max-w-28 truncate rounded-full bg-hover px-2 py-0.5 text-xs text-soft sm:inline">
              {t.course}
            </span>
          )}
          {dm && <span className={cx('rounded-full px-2 py-0.5 text-xs font-medium', dm.cls)}>{dm.text}</span>}
          <span title={`Priority: ${pm.label}`} className="h-2 w-2 shrink-0 rounded-full" style={{ background: pm.color }} />
          <button
            onClick={() => todoActions.remove(t.id)}
            aria-label="Delete"
            className="btn btn-ghost p-1 text-faint opacity-0 transition-opacity group-hover:opacity-100 max-md:opacity-100"
          >
            <Icon name="trash" size={13} />
          </button>
        </div>
      </li>
    );
  };

  return (
    <Page icon="✅" title="Tasks" subtitle={`${activeCount} open task(s)`}>
      <form onSubmit={submit} className="card mb-3 flex flex-col gap-2 p-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="New task…"
            className="field min-w-0 flex-1 border-transparent bg-transparent focus:bg-transparent sm:border-line dark:focus:bg-transparent"
          />
          <div className="flex gap-2">
            <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="field w-auto" />
            <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className="field w-auto">
              <option value="high">High</option>
              <option value="med">Medium</option>
              <option value="low">Low</option>
            </select>
            <button type="submit" disabled={!title.trim()} className="btn btn-primary">
              <Icon name="plus" size={14} /> Add
            </button>
          </div>
        </div>
        <div className="flex gap-1 rounded-lg bg-side p-0.5">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setCategory(c.key)}
              className={cx(
                'flex-1 rounded-md px-2 py-1 text-[11px] transition-colors',
                category === c.key ? 'bg-paper font-medium shadow-[var(--shadow-card)]' : 'text-soft hover:text-ink',
              )}
              aria-pressed={category === c.key}
            >
              {c.emoji} {c.label}
            </button>
          ))}
        </div>
      </form>

      <div className="mb-3 space-y-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex flex-wrap gap-1 rounded-xl border border-line bg-side p-1">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cx(
                  'rounded-lg px-2.5 py-1 text-xs transition-colors',
                  filter === f.key ? 'bg-paper font-medium shadow-[var(--shadow-card)]' : 'text-soft hover:text-ink',
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex gap-1 rounded-xl border border-line bg-side p-1">
            <button
              onClick={() => setCatFilter('all')}
              className={cx(
                'rounded-lg px-2.5 py-1 text-xs transition-colors',
                catFilter === 'all' ? 'bg-paper font-medium shadow-[var(--shadow-card)]' : 'text-soft hover:text-ink',
              )}
            >
              All
            </button>
            {CATEGORIES.map((c) => (
              <button
                key={c.key}
                onClick={() => setCatFilter(c.key)}
                className={cx(
                  'flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs transition-colors',
                  catFilter === c.key ? 'bg-paper font-medium shadow-[var(--shadow-card)]' : 'text-soft hover:text-ink',
                )}
              >
                <span>{c.emoji}</span>
                <span className="text-faint">{catCounts[c.key]}</span>
              </button>
            ))}
          </div>
          <div className="relative ml-auto">
            <Icon name="search" size={13} className="absolute top-1/2 left-2.5 -translate-y-1/2 text-faint" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search…" className="field w-32 pl-7 text-xs md:w-44" />
          </div>
        </div>
      </div>

      {list.length === 0 ? (
        <Empty emoji="🍃" text="No tasks to show here." />
      ) : (
        <div className="space-y-6">
          {openList.length > 0 && <ul className="space-y-0.5">{openList.map(row)}</ul>}

          {doneList.length > 0 && (
            <section>
              <button onClick={() => setShowDone(!showDone)} className="btn btn-ghost mb-1 px-2 text-xs text-soft">
                <Icon name={showDone ? 'chevronDown' : 'chevronRight'} size={12} />
                Tamamlanan ({doneList.length})
              </button>
              {showDone && <ul className="space-y-0.5">{doneList.map(row)}</ul>}
            </section>
          )}
        </div>
      )}
    </Page>
  );
}
