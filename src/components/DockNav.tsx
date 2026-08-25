import { motion } from 'motion/react';
import { NAV } from '../lib/nav';
import { cn } from '../lib/cn';

interface DockNavProps {
  path: string;
}

export function DockNav({ path }: DockNavProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-center pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 26, delay: 0.15 }}
        className="glass flex items-center gap-0.5 rounded-2xl border border-line/70 px-1.5 py-1.5 shadow-[var(--shadow-pop)]"
      >
        {NAV.map((item) => {
          const active = path === item.path;
          return (
            <a
              key={item.path}
              href={`#${item.path}`}
              aria-label={item.label}
              className={cn(
                'relative flex h-11 w-11 items-center justify-center rounded-xl text-lg transition-transform select-none active:scale-90',
                active ? 'text-accent' : 'text-ink/70',
              )}
            >
              {active && (
                <motion.span
                  layoutId="dock-pill"
                  className="absolute inset-0 rounded-xl bg-accent-soft"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative">{item.emoji}</span>
            </a>
          );
        })}
      </motion.div>
    </nav>
  );
}
