import { useEffect, useState } from 'react';
import { Icon } from '../lib/icons';
import { NAV_SECTIONS, type NavItem } from '../lib/nav';
import { TermuxBadge } from './TermuxBadge';
import { cx } from '../lib/utils';

function NavLink({ item, path, onClick }: { item: NavItem; path: string; onClick: () => void }) {
  const active = path === item.path;
  return (
    <a
      href={`#${item.path}`}
      onClick={onClick}
      className={cx(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
        active ? 'bg-accent-soft font-medium text-accent' : 'text-soft hover:bg-hover hover:text-ink',
      )}
    >
      <Icon name={item.icon} size={16} />
      <span className="truncate">{item.label}</span>
      {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent" />}
    </a>
  );
}

export function TopBar({ path }: { path: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <header
        className="sticky top-0 z-30 flex h-12 items-center gap-2 border-b border-line/80 bg-paper/85 px-3 backdrop-blur-md"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <button
          onClick={() => setOpen(true)}
          className="grid h-9 w-9 place-items-center rounded-lg text-soft transition-colors hover:bg-hover hover:text-ink"
          aria-label="Open menu"
        >
          <Icon name="menu" size={18} />
        </button>
        <div className="min-w-0 flex-1 truncate text-sm font-semibold">
          {NAV_SECTIONS.flatMap((s) => s.items).find((i) => i.path === path)?.label ?? 'Aurora'}
        </div>
        <TermuxBadge />
      </header>

      {open && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/45 backdrop-blur-[2px] animate-[fade-in_150ms_ease]"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-line bg-paper shadow-[var(--shadow-pop)] animate-[pop-in_240ms_var(--ease-spring)]">
            <div className="flex items-center justify-between border-b border-line p-3">
              <a
                href="#/"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 text-base font-bold tracking-tight"
              >
                Aurora
              </a>
              <button
                onClick={() => setOpen(false)}
                className="btn btn-ghost -mr-1 p-1.5 text-soft"
                aria-label="Close menu"
              >
                <Icon name="x" size={16} />
              </button>
            </div>
            <nav className="flex-1 space-y-4 overflow-y-auto p-3">
              {NAV_SECTIONS.map((section) => (
                <div key={section.label}>
                  <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-faint">
                    {section.label}
                  </p>
                  <div className="space-y-0.5">
                    {section.items.map((item) => (
                      <NavLink key={item.path} item={item} path={path} onClick={() => setOpen(false)} />
                    ))}
                  </div>
                </div>
              ))}
            </nav>
            <div className="border-t border-line p-3 text-[11px] text-faint">
              v1.0 · Local-only · Tap a section to navigate
            </div>
          </aside>
        </div>
      )}
    </>
  );
}