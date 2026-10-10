import { useState, type FormEvent } from 'react';
import { Dialog } from '../components/Dialog';
import { Icon } from '../lib/icons';
import { lessons as lessonActions, lessonsOfDay } from '../lib/actions';
import { useDB } from '../lib/store';
import { TR_DAYS } from '../lib/tr';
import { LESSON_COLORS, cx, hhmmToMin, nowMin } from '../lib/utils';
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
    if (form.start >= form.end) {
      alert('Bitiş saati başlangıçtan sonra olmalı.');
      return;
    }
    // Aynı gün aynı saat aralığında başka ders var mı?
    const conflict = db.lessons.find(
      (l) => l.day === form.day && l.id !== (form.id ?? '') && l.start < form.end && l.end > form.start,
    );
    if (conflict && !confirm(`Bu saatte zaten «${conflict.name}» var. Yine de ekle?`)) {
      return;
    }
    const payload = { day: form.day, start: form.start, end: form.end, name: form.name.trim(), room: form.room.trim() || undefined, color: form.color };
    if (form.id) lessonActions.update(form.id, payload);
    else lessonActions.add(payload);
    setForm(null);
  };

  return (
    <div className="mx-auto w-full max-w-[1100px] pb-32 pt-6 md:pb-10 md:pt-8">
      <div className="mb-5 px-4 md:px-10">
        <h1 className="headline-medium tracking-tight">Ders Programı</h1>
        <p className="body-large mt-1 text-on-surface-variant">
          Haftalık {weeklyHours > 0 ? `${Math.round(weeklyHours * 10) / 10} saat ders` : 'henüz ders eklenmedi'}
        </p>
      </div>

      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4 md:px-10">
        {TR_DAYS.map((day, i) => {
          const dayLessons = lessonsOfDay(db.lessons, i);
          const isToday = i === t;
          return (
            <section
              key={day}
              className={cx(
                'm3-card flex min-w-[230px] max-w-[280px] flex-1 snap-start flex-col',
                isToday && 'm3-card-filled ring-2 ring-primary',
              )}
            >
              <header className="flex items-center justify-between px-3 pt-3 pb-1.5">
                <span className={cx('title-medium', isToday && 'text-primary')}>{day}</span>
                <button
                  onClick={() => openNew(i)}
                  className="m3-icon-btn h-8 w-8"
                  aria-label={`${day} gününe ders ekle`}
                >
                  <Icon name="plus" size={18} />
                </button>
              </header>

              <div className="flex-1 space-y-1.5 p-2 pt-1">
                {dayLessons.length === 0 && (
                  <p className="body-small px-1 py-3 text-center text-on-surface-variant">Boş</p>
                )}
                {dayLessons.map((l) => {
                  const isNow = isToday && hhmmToMin(l.start) <= now && now < hhmmToMin(l.end);
                  return (
                    <button
                      key={l.id}
                      onClick={() => openEdit(l)}
                      className={cx(
                        'm3-card-interactive m3-state block w-full rounded-[var(--md-shape-md)] bg-surface-container-lowest px-2.5 py-2 text-left shadow-[var(--elevation-1)]',
                        isNow && 'ring-2 ring-primary',
                      )}
                      style={{ borderLeft: `3px solid ${l.color}` }}
                    >
                      <span className="flex items-center gap-1 body-small tabular-nums text-on-surface-variant">
                        {isNow && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-tertiary" />}
                        {l.start}–{l.end}
                      </span>
                      <span className="mt-0.5 block truncate body-medium font-medium">{l.name}</span>
                      {l.room && <span className="block truncate body-small text-on-surface-variant">{l.room}</span>}
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {/* Ders ekleme FAB'ı */}
      <button onClick={() => openNew(t)} className="m3-fab" aria-label="Ders ekle">
        <Icon name="plus" size={24} />
      </button>

      <Dialog open={form !== null} onClose={() => setForm(null)} title={form?.id ? 'Dersi Düzenle' : 'Yeni Ders'}>
        {form && (
          <form onSubmit={save} className="space-y-3">
            <input
              autoFocus
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ders adı"
              className="field"
              aria-label="Ders adı"
            />
            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1">
                <span className="label-large text-on-surface-variant">Gün</span>
                <select value={form.day} onChange={(e) => setForm({ ...form, day: Number(e.target.value) })} className="field">
                  {TR_DAYS.map((d, i) => (
                    <option key={d} value={i}>
                      {d}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1">
                <span className="label-large text-on-surface-variant">Sınıf / derslik</span>
                <input value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} placeholder="örn. 301" className="field" />
              </label>
              <label className="space-y-1">
                <span className="label-large text-on-surface-variant">Başlangıç</span>
                <input type="time" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} className="field" />
              </label>
              <label className="space-y-1">
                <span className="label-large text-on-surface-variant">Bitiş</span>
                <input type="time" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} className="field" />
              </label>
            </div>
            <div>
              <span className="label-large mb-1 block text-on-surface-variant">Renk</span>
              <div className="flex gap-1.5">
                {LESSON_COLORS.map((c) => (
                  <button
                    type="button"
                    key={c}
                    onClick={() => setForm({ ...form, color: c })}
                    aria-label={`${c} rengi`}
                    className={cx('h-7 w-7 rounded-full transition-transform', form.color === c ? 'scale-110 ring-2 ring-primary ring-offset-2 ring-offset-surface-container-high' : 'opacity-60 hover:opacity-100')}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between pt-1">
              {form.id ? (
                <button
                  type="button"
                  onClick={() => {
                    lessonActions.remove(form.id!);
                    setForm(null);
                  }}
                  className="m3-btn m3-btn-danger"
                >
                  <Icon name="trash" size={16} /> Sil
                </button>
              ) : (
                <span />
              )}
              <div className="flex gap-1">
                <button type="button" onClick={() => setForm(null)} className="m3-btn m3-btn-text">
                  Vazgeç
                </button>
                <button type="submit" disabled={!form.name.trim()} className="m3-btn m3-btn-filled">
                  Kaydet
                </button>
              </div>
            </div>
          </form>
        )}
      </Dialog>
    </div>
  );
}
