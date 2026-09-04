import type { IconName } from './icons';

export interface NavItem {
  path: string;
  label: string;
  icon: IconName;
}

export const NAV_SECTIONS: Array<{ label: string; items: NavItem[] }> = [
  {
    label: 'General',
    items: [
      { path: '/', label: 'Dashboard', icon: 'home' },
      { path: '/todos', label: 'Tasks', icon: 'checkSquare' },
      { path: '/schedule', label: 'Schedule', icon: 'calendarDays' },
      { path: '/student', label: 'Student', icon: 'graduationCap' },
    ],
  },
  {
    label: 'Personal',
    items: [
      { path: '/fitness', label: 'Fitness', icon: 'dumbbell' },
      { path: '/habits', label: 'Habits', icon: 'repeat' },
      { path: '/notes', label: 'Notes', icon: 'stickyNote' },
    ],
  },
  {
    label: 'System',
    items: [
      { path: '/files', label: 'Files', icon: 'folder' },
      { path: '/server', label: 'Server', icon: 'server' },
      { path: '/settings', label: 'Settings', icon: 'cog' },
    ],
  },
];

export const NAV: NavItem[] = NAV_SECTIONS.flatMap((s) => s.items);

export function titleFor(path: string): string {
  return NAV.find((n) => n.path === path)?.label ?? 'Dashboard';
}