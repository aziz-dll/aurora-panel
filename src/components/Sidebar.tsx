import { NAV_SECTIONS } from '../lib/nav';
import { cx } from '../lib/utils';
import { TermuxBadge } from './TermuxBadge';

interface SidebarProps {
  path: string;
}

export function Sidebar({ path }: SidebarProps) {
  return (
    <aside className="glass hidden w-60 shrink-0 flex-col border-r border-line/80 md:flex">
      <a href="#/" className="group flex items-center gap-2.5 px-4 py-4">
        <img
          src="/aurora.svg"
          alt=""
          className="h-8 w-8 rounded-[10px] shadow-[var(--shadow-card)] transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110"
        />
        <span className="aurora-text font-display text-lg font-bold tracking-tight">Aurora</span>
      </a>
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
                      className={cx(
                        'group flex items-center gap-2.5 rounded-lg px-3 py-[7px] text-sm transition-colors',
                        active ? 'bg-accent-soft font-medium text-accent' : 'text-ink/75 hover:bg-hover hover:text-ink',
                      )}
                    >
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
      <div className="border-t border-line/80 p-2.5">
        <TermuxBadge />
      </div>
    </aside>
  );
}
