import { useEffect, useMemo, useRef, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Icon } from '../lib/icons';
import { notes as noteActions } from '../lib/actions';
import { useDB } from '../lib/store';
import { cx } from '../lib/utils';

export default function Notes() {
  const db = useDB();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const sorted = useMemo(
    () =>
      [...db.notes].sort(
        (a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt.localeCompare(a.updatedAt),
      ),
    [db.notes],
  );
  const selected = db.notes.find((n) => n.id === selectedId) ?? null;

  useEffect(() => {
    if (!bodyRef.current) return;
    bodyRef.current.style.height = 'auto';
    bodyRef.current.style.height = `${bodyRef.current.scrollHeight}px`;
  }, [selected?.id, selected?.body]);

  const create = () => {
    const id = noteActions.add();
    setSelectedId(id);
  };

  return (
    <div className="mx-auto flex h-full w-full max-w-[1000px] px-4 pt-20 md:px-10 md:pt-10">
      {/* Liste */}
      <aside className={cx('w-full shrink-0 flex-col pb-32 md:flex md:w-64 md:pb-16', selected ? 'hidden' : 'flex')}>
        <div className="mb-1 text-[26px] leading-none md:text-[34px] select-none">📝</div>
        <div className="mb-4 flex items-start justify-between gap-3">
          <h1 className="text-[22px] font-bold tracking-tight md:text-[28px]">Notes</h1>
          <button onClick={create} className="btn btn-ghost mt-1 border border-line" aria-label="Yeni not">
            <Icon name="plus" size={14} />
          </button>
        </div>
        {sorted.length === 0 && <p className="text-sm text-faint">Henüz not yok.</p>}
        <ul className="space-y-0.5">
          {sorted.map((n) => (
            <li key={n.id}>
              <button
                onClick={() => setSelectedId(n.id)}
                className={cx(
                  'w-full rounded-lg px-3 py-2 text-left transition-colors',
                  n.id === selectedId ? 'bg-accent-soft' : 'hover:bg-hover',
                )}
              >
                <span className="flex items-center gap-1.5">
                  {n.pinned && <Icon name="star" size={11} className="shrink-0 text-[#d9730d]" />}
                  <span className="truncate text-sm font-medium">{n.title || 'Başlıksız'}</span>
                </span>
                <span className="block truncate text-xs text-faint">{n.body.split('\n')[0] || 'Free not'}</span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* Düzenleyici */}
      {selected && (
        <section key={selected.id} className="flex min-w-0 flex-1 flex-col pb-10 animate-[page-in_200ms_var(--ease-out)] md:pl-8">
          <div className="flex items-center gap-1.5">
            <button onClick={() => setSelectedId(null)} className="btn btn-ghost -ml-2 p-2 text-soft md:hidden" aria-label="Geri">
              <Icon name="arrowLeft" size={17} />
            </button>
            <div className="flex-1" />
            <button
              onClick={() => noteActions.patch(selected.id, { pinned: !selected.pinned })}
              className={cx('btn btn-ghost p-2 transition-transform active:scale-90', selected.pinned ? 'text-[#d9730d]' : 'text-faint')}
              aria-label="Sabitle"
            >
              <Icon name="star" size={15} />
            </button>
            <button
              onClick={() => {
                if (confirm('Bu not silinsin mi?')) {
                  noteActions.remove(selected.id);
                  setSelectedId(null);
                }
              }}
              className="btn btn-ghost p-2 text-faint hover:text-[#e03e3e]"
              aria-label="Delete"
            >
              <Icon name="trash" size={15} />
            </button>
          </div>

          <input
            value={selected.title}
            onChange={(e) => noteActions.patch(selected.id, { title: e.target.value })}
            placeholder="Başlıksız"
            className="font-display -ml-1 mt-3 w-full bg-transparent text-xl font-bold tracking-tight placeholder:text-faint/50 md:text-2xl"
          />
          <textarea
            ref={bodyRef}
            value={selected.body}
            onChange={(e) => noteActions.patch(selected.id, { body: e.target.value })}
            placeholder="Bir şeyler yaz…"
            rows={6}
            className="-ml-1 mt-3 w-full resize-none overflow-hidden bg-transparent text-sm leading-relaxed placeholder:text-faint/50"
          />

          <p className="mt-auto pt-4 text-xs text-faint">
            {selected.body.trim() ? selected.body.trim().split(/\s+/).length : 0} kelime · son düzenleme{' '}
            {formatDistanceToNow(new Date(selected.updatedAt), { addSuffix: true, locale: tr })}
          </p>
        </section>
      )}
    </div>
  );
}
