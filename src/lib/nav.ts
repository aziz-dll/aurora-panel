export interface NavItem {
  path: string;
  label: string;
  emoji: string;
}

export const NAV_SECTIONS: Array<{ label: string; items: NavItem[] }> = [
  {
    label: 'Genel',
    items: [
      { path: '/', label: 'Panel', emoji: '🏠' },
      { path: '/gorevler', label: 'Görevler', emoji: '✅' },
      { path: '/program', label: 'Ders Programı', emoji: '📅' },
      { path: '/ogrenci', label: 'Öğrenci', emoji: '🎓' },
    ],
  },
  {
    label: 'Kişisel',
    items: [
      { path: '/spor', label: 'Spor', emoji: '🏋️' },
      { path: '/notlar', label: 'Notlar', emoji: '📝' },
    ],
  },
  {
    label: 'Sistem',
    items: [
      { path: '/dosyalar', label: 'Dosyalar', emoji: '📁' },
      { path: '/ayarlar', label: 'Ayarlar', emoji: '⚙️' },
    ],
  },
];

export const NAV: NavItem[] = NAV_SECTIONS.flatMap((s) => s.items);

export function titleFor(path: string): string {
  return NAV.find((n) => n.path === path)?.label ?? 'Panel';
}
