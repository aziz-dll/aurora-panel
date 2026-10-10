import type { JSX, SVGProps } from 'react';

/* Material Symbols (outlined) geometrisine yakın, 24dp grid inline SVG seti.
   Stroke tabanlı, currentColor — repaint maliyeti düşük, font indirmesi yok. */

const paths = {
  // --- Navigasyon & temel ---
  home: (
    <>
      <path d="M4 21v-11l8-6.5 8 6.5v11h-5.5v-6.5h-5V21H4z" />
    </>
  ),
  menu: (
    <>
      <path d="M3 6h18" />
      <path d="M3 12h18" />
      <path d="M3 18h18" />
    </>
  ),
  x: (
    <>
      <path d="M18 6L6 18" />
      <path d="M6 6l12 12" />
    </>
  ),
  close: (
    <>
      <path d="M18 6L6 18" />
      <path d="M6 6l12 12" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>
  ),
  add: (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>
  ),
  remove: <path d="M5 12h14" />,
  check: <path d="M5 12.5l4.5 4.5L19 7" />,
  doneAll: (
    <>
      <path d="M1.5 13l4.5 4.5L14.5 9" />
      <path d="M9 15.5l1 1L19.5 7" />
    </>
  ),
  moreVert: (
    <>
      <circle cx="12" cy="5" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="19" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  moreHoriz: (
    <>
      <circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  arrowLeft: (
    <>
      <path d="M20 12H4" />
      <path d="M11 5l-7 7 7 7" />
    </>
  ),
  arrowBack: (
    <>
      <path d="M20 12H4" />
      <path d="M11 5l-7 7 7 7" />
    </>
  ),
  arrowForward: (
    <>
      <path d="M4 12h16" />
      <path d="M13 5l7 7-7 7" />
    </>
  ),
  chevronLeft: <path d="M14 6l-6 6 6 6" />,
  chevronDown: <path d="M6 9l6 6 6-6" />,
  chevronRight: <path d="M9 6l6 6-6 6" />,
  expandMore: <path d="M7 10l5 5 5-5" />,
  expandLess: <path d="M7 14l5-5 5 5" />,
  keyboardArrowUp: <path d="M6 15l6-6 6 6" />,
  keyboardArrowDown: <path d="M6 9l6 6 6-6" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M20.5 20.5l-4.2-4.2" />
    </>
  ),

  // --- Zaman & takvim ---
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  schedule: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  timer: (
    <>
      <circle cx="12" cy="14" r="7" />
      <path d="M12 14l3.2-3.2" />
      <path d="M10 2.5h4" />
      <path d="M12 5.5V7" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="16" rx="2" />
      <path d="M8 2.8v4" />
      <path d="M16 2.8v4" />
      <path d="M3.5 9.5h17" />
    </>
  ),
  calendarDays: (
    <>
      <rect x="3.5" y="5" width="17" height="16" rx="2" />
      <path d="M8 2.8v4" />
      <path d="M16 2.8v4" />
      <path d="M3.5 9.5h17" />
      <circle cx="8.5" cy="13.5" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="12" cy="13.5" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="13.5" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="8.5" cy="17" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="12" cy="17" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
  calendarMonth: (
    <>
      <rect x="3.5" y="5" width="17" height="16" rx="2" />
      <path d="M8 2.8v4" />
      <path d="M16 2.8v4" />
      <path d="M3.5 9.5h17" />
      <circle cx="8.5" cy="13.5" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="12" cy="13.5" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="13.5" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="8.5" cy="17" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="12" cy="17" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
  event: (
    <>
      <rect x="3.5" y="5" width="17" height="16" rx="2" />
      <path d="M8 2.8v4" />
      <path d="M16 2.8v4" />
      <path d="M3.5 9.5h17" />
      <circle cx="12" cy="15.5" r="1.2" fill="currentColor" stroke="none" />
    </>
  ),
  today: (
    <>
      <rect x="3.5" y="5" width="17" height="16" rx="2" />
      <path d="M8 2.8v4" />
      <path d="M16 2.8v4" />
      <path d="M3.5 9.5h17" />
      <rect x="7.5" y="12.5" width="5" height="4.5" rx="1" />
    </>
  ),
  history: (
    <>
      <path d="M4 12a8.5 8.5 0 1 0 2.6-6.1L4 8.4" />
      <path d="M4 3.5v5h5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),

  // --- Görevler & listeler ---
  checkSquare: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M8.5 12.5l2.5 2.5 5-5" />
    </>
  ),
  checkCircle: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.5 12.5l2.5 2.5 4.5-4.5" />
    </>
  ),
  taskAlt: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.5 12.5l2.5 2.5 6.5-6.5" />
    </>
  ),
  plusCircle: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 8v8" />
      <path d="M8 12h8" />
    </>
  ),
  addTask: (
    <>
      <path d="M16.5 11.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h7.5" />
      <path d="M8.5 13.5l2.5 2.5 4-4" />
      <path d="M19 3.5v5" />
      <path d="M16.5 6h5" />
    </>
  ),
  listChecks: (
    <>
      <path d="M3.5 5.5l1.7 1.7 2.8-2.7" />
      <path d="M3.5 11.5l1.7 1.7 2.8-2.7" />
      <path d="M11.5 6h9" />
      <path d="M11.5 12h9" />
      <path d="M3.5 18h17" />
    </>
  ),
  formatListBulleted: (
    <>
      <circle cx="5" cy="6" r="1" fill="currentColor" stroke="none" />
      <circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="5" cy="18" r="1" fill="currentColor" stroke="none" />
      <path d="M9 6h11" />
      <path d="M9 12h11" />
      <path d="M9 18h11" />
    </>
  ),
  viewList: (
    <>
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </>
  ),
  filterList: (
    <>
      <path d="M4 7h16" />
      <path d="M7 12h10" />
      <path d="M10 17h4" />
    </>
  ),
  sort: (
    <>
      <path d="M4 7h16" />
      <path d="M6 12h12" />
      <path d="M9 17h6" />
    </>
  ),
  grid_view: (
    <>
      <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" />
    </>
  ),
  dragIndicator: (
    <>
      <circle cx="9" cy="5.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="5.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="9" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="9" cy="18.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="18.5" r="1" fill="currentColor" stroke="none" />
    </>
  ),

  // --- Notlar & dosyalar ---
  stickyNote: (
    <>
      <path d="M15 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9z" />
      <path d="M15 3v6h6" />
    </>
  ),
  editNote: (
    <>
      <path d="M4 6h12" />
      <path d="M4 10.5h8" />
      <path d="M4 15h5" />
      <path d="M17.5 9.5l2.6 2.6-5.6 5.6H11.9v-2.6l5.6-5.6z" />
    </>
  ),
  description: (
    <>
      <path d="M13.5 2.5H7a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8.5l-5.5-6z" />
      <path d="M13.5 2.5V8.5H19" />
      <path d="M9 13.5h6" />
      <path d="M9 17h6" />
    </>
  ),
  insertDriveFile: (
    <>
      <path d="M13.5 2.5H7a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8.5l-5.5-6z" />
      <path d="M13.5 2.5V8.5H19" />
    </>
  ),
  folder: (
    <>
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </>
  ),
  contentCopy: (
    <>
      <rect x="8.5" y="8.5" width="11.5" height="11.5" rx="2" />
      <path d="M4.5 15.5v-9a2 2 0 0 1 2-2h9" />
    </>
  ),
  link: (
    <>
      <path d="M9.5 14.5l5-5" />
      <path d="M7.5 10.5l-2 2a3.54 3.54 0 0 0 5 5l2-2" />
      <path d="M16.5 13.5l2-2a3.54 3.54 0 0 0-5-5l-2 2" />
    </>
  ),
  download: (
    <>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M7 10l5 5 5-5" />
      <path d="M12 15V3" />
    </>
  ),
  upload: (
    <>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M17 8l-5-5-5 5" />
      <path d="M12 3v12" />
    </>
  ),

  // --- Düzenleme & aksiyon ---
  pencil: <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />,
  edit: <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />,
  trash: (
    <>
      <path d="M7 6.5h10" />
      <path d="M5 6.5h14" />
      <path d="M9.5 6.5v-2a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v2" />
      <path d="M17.5 6.5l-.8 12a2 2 0 0 1-2 1.9H9.3a2 2 0 0 1-2-1.9l-.8-12" />
      <path d="M10 11v5.5" />
      <path d="M14 11v5.5" />
    </>
  ),
  trash2: (
    <>
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </>
  ),
  archive: (
    <>
      <path d="M21 8v13H3V8" />
      <path d="M1 3h22v5H1z" />
      <path d="M10 12h4" />
    </>
  ),
  refresh: (
    <>
      <path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3" />
      <path d="M19.5 3.5v3.7h-3.7" />
    </>
  ),
  sync: (
    <>
      <path d="M20.5 8.5A9 9 0 0 0 5.5 6" />
      <path d="M3.5 4.5V9H8" />
      <path d="M3.5 15.5a9 9 0 0 0 15 2.5" />
      <path d="M20.5 19.5V15H16" />
    </>
  ),
  share: (
    <>
      <circle cx="6" cy="12" r="2.2" />
      <circle cx="18" cy="5.5" r="2.2" />
      <circle cx="18" cy="18.5" r="2.2" />
      <path d="M8 11l8-4.5" />
      <path d="M8 13l8 4.5" />
    </>
  ),
  openInNew: (
    <>
      <path d="M14 3h7v7" />
      <path d="M21 3l-9 9" />
      <path d="M18 13.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5.5" />
    </>
  ),

  // --- Durum & geri bildirim ---
  zap: <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />,
  bolt: <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />,
  alert: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 8v4.5" />
      <circle cx="12" cy="16" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  warning: (
    <>
      <path d="M12 3.5L22 20H2L12 3.5z" />
      <path d="M12 10v4" />
      <circle cx="12" cy="17" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  error: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V13" />
      <circle cx="12" cy="16.5" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5.5" />
      <circle cx="12" cy="7.5" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  star: (
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z" />
  ),
  emojiEvents: (
    <>
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4z" />
      <path d="M7 5.5H4.5V7a3 3 0 0 0 3 3" />
      <path d="M17 5.5h2.5V7a3 3 0 0 1-3 3" />
      <path d="M12 14v3.5" />
      <path d="M8.5 20.5h7" />
      <path d="M9.5 20.5c0-1.8 1-3 2.5-3s2.5 1.2 2.5 3" />
    </>
  ),

  // --- Tema & ayarlar ---
  sun: (
    <>
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="M4.93 4.93l1.41 1.41" />
      <path d="M17.66 17.66l1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="M4.93 19.07l1.41-1.41" />
      <path d="M17.66 6.34l1.41-1.41" />
    </>
  ),
  lightMode: (
    <>
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="M4.93 4.93l1.41 1.41" />
      <path d="M17.66 17.66l1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="M4.93 19.07l1.41-1.41" />
      <path d="M17.66 6.34l1.41-1.41" />
    </>
  ),
  moon: <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />,
  darkMode: <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />,
  palette: (
    <>
      <path d="M12 3a9 9 0 0 0 0 18c.9 0 1.6-.7 1.6-1.6 0-.42-.16-.8-.42-1.08a1.6 1.6 0 0 1 1.12-2.72H16a5 5 0 0 0 5-5c0-4.42-4.03-8.1-9-8.1z" />
      <circle cx="7.5" cy="11" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="10" cy="7.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="7.5" r="1.1" fill="currentColor" stroke="none" />
    </>
  ),
  tune: (
    <>
      <path d="M4 6.5h5" />
      <path d="M15 6.5h5" />
      <circle cx="12" cy="6.5" r="2" />
      <path d="M4 12h9" />
      <path d="M19 12h1" />
      <circle cx="16" cy="12" r="2" />
      <path d="M4 17.5h5" />
      <path d="M15 17.5h5" />
      <circle cx="12" cy="17.5" r="2" />
    </>
  ),
  cog: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </>
  ),
  notifications: (
    <>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </>
  ),
  notificationAdd: (
    <>
      <path d="M17.5 8A5.5 5.5 0 0 0 6.6 8c0 6.3-2.6 8-2.6 8h16s-2.6-1.7-2.5-8" />
      <path d="M13.1 20.7a1.8 1.8 0 0 1-3.1 0" />
      <path d="M19 2v5" />
      <path d="M16.5 4.5h5" />
    </>
  ),

  // --- Medya ---
  playArrow: <path d="M8 5.5v13l11-6.5L8 5.5z" />,
  pause: (
    <>
      <path d="M8.5 5.5v13" />
      <path d="M15.5 5.5v13" />
    </>
  ),

  // --- Kişiler ---
  person: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </>
  ),
  groups: (
    <>
      <circle cx="8.5" cy="9.5" r="3" />
      <circle cx="15.5" cy="9.5" r="3" />
      <path d="M2.5 19.5a6 6 0 0 1 12 0" />
      <path d="M15.5 13.7a6 6 0 0 1 6 5.8" />
    </>
  ),

  // --- Eğitim ---
  graduationCap: (
    <>
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </>
  ),
  school: (
    <>
      <path d="M12 4L2 9l10 5 10-5-10-5z" />
      <path d="M6.5 11.5V16c2.8 2.4 8.2 2.4 11 0v-4.5" />
      <path d="M22 9.5v5.5" />
    </>
  ),
  book: (
    <>
      <path d="M6 2.5h12.5v19H6a2.5 2.5 0 0 1-2.5-2.5V5A2.5 2.5 0 0 1 6 2.5z" />
      <path d="M3.5 17A2.5 2.5 0 0 1 6 14.5h12.5" />
    </>
  ),
  clipboard: (
    <>
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    </>
  ),

  // --- Sağlık & fitness ---
  dumbbell: (
    <>
      <path d="m6.5 6.5 11 11" />
      <path d="m21 21-1-1" />
      <path d="m3 3 1 1" />
      <path d="m18 22 4-4" />
      <path d="m2 6 4-4" />
      <path d="m3 10 7-7" />
      <path d="m14 21 7-7" />
    </>
  ),
  fitnessCenter: (
    <>
      <path d="m6.5 6.5 11 11" />
      <path d="m21 21-1-1" />
      <path d="m3 3 1 1" />
      <path d="m18 22 4-4" />
      <path d="m2 6 4-4" />
      <path d="m3 10 7-7" />
      <path d="m14 21 7-7" />
    </>
  ),
  flame: (
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  ),
  localFireDepartment: (
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  ),
  drop: (
    <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" />
  ),
  waterDrop: (
    <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" />
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
    </>
  ),
  heart: (
    <path d="M19.5 12.57 12 20l-7.5-7.43A5 5 0 1 1 12 6.01a5 5 0 1 1 7.5 6.56z" />
  ),
  favorite: (
    <path d="M19.5 12.57 12 20l-7.5-7.43A5 5 0 1 1 12 6.01a5 5 0 1 1 7.5 6.56z" />
  ),
  activity: <path d="M22 12h-4l-3 9L9 3l-3 9H2" />,

  // --- Sistem & sunucu ---
  gauge: (
    <>
      <path d="M12 14l4-4" />
      <path d="M3.34 19a10 10 0 1 1 17.32 0" />
    </>
  ),
  speed: (
    <>
      <path d="M12 14l4-4" />
      <path d="M3.34 19a10 10 0 1 1 17.32 0" />
    </>
  ),
  cpu: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <rect x="9" y="9" width="6" height="6" />
      <path d="M9 1v3" />
      <path d="M15 1v3" />
      <path d="M9 20v3" />
      <path d="M15 20v3" />
      <path d="M20 9h3" />
      <path d="M20 14h3" />
      <path d="M1 9h3" />
      <path d="M1 14h3" />
    </>
  ),
  memory: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <rect x="9" y="9" width="6" height="6" />
      <path d="M9 1v3" />
      <path d="M15 1v3" />
      <path d="M9 20v3" />
      <path d="M15 20v3" />
      <path d="M20 9h3" />
      <path d="M20 14h3" />
      <path d="M1 9h3" />
      <path d="M1 14h3" />
    </>
  ),
  database: (
    <>
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5v14a9 3 0 0 0 18 0V5" />
      <path d="M3 12a9 3 0 0 0 18 0" />
    </>
  ),
  storage: (
    <>
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5v14a9 3 0 0 0 18 0V5" />
      <path d="M3 12a9 3 0 0 0 18 0" />
    </>
  ),
  sdCard: (
    <>
      <path d="M7 3.5h7.1L19 8.4V19a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5.5a2 2 0 0 1 2-2z" />
      <path d="M8.5 7.5v3" />
      <path d="M11.5 7.5v3" />
      <path d="M14.5 7.5v3" />
    </>
  ),
  smartphone: (
    <>
      <rect x="7" y="2.5" width="10" height="19" rx="2" />
      <path d="M10.5 18.5h3" />
    </>
  ),
  server: (
    <>
      <rect x="2" y="3" width="20" height="8" rx="2" />
      <rect x="2" y="13" width="20" height="8" rx="2" />
      <path d="M6 7h.01" />
      <path d="M6 17h.01" />
    </>
  ),
  dns: (
    <>
      <rect x="2" y="3" width="20" height="8" rx="2" />
      <rect x="2" y="13" width="20" height="8" rx="2" />
      <path d="M6 7h.01" />
      <path d="M6 17h.01" />
    </>
  ),
  thermometer: (
    <>
      <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
    </>
  ),
  deviceThermostat: (
    <>
      <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
    </>
  ),
  wifi: (
    <>
      <path d="M5 12.55a11 11 0 0 1 14 0" />
      <path d="M1.42 9a16 16 0 0 1 21.16 0" />
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
      <path d="M12 20h.01" />
    </>
  ),
  wifiOff: (
    <>
      <path d="M5 12.55a11 11 0 0 1 14 0" />
      <path d="M1.42 9a16 16 0 0 1 21.16 0" />
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
      <path d="M12 20h.01" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </>
  ),
  battery: (
    <>
      <rect x="1" y="6" width="18" height="12" rx="2" />
      <path d="M23 13h-2" />
      <path d="M23 17h-2" />
    </>
  ),
  batteryFull: (
    <>
      <rect x="1" y="6" width="18" height="12" rx="2" />
      <path d="M23 13h-2" />
      <path d="M23 17h-2" />
      <path d="M5 10v4" />
      <path d="M8.5 10v4" />
      <path d="M12 10v4" />
    </>
  ),
  batteryChargingFull: (
    <>
      <rect x="1" y="6" width="15" height="12" rx="2" />
      <path d="M20 10.5h2v3h-2" />
      <path d="M10 8.5L7 13h3l-1 3.5 3.5-4.5h-3l1-3.5z" />
    </>
  ),
  cloudOff: (
    <>
      <path d="M17.5 19H7a4 4 0 0 1-.72-7.94A6 6 0 0 1 8.2 7.5" />
      <path d="M7.5 4.9A6 6 0 0 1 17.4 9.1 4.5 4.5 0 0 1 19.6 16" />
      <path d="M3 3l18 18" />
    </>
  ),

  // --- Marka & diğer ---
  layers: (
    <>
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </>
  ),
  trendingUp: (
    <>
      <path d="M22 7l-9 9-4-4-7 7" />
      <path d="M16 7h6v6" />
    </>
  ),
  trendingDown: (
    <>
      <path d="M22 17l-9-9-4 4-7-7" />
      <path d="M16 17h6v-6" />
    </>
  ),
  repeat: (
    <>
      <path d="M17 1l4 4-4 4" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <path d="M7 23l-4-4 4-4" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </>
  ),
  circle: <circle cx="12" cy="12" r="8.5" />,
  visibility: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  visibilityOff: (
    <>
      <path d="M10 5.8a9.8 9.8 0 0 1 2-.3c6 0 9.5 6.5 9.5 6.5a17.6 17.6 0 0 1-2.3 3.2" />
      <path d="M6.6 6.6C4 8.4 2.5 12 2.5 12S6 18.5 12 18.5a9.9 9.9 0 0 0 4-.8" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
      <path d="M3 3l18 18" />
    </>
  ),
  dragHandle: (
    <>
      <path d="M4 9h16" />
      <path d="M4 15h16" />
    </>
  ),
} satisfies Record<string, JSX.Element>;

export type IconName = keyof typeof paths;

export function Icon({
  name,
  size = 16,
  strokeWidth = 1.8,
  className,
  ...rest
}: {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
} & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...rest}
    >
      {paths[name]}
    </svg>
  );
}
