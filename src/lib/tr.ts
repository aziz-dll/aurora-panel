/* Türkçe tarih/saat yardımcıları — utils.ts (korumalı) yerine sayfa katmanı için.
   date-fns enUS locale'ine bağımlı kalmadan Türkçe gün/ay adları. */

export const TR_DAYS = [
  'Pazartesi',
  'Salı',
  'Çarşamba',
  'Perşembe',
  'Cuma',
  'Cumartesi',
  'Pazar',
] as const;

export const TR_DAYS_SHORT = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'] as const;

const TR_MONTHS_SHORT = [
  'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz',
  'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara',
] as const;

const TR_MONTHS_LONG = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
] as const;

/** "2026-10-10" → "10 Eki" */
export function trShortDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getDate()} ${TR_MONTHS_SHORT[d.getMonth()]}`;
}

/** "2026-10-10" → "10 Ekim 2026 Cumartesi" */
export function trLongDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  const dow = TR_DAYS[(d.getDay() + 6) % 7];
  return `${d.getDate()} ${TR_MONTHS_LONG[d.getMonth()]} ${d.getFullYear()} ${dow}`;
}

/** Date → "10 Ekim Cumartesi" (bugünün tarihi için başlık) */
export function trToday(d: Date): string {
  const dow = TR_DAYS[(d.getDay() + 6) % 7];
  return `${d.getDate()} ${TR_MONTHS_LONG[d.getMonth()]} ${dow}`;
}

/** Kalan gün → Türkçe etiket ("Bugün!", "Yarın", "3 gün", "Bitti") */
export function trDaysLeft(diff: number): string {
  if (diff < 0) return 'Bitti';
  if (diff === 0) return 'Bugün!';
  if (diff === 1) return 'Yarın';
  return `${diff} gün`;
}
