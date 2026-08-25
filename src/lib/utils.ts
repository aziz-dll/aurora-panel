import { format, differenceInCalendarDays, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import type { Course } from './types';

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export function todayISO(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function longDate(d: Date | string): string {
  return format(typeof d === 'string' ? parseISO(d) : d, 'd MMMM yyyy, EEEE', { locale: tr });
}

export function shortDate(iso: string): string {
  return format(parseISO(iso), 'd MMM', { locale: tr });
}

export function daysUntil(iso: string): number {
  return differenceInCalendarDays(parseISO(iso), new Date());
}

export function hhmmToMin(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function nowMin(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

export const DAY_NAMES = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

export const LESSON_COLORS = [
  '#e07a5f',
  '#3d9970',
  '#2383e2',
  '#9065b0',
  '#d9730d',
  '#c14c8a',
  '#0f7b6c',
  '#b7791f',
];

interface Grade {
  grade: number;
  cls: string;
}

// Lise 5'lik not sistemi (e-Okul aralıkları)
export function gradeFromScore(score: number): Grade {
  if (score >= 70) return { grade: 5, cls: 'bg-[#dbeddb] text-[#1c3829] dark:bg-[#1f3b2b] dark:text-[#9fe0b0]' };
  if (score >= 55) return { grade: 4, cls: 'bg-[#ddebf1] text-[#183347] dark:bg-[#1e3346] dark:text-[#8fc4ea]' };
  if (score >= 45) return { grade: 3, cls: 'bg-[#fdecc8] text-[#402c1b] dark:bg-[#3d2f1a] dark:text-[#ecc06a]' };
  if (score >= 25) return { grade: 2, cls: 'bg-[#fae4e4] text-[#621f1f] dark:bg-[#40222a] dark:text-[#ef8b8b]' };
  return { grade: 1, cls: 'bg-[#f4b8b8] text-[#3d0c0c] dark:bg-[#4a1f1f] dark:text-[#f19999]' };
}

export function courseAvg(c: Course): number | null {
  if (c.assessments.length === 0) return null;
  const sum = c.assessments.reduce((acc, a) => acc + a.score, 0);
  return sum / c.assessments.length;
}

export function overallStats(courses: Course[]): { avg100: number | null; grade5: number | null; courseCount: number } {
  const graded = courses.map((c) => ({ c, avg: courseAvg(c) })).filter((x) => x.avg !== null);
  if (graded.length === 0) return { avg100: null, grade5: null, courseCount: courses.length };
  const avg100 = graded.reduce((acc, x) => acc + x.avg!, 0) / graded.length;
  return { avg100, grade5: gradeFromScore(avg100).grade, courseCount: courses.length };
}
