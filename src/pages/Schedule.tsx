import { useState, type FormEvent } from 'react';
import { Dialog } from '../components/Dialog';
import { Icon } from '../lib/icons';
import { lessons as lessonActions, lessonsOfDay } from '../lib/actions';
import { useDB } from '../lib/store';
import { DAY_NAMES, LESSON_COLORS, cx, hhmmToMin, nowMin } from '../lib/utils';
import type { Lesson } from '../lib/types';

function todayIndex(): number {
  return (new Date().getDay() + 6) % 7;
}

interface FormState {
  id: string | null;
  day: number;
  start: string;
  end: string;
  name: string;
  room: string;
  color: string;
}

export default function Schedule() {
  const db = useDB();
  const [form, setForm] = useState<FormState | null>(null);
  const t = todayIndex();
  const now = nowMin();

  const weeklyHours = db.lessons.reduce((acc, l) => acc + (hhmmToMin(l.end) - hhmmToMin(l.start)) / 60, 0);

  const openNew = (day: number) =>
    setForm({ id: null, day, start: '09:00', end: '09:40', name: '', room: '', color: LESSON_COLORS[db.lessons.length % LESSON_COLORS.length] });

  const openEdit = (l: Lesson) =>
    setForm({ id: l.id, day: l.day, start: l.start, end: l.end, name: l.name, room: l.room ?? '', color: l.color });

  const save = (e: FormEvent) => {
    e.preventDefault();
    if (!form || !form.name.trim()) return;
    const payload = { day: form.day, start: form.start, end: form.end, name: form.name.trim(), room: form.room.trim() || undefined, color: form.color };
    if (form.id) lessonActions.update(form.id, payload);
    else lessonActions.add(payload);
    setForm(null);
  };

  return (
    <div className="mx-auto w-full max-w-[1100px] pb-32 pt-20 md:pb-10 md:pt-10">
      <div className="px-5 md:px-10">
        <div className="mb-1 text-[26px] leading-none md:text-[34px] select-none">📅</div>
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-[22px] font-bold tracking-tight md:text-[32px]">Ders Programı</h1>
            <p className="mt-1 text-sm text-soft">
              Haftalık {weeklyHours > 0 ? `${Math.round(weeklyHours * 10) / 10} saat ders` : 'henüz ders eklenmemiş'}
            </p>
          </div>
          <button onClick={() => openNew(t)} className="btn btn-primary mt-1.5">
            <Icon name="plus" size={14} /> Ders
          </button>
        </div>
      </div>

      <div className="flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-5 pb-4 md:gap-3 md:px-10">
        {DAY_NAMES.map((day, i) => {
          const dayLessons = lessonsOfDay(db.lessons, i);
          const isToday = i === t;
          return (
            <section
              key={day}
              className={cx(
                'flex min-w-[230px] max-w-[280px] flex-1 snap-start flex-col rounded-2xl border',
                isToday ? 'border-accent/30 bg-accent-soft/60' : 'border-line bg-side',
              )}
            >
              <header className="flex items-center justify-between px-3 pt-3 pb-1.5">
                <span className={cx('text-sm', isToday ? 'font-bold' : 'font-semibold')}>
                  {day}
                  {isToday && (
                    <span className="ml-1.5 rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-white">Bugün</span>
                  )}
                </span>
                <button onClick={() => openNew(i)} className="btn btn-ghost p-1 text-faint hover:text-ink" aria-label={`${day} ders ekle`}>
                  <Icon name="plus" size={13} />
                </button>
              </header>

              <div className="flex-1 space-y-1.5 p-2 pt-1">
                {dayLessons.length === 0 && <p className="px-1 py-3 text-center text-xs text-faint">Boş</p>}
                {dayLessons.map((l) => {
                  const isNow = isToday && hhmmToMin(l.start) <= now && now < hhmmToMin(l.end);
                  return (
                    <button
                      key={l.id}
                      onClick={() => openEdit(l)}
                      className={cx(
                        'block w-full rounded-lg border-l-[3px] bg-paper px-2.5 py-2 text-left shadow-[var(--shadow-card)] transition-all hover:-translate-y-px active:scale-[0.98]',
                        isNow && 'ring-2 ring-accent',
                      )}
                      style={{ borderColor: l.color }}
                    >
                      <span className="flex items-center gap-1 text-[11px] text-soft">
                        {isNow && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />}
                        {l.start}–{l.end}
                      </span>
                      <span className="mt-0.5 block truncate text-sm font-medium">{l.name}</span>
                      {l.room && <span className="block truncate text-[11px] text-faint">{l.room}</span>}
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <Dialog open={form !== null} onClose={() => setForm(null)} title={form?.id ? 'Dersi düzenle' : 'Yeni ders'}>
        {form && (
          <form onSubmit={save} className="space-y-3">
            <input
              autoFocus
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ders adı"
              className="field"
            />
            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1">
                <span className="text-xs text-soft">Gün</span>
                <select value={form.day} onChange={(e) => setForm({ ...form, day: Number(e.target.value) })} className="field">
                  {DAY_NAMES.map((d, i) => (
                    <option key={d} value={i}>
                      {d}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-xs text-soft">Sınıf / yer</span>
                <input value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} placeholder="örn. 301" className="field" />
              </label>
              <label className="space-y-1">
                <span className="text-xs text-soft">Başlangıç</span>
                <input type="time" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} className="field" />
              </label>
              <label className="space-y-1">
                <span className="text-xs text-soft">Bitiş</span>
                <input type="time" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} className="field" />
              </label>
            </div>
            <div>
              <span className="mb-1 block text-xs text-soft">Renk</span>
              <div className="flex gap-1.5">
                {LESSON_COLORS.map((c) => (
                  <button
                    type="button"
                    key={c}
                    onClick={() => setForm({ ...form, color: c })}
                    aria-label={`Renk ${c}`}
                    className={cx('h-6 w-6 rounded-full transition-transform', form.color === c ? 'scale-115 ring-2 ring-offset-2 ring-offset-paper' : 'opacity-60 hover:opacity-100')}
                    style={{ background: c, ...(form.color === c ? ({ '--tw-ring-color': c } as React.CSSProperties) : {}) }}
                  />
                ))}
              </div>
            </div>
            <div className="flex justify-between pt-1">
              {form.id ? (
                <button
                  type="button"
                  onClick={() => {
                    lessonActions.remove(form.id!);
                    setForm(null);
                  }}
                  className="btn text-[#e03e3e] hover:bg-[#fae4e4] dark:hover:bg-[#40222a]"
                >
                  <Icon name="trash" size={14} /> Sil
                </button>
              ) : (
                <span />
              )}
              <button type="submit" disabled={!form.name.trim()} className="btn btn-primary">
                Kaydet
              </button>
            </div>
          </form>
        )}
      </Dialog>
    </div>
  );
}
