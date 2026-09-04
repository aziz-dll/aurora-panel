import { format } from 'date-fns';
import type { WorkoutLog } from './types';

export interface Exercise {
  id: string;
  name: string;
  target: string;
}

export type Kind = 'strength' | 'cardio' | 'recovery';

export interface DayPlan {
  focus: string;
  kind: Kind;
  mins: string;
  tip: string;
  exs: Exercise[];
}

export const PROGRAM: DayPlan[] = [
  {
    focus: 'Upper Body & Core',
    kind: 'strength',
    mins: '~25 min',
    tip: 'Rest 60–90 s between sets',
    exs: [
      { id: 'p1', name: 'Wall push-up', target: '3 × 12' },
      { id: 'p2', name: 'Incline push-up (table edge)', target: '3 × 8' },
      { id: 'p3', name: 'Knee plank', target: '3 × 20 s' },
      { id: 'p4', name: 'Superman', target: '3 × 12' },
      { id: 'p5', name: 'Standing knee-to-elbow', target: '3 × 16' },
    ],
  },
  {
    focus: 'Brisk Walk',
    kind: 'cardio',
    mins: '~35 min',
    tip: 'Walk at a pace where you can still chat on the phone',
    exs: [
      { id: 'k1', name: 'Brisk walk (outside or in place)', target: '30 min' },
      { id: 'k2', name: 'Full-body stretch', target: '5 min' },
    ],
  },
  {
    focus: 'Lower Body',
    kind: 'strength',
    mins: '~25 min',
    tip: 'Knees should not pass the toes',
    exs: [
      { id: 'a1', name: 'Sit-to-stand from chair', target: '3 × 10' },
      { id: 'a2', name: 'Glute bridge', target: '3 × 15' },
      { id: 'a3', name: 'Wall sit', target: '3 × 20 s' },
      { id: 'a4', name: 'Calf raise', target: '3 × 20' },
      { id: 'a5', name: 'Side leg raise', target: '3 × 12 (each leg)' },
    ],
  },
  {
    focus: 'Active Recovery',
    kind: 'recovery',
    mins: '~30 min',
    tip: 'Prepare for tomorrow\'s strength day',
    exs: [
      { id: 'r1', name: 'Easy walk', target: '20 min' },
      { id: 'r2', name: 'Stretch routine', target: '10 min' },
    ],
  },
  {
    focus: 'Full Body',
    kind: 'strength',
    mins: '~30 min',
    tip: 'Rest 45–60 s between exercises',
    exs: [
      { id: 'f1', name: 'High-knee march in place', target: '3 × 60 s' },
      { id: 'f2', name: 'Sit-to-stand from chair', target: '3 × 12' },
      { id: 'f3', name: 'Decline push-up', target: '3 × 10' },
      { id: 'f4', name: 'Glute bridge', target: '3 × 15' },
      { id: 'f5', name: 'Plank', target: '2 × 25 s' },
    ],
  },
  {
    focus: 'Long Walk',
    kind: 'cardio',
    mins: '~50 min',
    tip: 'Split as 2 × 20 + 5 min rest if 50 is too much at once',
    exs: [
      { id: 'u1', name: 'Long walk', target: '45 min' },
      { id: 'u2', name: 'Leg stretch', target: '5 min' },
    ],
  },
  {
    focus: 'Full Rest',
    kind: 'recovery',
    mins: '~10 min',
    tip: 'Muscles grow while you rest — listen to your body',
    exs: [{ id: 'd1', name: 'Light stretch (optional 10 min walk)', target: '10 min' }],
  },
];

export const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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