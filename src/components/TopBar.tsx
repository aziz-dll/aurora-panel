import { useEffect, useState } from 'react';
import { Icon } from '../lib/icons';
import { NAV_SECTIONS, type NavItem } from '../lib/nav';
import { TermuxBadge } from './TermuxBadge';
import { AuroraLogo } from './AuroraLogo';
import { cx } from '../lib/utils';

function DrawerLink({ item, path, onClick }: { item: NavItem; path: string; onClick: () => void }) {
  const active = path === item.path;
  return (
    <a
      href={`#${item.path}`}
      onClick={onClick}
      className="m3-list-item"
      aria-current={active ? 'page' : undefined}
    >
      <span
        className={cx(
          'flex min-w-0 flex-1 items-center rounded-full py-2 pr-3 pl-3',
          active
            ? 'bg-secondary-container text-on-secondary-container'
            : 'text-on-surface-variant'
        )}
      >
        <Icon name={item.icon} size={active ? 24 : 22} className="mr-3 shrink-0" />
        <span className="truncate body-large">{item.label}</span>
      </span>
    </a>
  );
}

export function TopBar({ path }: { path: string }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    const onScroll = (e: Event) => {
      const t = e.target;
      if (t instanceof Element && !t.closest('[role="dialog"]')) {
        setScrolled(t.scrollTop > 0);
      }
    };
    window.addEventListener('scroll', onScroll, { capture: true, passive: true });
    return () => window.removeEventListener('scroll', onScroll, { capture: true });
  }, []);

  const currentTitle = NAV_SECTIONS.flatMap((s) => s.items).find((i) => i.path === path)?.label ?? 'Aurora';

  return (
    <>
      <header
        className={cx('m3-top-app-bar', scrolled && 'm3-top-app-bar-scrolled')}
        role="banner"
      >
        <button
          onClick={() => setOpen(true)}
          className="m3-icon-btn"
          aria-label="Menüyü aç"
          aria-expanded={open}
        >
          <Icon name="menu" size={24} />
        </button>
        <AuroraLogo size={26} className="ml-1 shrink-0" />
        <div className="title-large min-w-0 flex-1 truncate">
          {currentTitle}
        </div>
        <TermuxBadge />
      </header>

      {open && (
        <div className="fixed top-0 right-0 bottom-0 left-0 z-50" role="dialog" aria-modal="true" aria-label="Navigasyon menüsü">
          <div className="m3-scrim" onClick={() => setOpen(false)} />
          <aside className="surface-container-low fixed top-0 bottom-0 left-0 z-[51] flex w-80 max-w-[85vw] flex-col rounded-r-lg shadow-[var(--elevation-3)] animate-[pop-in_240ms_var(--ease-spring)]">
            <div className="flex items-center justify-between p-4">
              <a
                href="#/"
                onClick={() => setOpen(false)}
                className="flex items-center text-on-surface"
              >
                <AuroraLogo size={28} className="mr-3 shrink-0" />
                <span className="title-large font-bold tracking-tight">Aurora</span>
              </a>
              <button
                onClick={() => setOpen(false)}
                className="m3-icon-btn"
                aria-label="Menüyü kapat"
              >
                <Icon name="close" size={20} />
              </button>
            </div>
            <hr className="m3-divider" />
            <nav className="flex-1 space-y-4 overflow-y-auto p-3">
              {NAV_SECTIONS.map((section) => (
                <div key={section.label}>
                  <p className="label-medium mb-1 pr-3 pl-3 text-on-surface-variant">
                    {section.label}
                  </p>
                  <div className="space-y-0.5">
                    {section.items.map((item) => (
                      <DrawerLink key={item.path} item={item} path={path} onClick={() => setOpen(false)} />
                    ))}
                  </div>
                </div>
              ))}
            </nav>
            <div className="p-3 text-label-small text-on-surface-variant">
              v1.0 · Tamamen lokal · Bölüme dokunarak git
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
