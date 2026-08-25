import { Icon } from '../lib/icons';
import { NAV_SECTIONS } from '../lib/nav';
import { cx } from '../lib/utils';
import { TermuxBadge } from './TermuxBadge';

interface SidebarProps {
  path: string;
  open: boolean;
  onClose: () => void;
}

function Brand() {
  return (
    <a href="#/" className="group flex items-center gap-2.5 px-4 py-4 transition-colors hover:bg-hover">
      <img
        src="/aurora.svg"
        alt=""
        className="h-8 w-8 rounded-[10px] shadow-[var(--shadow-card)] transition-transform group-hover:scale-105"
      />
      <span className="font-semibold tracking-tight">Aurora</span>
    </a>
  );
}

function NavList({ path, onNavigate }: { path: string; onNavigate?: () => void }) {
  return (
    <nav className="flex-1 overflow-y-auto px-2 pb-2 pt-1">
      {NAV_SECTIONS.map((section) => (
        <div key={section.label} className="mb-1.5">
          <p className="px-3 pb-1 pt-2 text-[10.5px] font-semibold uppercase tracking-wider text-faint">
            {section.label}
          </p>
          <ul className="space-y-0.5">
            {section.items.map((item) => {
              const active = path === item.path;
              return (
                <li key={item.path}>
                  <a
                    href={`#${item.path}`}
                    onClick={onNavigate}
                    className={cx(
                      'group relative flex items-center gap-2.5 rounded-lg px-3 py-[7px] text-sm transition-all',
                      active ? 'bg-accent-soft font-medium text-accent' : 'text-ink/80 hover:bg-hover hover:text-ink',
                    )}
                  >
                    <span
                      className={cx(
                        'absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full bg-accent transition-all',
                        active ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    <span className="w-5 text-center text-base transition-transform select-none group-hover:scale-110">
                      {item.emoji}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function Sidebar({ path, open, onClose }: SidebarProps) {
  return (
    <>
      <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-side md:flex">
        <Brand />
        <NavList path={path} />
        <div className="border-t border-line p-2.5">
          <TermuxBadge />
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-[fade-in_150ms_ease]" onClick={onClose} />
          <aside className="relative flex h-full w-72 flex-col border-r border-line bg-side shadow-[var(--shadow-pop)] animate-[slide-in_240ms_var(--ease-out)]">
            <div className="flex items-center justify-between px-2 py-2">
              <Brand />
              <button onClick={onClose} className="btn btn-ghost p-1.5 text-soft" aria-label="Kapat">
                <Icon name="x" size={16} />
              </button>
            </div>
            <NavList path={path} onNavigate={onClose} />
            <div className="border-t border-line p-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
              <TermuxBadge />
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
