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
    <div className="mx-auto flex h-full w-full max-w-[1000px] px-4 pt-6 md:px-10 md:pt-8">
      {/* Liste */}
      <aside className={cx('w-full shrink-0 flex-col pb-32 md:flex md:w-72 md:pb-16', selected ? 'hidden' : 'flex')}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h1 className="headline-medium tracking-tight">Notlar</h1>
            <p className="body-medium mt-1 text-on-surface-variant">{sorted.length} not</p>
          </div>
        </div>
        {sorted.length === 0 && (
          <div className="m3-card p-6 text-center">
            <p className="body-medium text-on-surface-variant">Henüz not yok.</p>
            <p className="body-small mt-1 text-on-surface-variant">Sağ alttaki düğmeyle ilk notunu ekle.</p>
          </div>
        )}
        <ul className="space-y-1">
          {sorted.map((n) => (
            <li key={n.id}>
              <button
                onClick={() => setSelectedId(n.id)}
                className={cx(
                  'm3-list-item',
                  n.id === selectedId ? 'bg-secondary-container text-on-secondary-container' : 'text-on-surface',
                )}
                aria-current={n.id === selectedId ? 'true' : undefined}
              >
                <span className="m3-list-avatar h-9 w-9 bg-surface-container-high text-on-surface-variant">
                  <Icon name={n.pinned ? 'star' : 'stickyNote'} size={18} />
                </span>
                <span className="m3-list-lines">
                  <span className="m3-list-headline">{n.title || 'Başlıksız'}</span>
                  <span className="m3-list-supporting">{n.body.split('\n')[0] || 'Boş not'}</span>
                </span>
                {n.pinned && <Icon name="star" size={16} className="m3-list-trailing text-primary" />}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* Düzenleyici */}
      {selected && (
        <section key={selected.id} className="flex min-w-0 flex-1 flex-col pb-10 animate-[page-in_200ms_var(--ease-out)] md:pl-8">
          <div className="flex items-center gap-1">
            <button onClick={() => setSelectedId(null)} className="m3-icon-btn -ml-2 text-on-surface-variant md:hidden" aria-label="Geri">
              <Icon name="arrowBack" size={20} />
            </button>
            <div className="flex-1" />
            <button
              onClick={() => noteActions.patch(selected.id, { pinned: !selected.pinned })}
              className={cx('m3-icon-btn', selected.pinned ? 'text-primary' : 'text-on-surface-variant')}
              aria-label={selected.pinned ? 'Sabitlemeyi kaldır' : 'Sabitle'}
              aria-pressed={selected.pinned}
            >
              <Icon name="star" size={20} />
            </button>
            <button
              onClick={() => {
                if (confirm('Bu not silinsin mi?')) {
                  noteActions.remove(selected.id);
                  setSelectedId(null);
                }
              }}
              className="m3-icon-btn text-on-surface-variant hover:text-error"
              aria-label="Notu sil"
            >
              <Icon name="trash" size={20} />
            </button>
          </div>

          <input
            value={selected.title}
            onChange={(e) => noteActions.patch(selected.id, { title: e.target.value })}
            placeholder="Başlıksız"
            className="-ml-1 mt-3 w-full bg-transparent headline-small font-bold tracking-tight text-on-surface placeholder:text-outline/50"
            aria-label="Not başlığı"
          />
          <textarea
            ref={bodyRef}
            value={selected.body}
            onChange={(e) => noteActions.patch(selected.id, { body: e.target.value })}
            placeholder="Bir şeyler yaz…"
            rows={6}
            className="-ml-1 mt-3 w-full resize-none overflow-hidden bg-transparent body-large leading-relaxed text-on-surface placeholder:text-outline/50"
            aria-label="Not içeriği"
          />

          <p className="body-small mt-auto pt-4 text-on-surface-variant">
            {selected.body.trim() ? selected.body.trim().split(/\s+/).length : 0} kelime · son düzenleme{' '}
            {formatDistanceToNow(new Date(selected.updatedAt), { addSuffix: true, locale: tr })}
          </p>
        </section>
      )}

      {/* Yeni not FAB'ı */}
      <button onClick={create} className="m3-fab" aria-label="Yeni not">
        <Icon name="plus" size={24} />
      </button>
    </div>
  );
}
