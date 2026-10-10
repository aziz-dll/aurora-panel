import { Icon, type IconName } from '../lib/icons';
import { cx } from '../lib/utils';

const DOCK_ITEMS: { path: string; label: string; icon: IconName }[] = [
  { path: '/', label: 'Dashboard', icon: 'home' },
  { path: '/todos', label: 'Tasks', icon: 'checkSquare' },
  { path: '/schedule', label: 'Schedule', icon: 'calendarDays' },
  { path: '/habits', label: 'Habits', icon: 'repeat' },
  { path: '/settings', label: 'Settings', icon: 'cog' },
];

export function DockNav({ path }: { path: string }) {
  return (
    <div className="md:hidden">
      <nav className="m3-nav-bar" role="navigation" aria-label="Ana navigasyon">
        {DOCK_ITEMS.map((item) => {
          const active = path === item.path;
          return (
            <a
              key={item.path}
              href={`#${item.path}`}
              className="m3-nav-item"
              aria-current={active ? 'page' : undefined}
              aria-label={item.label}
            >
              <span className={cx('m3-nav-pill', active && 'm3-nav-pill-active')}>
                <Icon name={item.icon} size={active ? 24 : 22} />
              </span>
              <span className="m3-nav-label">{item.label}</span>
            </a>
          );
        })}
      </nav>
    </div>
  );
}
