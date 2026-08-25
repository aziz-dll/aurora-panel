import { useMemo, useState, type FormEvent } from 'react';
import { Empty } from '../components/Dialog';
import { Icon } from '../lib/icons';
import { todos as todoActions } from '../lib/actions';
import { useDB } from '../lib/store';
import { cx, daysUntil, shortDate, todayISO } from '../lib/utils';
import type { Priority, Todo } from '../lib/types';

type Filter = 'all' | 'active' | 'today' | 'overdue' | 'done';

const FILTERS: Array<{ key: Filter; label: string }> = [
  { key: 'all', label: 'Tümü' },
  { key: 'active', label: 'Aktif' },
  { key: 'today', label: 'Bugün' },
  { key: 'overdue', label: 'Geciken' },
  { key: 'done', label: 'Bitti' },
];

const PRIORITY_META: Record<Priority, { label: string; color: string }> = {
  high: { label: 'Yüksek', color: '#e03e3e' },
  med: { label: 'Orta', color: '#d9730d' },
  low: { label: 'Düşük', color: '#9b948f' },
};

function dueMeta(due?: string): { text: string; cls: string } | null {
  if (!due) return null;
  const diff = daysUntil(due);
  if (diff < 0) return { text: shortDate(due), cls: 'bg-[#fae4e4] text-[#621f1f] dark:bg-[#40222a] dark:text-[#ef8b8b]' };
  if (diff === 0) return { text: 'Bugün', cls: 'bg-[#fdecc8] text-[#402c1b] dark:bg-[#3d2f1a] dark:text-[#ecc06a]' };
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
  const [query, setQuery] = useState('');
  const [title, setTitle] = useState('');
  const [due, setDue] = useState('');
  const [priority, setPriority] = useState<Priority>('med');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [showDone, setShowDone] = useState(false);

  const list = useMemo(() => {
    let l = sortTodos(db.todos);
    if (filter === 'active') l = l.filter((t) => !t.done);
    else if (filter === 'done') l = l.filter((t) => t.done);
    else if (filter === 'today') l = l.filter((t) => !t.done && t.due === todayISO());
    else if (filter === 'overdue') l = l.filter((t) => !t.done && t.due && daysUntil(t.due) < 0);
    if (query.trim()) {
      const q = query.toLowerCase();
      l = l.filter((t) => t.title.toLowerCase().includes(q) || t.course?.toLowerCase().includes(q));
    }
    return l;
  }, [db.todos, filter, query]);

  const activeCount = db.todos.filter((t) => !t.done).length;
  const doneList = list.filter((t) => t.done);
  const openList = list.filter((t) => !t.done);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;
    todoActions.add(t, priority, due);
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
    const editing = editingId === t.id;
    return (
      <li key={t.id} className="group flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-hover">
        <button
          onClick={() => todoActions.toggle(t.id)}
          aria-label="Tamamla"
          className={cx('todo-check h-5 w-5 rounded-full', t.done && 'checked')}
        >
          {t.done && <Icon name="check" size={11} />}
        </button>

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
            title="Düzenle"
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
          <span
            title={`Öncelik: ${pm.label}`}
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ background: pm.color }}
          />
          <button
            onClick={() => todoActions.remove(t.id)}
            aria-label="Sil"
            className="btn btn-ghost p-1 text-faint opacity-0 transition-opacity group-hover:opacity-100 max-md:opacity-100"
          >
            <Icon name="trash" size={13} />
          </button>
        </div>
      </li>
    );
  };

  return (
    <div className="mx-auto w-full max-w-[880px] px-4 pb-28 pt-5 md:px-10 md:pb-16 md:pt-10">
      <div className="mb-1 text-[32px] leading-none md:text-[38px] select-none">✅</div>
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-bold tracking-tight md:text-[32px]">Görevler</h1>
          <p className="mt-1 text-sm text-soft">{activeCount} açık görev</p>
        </div>
      </div>

      <form onSubmit={submit} className="card mb-4 flex flex-col gap-2 p-3 sm:flex-row sm:items-center">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Yeni görev…"
          className="field min-w-0 flex-1 border-transparent bg-transparent focus:bg-transparent sm:border-line dark:focus:bg-transparent"
        />
        <div className="flex gap-2">
          <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="field w-auto" />
          <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className="field w-auto">
            <option value="high">Yüksek</option>
            <option value="med">Orta</option>
            <option value="low">Düşük</option>
          </select>
          <button type="submit" disabled={!title.trim()} className="btn btn-primary">
            <Icon name="plus" size={14} /> Ekle
          </button>
        </div>
      </form>

      <div className="mb-3 flex items-center gap-2">
        <div className="flex flex-wrap gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cx(
                'btn px-2.5 py-1 text-xs',
                filter === f.key ? 'bg-hover font-medium' : 'text-soft hover:bg-hover',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative ml-auto">
          <Icon name="search" size={13} className="absolute top-1/2 left-2.5 -translate-y-1/2 text-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ara…"
            className="field w-32 pl-7 text-xs md:w-44"
          />
        </div>
      </div>

      {list.length === 0 ? (
        <Empty emoji="🍃" text="Burada görünecek görev yok." />
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
    </div>
  );
}
