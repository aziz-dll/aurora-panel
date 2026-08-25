import { NAV } from '../lib/nav';
import { cx } from '../lib/utils';

interface DockNavProps {
  path: string;
}

export function DockNav({ path }: DockNavProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-center pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
      <div className="glass flex items-center gap-0.5 rounded-2xl border border-line/70 px-1.5 py-1.5 shadow-[var(--shadow-pop)]">
        {NAV.map((item) => {
          const active = path === item.path;
          return (
            <a
              key={item.path}
              href={`#${item.path}`}
              aria-label={item.label}
              className={cx(
                'flex h-11 w-11 items-center justify-center rounded-xl text-lg transition-all select-none active:scale-90',
                active ? 'bg-accent-soft text-accent' : 'text-ink/70 hover:bg-hover',
              )}
            >
              {item.emoji}
            </a>
          );
        })}
      </div>
    </nav>
  );
}
