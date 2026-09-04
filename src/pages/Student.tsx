import { useState, type FormEvent } from 'react';
import { Dialog, Empty } from '../components/Dialog';
import { Page } from '../components/Page';
import { Icon } from '../lib/icons';
import { courses as courseActions, exams as examActions } from '../lib/actions';
import { useDB } from '../lib/store';
import { courseAvg, cx, daysUntil, gradeFromScore, longDate, overallStats, todayISO } from '../lib/utils';

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card card-lift p-3 md:p-4">
      <p className="text-xs text-soft">{label}</p>
      <p className="mt-0.5 text-2xl font-bold tracking-tight tabular-nums">{value}</p>
      {sub && <p className="text-[11px] text-faint">{sub}</p>}
    </div>
  );
}

export default function Student() {
  const db = useDB();
  const [courseForm, setCourseForm] = useState<{ name: string; teacher: string } | null>(null);
  const [examForm, setExamForm] = useState<{ title: string; date: string; time: string; courseId: string } | null>(null);
  const [assessmentDraft, setAssessmentDraft] = useState<Record<string, { label: string; score: string }>>({});

  const stats = overallStats(db.courses);
  const upcomingExams = [...db.exams].sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? '').localeCompare(b.time ?? ''));

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
      icon="🎓"
      title="Student Dashboardi"
      subtitle="Your notes, grades and exam calendar."
      actions={
        <button onClick={() => setCourseForm({ name: '', teacher: '' })} className="btn btn-primary">
          <Icon name="plus" size={14} /> Course
        </button>
      }
    >
      <div className="mb-8 grid grid-cols-2 gap-2.5 md:grid-cols-4 md:gap-3">
        <Stat label="Mediumlama (100)" value={stats.avg100 !== null ? String(Math.round(stats.avg100 * 10) / 10) : '—'} />
        <Stat label="Grade (out of 5)" value={stats.grade5 !== null ? String(stats.grade5) : '—'} />
        <Stat label="Course" value={String(stats.courseCount)} />
        <Stat label="Upcoming exams" value={String(db.exams.filter((e) => e.date >= todayISO()).length)} />
      </div>

      <h2 className="mb-2 text-sm font-semibold text-soft">Courses</h2>
      {db.courses.length === 0 ? (
        <Empty emoji="📚" text="No classes added yet." />
      ) : (
        <div className="mb-8 space-y-3">
          {db.courses.map((c) => {
            const avg = courseAvg(c);
            const g = avg !== null ? gradeFromScore(avg) : null;
            const draft = assessmentDraft[c.id] ?? { label: '', score: '' };
            return (
              <div key={c.id} className="card p-3 md:p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate font-semibold">{c.name}</h3>
                      {g && <span className={cx('rounded-md px-1.5 py-0.5 text-xs font-bold', g.cls)}>{g.grade}</span>}
                      {avg !== null && <span className="text-xs text-soft tabular-nums">{Math.round(avg * 10) / 10} puan</span>}
                    </div>
                    <p className="mt-0.5 text-xs text-faint">
                      {c.teacher ? `${c.teacher} · ${c.assessments.length} grade(s)` : `${c.assessments.length} grade(s) entered`}
                    </p>
                  </div>
                  <button onClick={() => courseActions.remove(c.id)} className="btn btn-ghost p-1.5 text-faint hover:text-[#e03e3e]" aria-label="Delete course">
                    <Icon name="trash" size={14} />
                  </button>
                </div>

                {c.assessments.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {c.assessments.map((a) => (
                      <span key={a.id} className="group flex items-center gap-1 rounded-full bg-hover py-1 pr-1.5 pl-2.5 text-xs">
                        {a.label}: <b>{a.score}</b>
                        <button onClick={() => courseActions.removeAssessment(c.id, a.id)} className="text-faint hover:text-[#e03e3e]" aria-label={`Delete ${a.label}`}>
                          <Icon name="x" size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <form onSubmit={(e) => submitAssessment(e, c.id)} className="mt-3 flex gap-2">
                  <input
                    value={draft.label}
                    onChange={(e) => setAssessmentDraft({ ...assessmentDraft, [c.id]: { ...draft, label: e.target.value } })}
                    placeholder="Exam / Performans…"
                    className="field flex-1"
                  />
                  <input
                    value={draft.score}
                    onChange={(e) => setAssessmentDraft({ ...assessmentDraft, [c.id]: { ...draft, score: e.target.value } })}
                    placeholder="Puan"
                    inputMode="numeric"
                    className="field w-20 shrink-0"
                  />
                  <button type="submit" className="btn btn-ghost border border-line" aria-label="Not ekle">
                    <Icon name="plus" size={14} />
                  </button>
                </form>
              </div>
            );
          })}
        </div>
      )}

      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-soft">Examlar</h2>
        <button onClick={() => setExamForm({ title: '', date: '', time: '', courseId: '' })} className="btn btn-ghost text-xs text-accent">
          <Icon name="plus" size={13} /> Exam ekle
        </button>
      </div>
      {upcomingExams.length === 0 ? (
        <Empty emoji="🗓️" text="No exams scheduled." />
      ) : (
        <ul className="card divide-y divide-line overflow-hidden">
          {upcomingExams.map((ex) => {
            const diff = daysUntil(ex.date);
            const courseName = db.courses.find((c) => c.id === ex.courseId)?.name;
            return (
              <li key={ex.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{ex.title}</p>
                  <p className="text-xs text-faint">
                    {longDate(ex.date)}
                    {ex.time ? ` · ${ex.time}` : ''}
                    {courseName ? ` · ${courseName}` : ''}
                  </p>
                </div>
                <span
                  className={cx(
                    'shrink-0 rounded-full px-2.5 py-1 text-xs font-medium',
                    diff < 0
                      ? 'bg-hover text-faint'
                      : diff === 0
                        ? 'bg-[#f4b8b8] text-[#3d0c0c] dark:bg-[#4a1f1f] dark:text-[#f19999]'
                        : diff <= 3
                          ? 'bg-[#fdecc8] text-[#402c1b] dark:bg-[#3d2f1a] dark:text-[#ecc06a]'
                          : 'bg-hover text-soft',
                  )}
                >
                  {diff < 0 ? 'Passed' : diff === 0 ? 'Today!' : diff === 1 ? 'Tomorrow' : `${diff} days`}
                </span>
                <button onClick={() => examActions.remove(ex.id)} className="btn btn-ghost shrink-0 p-1 text-faint hover:text-[#e03e3e]" aria-label="Delete exam">
                  <Icon name="trash" size={13} />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={courseForm !== null} onClose={() => setCourseForm(null)} title="New class">
        <form onSubmit={addCourse} className="space-y-3">
          <input autoFocus value={courseForm?.name ?? ''} onChange={(e) => courseForm && setCourseForm({ ...courseForm, name: e.target.value })} placeholder="Course name" className="field" />
          <input value={courseForm?.teacher ?? ''} onChange={(e) => courseForm && setCourseForm({ ...courseForm, teacher: e.target.value })} placeholder="Teacher (optional)" className="field" />
          <div className="flex justify-end">
            <button type="submit" disabled={!courseForm?.name.trim()} className="btn btn-primary">
              Add
            </button>
          </div>
        </form>
      </Dialog>

      <Dialog open={examForm !== null} onClose={() => setExamForm(null)} title="New exam">
        <form onSubmit={addExam} className="space-y-3">
          <input autoFocus value={examForm?.title ?? ''} onChange={(e) => examForm && setExamForm({ ...examForm, title: e.target.value })} placeholder="Exam Name" className="field" />
          <select value={examForm?.courseId ?? ''} onChange={(e) => examForm && setExamForm({ ...examForm, courseId: e.target.value })} className="field">
            <option value="">Select course (opsiyonel)</option>
            {db.courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <input type="date" min={todayISO()} value={examForm?.date ?? ''} onChange={(e) => examForm && setExamForm({ ...examForm, date: e.target.value })} className="field" />
            <input type="time" value={examForm?.time ?? ''} onChange={(e) => examForm && setExamForm({ ...examForm, time: e.target.value })} className="field" />
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={!examForm?.title.trim() || !examForm?.date} className="btn btn-primary">
              Add
            </button>
          </div>
        </form>
      </Dialog>
    </Page>
  );
}
