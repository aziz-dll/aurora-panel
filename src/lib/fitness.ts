import { format } from 'date-fns';
import type { WorkoutLog } from './types';

export interface Exercise {
  id: string;
  name: string;
  target: string;
}

export type Kind = 'guc' | 'kardiyo' | 'dinlenme';

export interface DayPlan {
  days: number[]; // 0 = Pzt ... 6 = Paz — bu planın geçerli olduğu günler
  focus: string;
  kind: Kind;
  mins: string;
  tip: string;
  exs: Exercise[];
}

// Hafta içi okul tam gün — spor yalnızca haftasonunda.
// 0 = Pazartesi ... 6 = Pazar (days ile PROGRAM indisini eşle).
export const PROGRAM: DayPlan[] = [
  {
    days: [0, 1, 2, 3, 4],
    focus: 'Hafta içi tam gün okul',
    kind: 'dinlenme',
    mins: '~5 dk',
    tip: 'Okul günlerinde hafif kal — asıl iş haftasonunda',
    exs: [
      { id: 'w1', name: 'Boyun, omuz ve bel esneme', target: '3 dk' },
      { id: 'w2', name: 'Okul yolu tempolu yürüyüş', target: 'yürüyerek gidip gel' },
    ],
  },
  {
    days: [5],
    focus: 'Tüm Vücut Güç',
    kind: 'guc',
    mins: '~35 dk',
    tip: 'Setler arası 60–90 sn dinlen, su yanında olsun',
    exs: [
      { id: 's1', name: 'Yerinde tempolu yürüyüş (ısınma)', target: '2 × 60 sn' },
      { id: 's2', name: 'Sandalyeye otur-kalk', target: '3 × 12' },
      { id: 's3', name: 'Eğik pompa (masa/duvar)', target: '3 × 10' },
      { id: 's4', name: 'Glute köprüsü', target: '3 × 15' },
      { id: 's5', name: 'Diz üstü plank', target: '3 × 25 sn' },
      { id: 's6', name: 'Süperman', target: '3 × 12' },
      { id: 's7', name: 'Tam boy esneme', target: '5 dk' },
    ],
  },
  {
    days: [6],
    focus: 'Uzun Yürüyüş & Toparlanma',
    kind: 'kardiyo',
    mins: '~55 dk',
    tip: 'Telefonla konuşacak tempoda yürü; dönüşte esne',
    exs: [
      { id: 'p1', name: 'Uzun tempolu yürüyüş', target: '45 dk' },
      { id: 'p2', name: 'Bacak ve kalça esneme', target: '10 dk' },
    ],
  },
];

export const DAY_SHORT = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

export const isoOf = (d: Date): string => format(d, 'yyyy-MM-dd');

export const wdOf = (d: Date): number => (d.getDay() + 6) % 7;

export function planOf(wd: number): DayPlan {
  return PROGRAM.find((p) => p.days.includes(wd)) ?? PROGRAM[0];
}

export function dayDone(log: WorkoutLog, d: Date): boolean {
  const plan = planOf(wdOf(d));
  // Hafta içi (hafif gün) planındaki hareketler zorunlu değil — gün "tamam" sayılmaz
  if (plan.days.length > 2) return (log[isoOf(d)] ?? []).length > 0;
  return plan.exs.every((e) => (log[isoOf(d)] ?? []).includes(e.id));
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
