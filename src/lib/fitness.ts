import { format } from 'date-fns';
import type { WorkoutLog } from './types';

export interface Exercise {
  id: string;
  name: string;
  target: string;
}

export type Kind = 'guc' | 'kardiyo' | 'dinlenme';

export interface DayPlan {
  focus: string;
  kind: Kind;
  mins: string;
  tip: string;
  exs: Exercise[];
}

export const PROGRAM: DayPlan[] = [
  {
    focus: 'Üst Gövde & Karın',
    kind: 'guc',
    mins: '~25 dk',
    tip: 'Setler arası 60–90 sn dinlan',
    exs: [
      { id: 'p1', name: 'Duvar pompası', target: '3 × 12' },
      { id: 'p2', name: 'Masa kenarı pompası', target: '3 × 8' },
      { id: 'p3', name: 'Diz üstü plank', target: '3 × 20 sn' },
      { id: 'p4', name: 'Süperman', target: '3 × 12' },
      { id: 'p5', name: 'Ayakta diz–dirsek teması', target: '3 × 16' },
    ],
  },
  {
    focus: 'Tempolu Yürüyüş',
    kind: 'kardiyo',
    mins: '~35 dk',
    tip: 'Telefonla konuşacak tempoda yürü',
    exs: [
      { id: 'k1', name: 'Tempolu yürüyüş (dışarıda / yerinde)', target: '30 dk' },
      { id: 'k2', name: 'Tam boy esneme', target: '5 dk' },
    ],
  },
  {
    focus: 'Alt Gövde',
    kind: 'guc',
    mins: '~25 dk',
    tip: 'Dizler ayak uçlarını geçmesin',
    exs: [
      { id: 'a1', name: 'Sandalyeye otur-kalk', target: '3 × 10' },
      { id: 'a2', name: 'Glute köprüsü', target: '3 × 15' },
      { id: 'a3', name: 'Duvar oturması', target: '3 × 20 sn' },
      { id: 'a4', name: 'Baldır kaldırma', target: '3 × 20' },
      { id: 'a5', name: 'Yan bacak açma', target: '3 × 12 (her bacak)' },
    ],
  },
  {
    focus: 'Aktif Toparlanma',
    kind: 'dinlenme',
    mins: '~30 dk',
    tip: 'Yarınki güç günü için hazırlık',
    exs: [
      { id: 'r1', name: 'Rahat yürüyüş', target: '20 dk' },
      { id: 'r2', name: 'Esneme rutini', target: '10 dk' },
    ],
  },
  {
    focus: 'Tüm Vücut',
    kind: 'guc',
    mins: '~30 dk',
    tip: 'Hareketler arasında 45–60 sn dinlan',
    exs: [
      { id: 'f1', name: 'Yerinde tempolu yürüyüş (diz yüksek)', target: '3 × 60 sn' },
      { id: 'f2', name: 'Sandalyeye otur-kalk', target: '3 × 12' },
      { id: 'f3', name: 'Eğik pompa', target: '3 × 10' },
      { id: 'f4', name: 'Glute köprüsü', target: '3 × 15' },
      { id: 'f5', name: 'Plank', target: '2 × 25 sn' },
    ],
  },
  {
    focus: 'Uzun Yürüyüş',
    kind: 'kardiyo',
    mins: '~50 dk',
    tip: 'Tek seferde zorlanırsan 2 × 20 + 5 dk diye böl',
    exs: [
      { id: 'u1', name: 'Uzun yürüyüş', target: '45 dk' },
      { id: 'u2', name: 'Bacak esneme', target: '5 dk' },
    ],
  },
  {
    focus: 'Tam Dinlenme',
    kind: 'dinlenme',
    mins: '~10 dk',
    tip: 'Kaslar dinlenirken gelişir — vücudunu dinle',
    exs: [{ id: 'd1', name: 'Hafif esneme (istersen 10 dk yürüyüş)', target: '10 dk' }],
  },
];

export const DAY_SHORT = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

export const isoOf = (d: Date): string => format(d, 'yyyy-MM-dd');

export const wdOf = (d: Date): number => (d.getDay() + 6) % 7;

export function dayDone(log: WorkoutLog, d: Date): boolean {
  const ids = PROGRAM[wdOf(d)].exs.map((e) => e.id);
  const got = log[isoOf(d)] ?? [];
  return ids.every((id) => got.includes(id));
}

export function computeStreak(log: WorkoutLog): number {
  let n = 0;
  const d = new Date();
  if (!dayDone(log, d)) d.setDate(d.getDate() - 1);
  while (n < 400 && dayDone(log, d)) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}
