import { useState, type FormEvent } from 'react';
import { Dialog, Empty } from '../components/Dialog';
import { Page } from '../components/Page';
import { Icon } from '../lib/icons';
import { courses as courseActions, exams as examActions } from '../lib/actions';
import { useDB } from '../lib/store';
import { trDaysLeft, trShortDate } from '../lib/tr';
import { courseAvg, cx, daysUntil, gradeFromScore, overallStats, todayISO } from '../lib/utils';

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="m3-card m3-card-interactive m3-state">
      <p className="label-large text-on-surface-variant">{label}</p>
      <p className="headline-small mt-0.5 tabular-nums">{value}</p>
      {sub && <p className="body-small text-on-surface-variant">{sub}</p>}
    </div>
  );
}

export default function Student() {
  const db = useDB();
  const [courseForm, setCourseForm] = useState<{ name: string; teacher: string } | null>(null);
  const [examForm, setExamForm] = useState<{ title: string; date: string; time: string; courseId: string } | null>(null);
  const [assessmentDraft, setAssessmentDraft] = useState<Record<string, { label: string; score: string }>>({});

  const stats = overallStats(db.courses);
  const upcomingExams = [...db.exams]
    .filter((e) => e.date >= todayISO())
    .sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? '').localeCompare(b.time ?? ''));

  const addCourse = (e: FormEvent) => {
    e.preventDefault();
    if (!courseForm?.name.trim()) return;
    courseActions.add(courseForm.name.trim(), courseForm.teacher.trim());
    setCourseForm(null);
  };

  const addExam = (e: FormEvent) => {
    e.preventDefault();
    if (!examForm?.title.trim() || !examForm.date) return;
    examActions.add(examForm.title.trim(), examForm.date, examForm.time, examForm.courseId);
    setExamForm(null);
  };

  const submitAssessment = (e: FormEvent, courseId: string) => {
    e.preventDefault();
    const d = assessmentDraft[courseId];
    const score = Number(d?.score);
    if (!d?.label.trim() || isNaN(score) || score < 0 || score > 100) return;
    courseActions.addAssessment(courseId, d.label.trim(), score);
    setAssessmentDraft({ ...assessmentDraft, [courseId]: { label: '', score: '' } });
  };

  return (
    <Page
      title="Öğrenci"
      subtitle="Notlar, ortalamalar ve sınav takvimi."
      actions={
        <button onClick={() => setCourseForm({ name: '', teacher: '' })} className="m3-btn m3-btn-filled">
          <Icon name="plus" size={16} /> Ders
        </button>
      }
    >
      <div className="mb-6 grid grid-cols-2 gap-2.5 md:grid-cols-4 md:gap-3">
        <Stat label="Ortalama (100)" value={stats.avg100 !== null ? String(Math.round(stats.avg100 * 10) / 10) : '—'} />
        <Stat label="Not (5 üzerinden)" value={stats.grade5 !== null ? String(stats.grade5) : '—'} />
        <Stat label="Ders" value={String(stats.courseCount)} />
        <Stat label="Yaklaşan sınav" value={String(upcomingExams.length)} />
      </div>

      <h2 className="title-medium mb-2 flex items-center gap-1.5 text-on-surface-variant">
        <Icon name="school" size={16} /> Dersler
      </h2>
      {db.courses.length === 0 ? (
        <Empty emoji="📚" text="Henüz ders eklenmedi." />
      ) : (
        <div className="mb-6 space-y-3">
          {db.courses.map((c) => {
            const avg = courseAvg(c);
            const g = avg !== null ? gradeFromScore(avg) : null;
            const draft = assessmentDraft[c.id] ?? { label: '', score: '' };
            return (
              <div key={c.id} className="m3-card p-3 md:p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="m3-list-lines">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="m3-list-headline title-small">{c.name}</h3>
                      {g && (
                        <span className={cx('m3-chip h-6 px-2 text-[11px] font-bold', g.cls)}>
                          {g.grade}
                        </span>
                      )}
                      {avg !== null && (
                        <span className="body-small tabular-nums text-on-surface-variant">
                          {Math.round(avg * 10) / 10} puan
                        </span>
                      )}
                    </div>
                    <p className="body-small mt-0.5 text-on-surface-variant">
                      {c.teacher ? `${c.teacher} · ${c.assessments.length} not girişi` : `${c.assessments.length} not girişi`}
                    </p>
                  </div>
                  <button
                    onClick={() => courseActions.remove(c.id)}
                    className="m3-icon-btn h-8 w-8 text-on-surface-variant hover:text-error"
                    aria-label="Dersi sil"
                  >
                    <Icon name="trash" size={16} />
                  </button>
                </div>

                {c.assessments.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {c.assessments.map((a) => (
                      <span key={a.id} className="m3-chip m3-chip-input h-7 gap-1 pr-1">
                        {a.label}: <b>{a.score}</b>
                        <button
                          onClick={() => courseActions.removeAssessment(c.id, a.id)}
                          className="m3-icon-btn h-5 w-5 text-on-surface-variant hover:text-error"
                          aria-label={`${a.label} notunu sil`}
                        >
                          <Icon name="close" size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <form onSubmit={(e) => submitAssessment(e, c.id)} className="mt-3 flex gap-2">
                  <input
                    value={draft.label}
                    onChange={(e) => setAssessmentDraft({ ...assessmentDraft, [c.id]: { ...draft, label: e.target.value } })}
                    placeholder="Sınav / Performans…"
                    className="field flex-1"
                    aria-label="Not adı"
                  />
                  <input
                    value={draft.score}
                    onChange={(e) => setAssessmentDraft({ ...assessmentDraft, [c.id]: { ...draft, score: e.target.value } })}
                    placeholder="Puan"
                    inputMode="numeric"
                    className="field w-20 shrink-0"
                    aria-label="Not puanı"
                  />
                  <button type="submit" className="m3-btn m3-btn-tonal px-3" aria-label="Not ekle">
                    <Icon name="plus" size={16} />
                  </button>
                </form>
              </div>
            );
          })}
        </div>
      )}

      <div className="mb-2 flex items-center justify-between">
        <h2 className="title-medium flex items-center gap-1.5 text-on-surface-variant">
          <Icon name="event" size={16} /> Sınavlar
        </h2>
        <button
          onClick={() => setExamForm({ title: '', date: '', time: '', courseId: '' })}
          className="m3-btn m3-btn-text"
        >
          <Icon name="plus" size={16} /> Sınav ekle
        </button>
      </div>
      {upcomingExams.length === 0 ? (
        <Empty emoji="🗓️" text="Planlanmış sınav yok." />
      ) : (
        <ul className="m3-card m3-card-outlined overflow-hidden p-0">
          {upcomingExams.map((ex, i) => {
            const diff = daysUntil(ex.date);
            const courseName = db.courses.find((c) => c.id === ex.courseId)?.name;
            return (
              <li key={ex.id}>
                {i > 0 && <hr className="m3-divider m3-divider-inset" />}
                <div className="m3-list-item-static m3-state rounded-none">
                  <span className="m3-list-avatar bg-secondary-container text-on-secondary-container">
                    <Icon name="event" size={18} />
                  </span>
                  <span className="m3-list-lines">
                    <span className="m3-list-headline body-medium font-medium">{ex.title}</span>
                    <span className="m3-list-supporting">
                      {trShortDate(ex.date)}
                      {ex.time ? ` · ${ex.time}` : ''}
                      {courseName ? ` · ${courseName}` : ''}
                    </span>
                  </span>
                  <span
                    className={cx(
                      'm3-chip h-7 shrink-0',
                      diff === 0
                        ? 'bg-error-container text-on-error-container'
                        : diff <= 3
                          ? 'bg-tertiary-container text-on-tertiary-container'
                          : 'bg-secondary-container text-on-secondary-container',
                    )}
                  >
                    {trDaysLeft(diff)}
                  </span>
                  <button
                    onClick={() => examActions.remove(ex.id)}
                    className="m3-icon-btn h-8 w-8 text-on-surface-variant hover:text-error"
                    aria-label="Sınavı sil"
                  >
                    <Icon name="trash" size={16} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={courseForm !== null} onClose={() => setCourseForm(null)} title="Yeni Ders">
        <form onSubmit={addCourse} className="space-y-3">
          <input
            autoFocus
            value={courseForm?.name ?? ''}
            onChange={(e) => courseForm && setCourseForm({ ...courseForm, name: e.target.value })}
            placeholder="Ders adı"
            className="field"
            aria-label="Ders adı"
          />
          <input
            value={courseForm?.teacher ?? ''}
            onChange={(e) => courseForm && setCourseForm({ ...courseForm, teacher: e.target.value })}
            placeholder="Öğretmen (isteğe bağlı)"
            className="field"
            aria-label="Öğretmen"
          />
          <div className="flex justify-end">
            <button type="submit" disabled={!courseForm?.name.trim()} className="m3-btn m3-btn-filled">
              Ekle
            </button>
          </div>
        </form>
      </Dialog>

      <Dialog open={examForm !== null} onClose={() => setExamForm(null)} title="Yeni Sınav">
        <form onSubmit={addExam} className="space-y-3">
          <input
            autoFocus
            value={examForm?.title ?? ''}
            onChange={(e) => examForm && setExamForm({ ...examForm, title: e.target.value })}
            placeholder="Sınav adı"
            className="field"
            aria-label="Sınav adı"
          />
          <select
            value={examForm?.courseId ?? ''}
            onChange={(e) => examForm && setExamForm({ ...examForm, courseId: e.target.value })}
            className="field"
            aria-label="Ders seç"
          >
            <option value="">Ders seç (isteğe bağlı)</option>
            {db.courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="date"
              min={todayISO()}
              value={examForm?.date ?? ''}
              onChange={(e) => examForm && setExamForm({ ...examForm, date: e.target.value })}
              className="field"
              aria-label="Tarih"
            />
            <input
              type="time"
              value={examForm?.time ?? ''}
              onChange={(e) => examForm && setExamForm({ ...examForm, time: e.target.value })}
              className="field"
              aria-label="Saat"
            />
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={!examForm?.title.trim() || !examForm?.date} className="m3-btn m3-btn-filled">
              Ekle
            </button>
          </div>
        </form>
      </Dialog>
    </Page>
  );
}
