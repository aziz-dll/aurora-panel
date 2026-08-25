import { updateDB } from './store';
import { uid, todayISO } from './utils';
import type { Lesson, Note, Priority } from './types';

export const todos = {
  add(title: string, priority: Priority = 'med', due?: string, course?: string) {
    const id = uid();
    updateDB((d) => {
      d.todos.unshift({
        id,
        title,
        done: false,
        priority,
        due: due || undefined,
        course: course || undefined,
        createdAt: new Date().toISOString(),
      });
    });
    return id;
  },
  toggle(id: string) {
    updateDB((d) => {
      const t = d.todos.find((x) => x.id === id);
      if (t) t.done = !t.done;
    });
  },
  setTitle(id: string, title: string) {
    updateDB((d) => {
      const t = d.todos.find((x) => x.id === id);
      if (t) t.title = title;
    });
  },
  remove(id: string) {
    updateDB((d) => {
      d.todos = d.todos.filter((x) => x.id !== id);
    });
  },
};

export const lessons = {
  add(l: Omit<Lesson, 'id'>) {
    updateDB((d) => {
      d.lessons.push({ ...l, id: uid() });
    });
  },
  update(id: string, patch: Partial<Omit<Lesson, 'id'>>) {
    updateDB((d) => {
      const i = d.lessons.findIndex((x) => x.id === id);
      if (i !== -1) d.lessons[i] = { ...d.lessons[i], ...patch };
    });
  },
  remove(id: string) {
    updateDB((d) => {
      d.lessons = d.lessons.filter((x) => x.id !== id);
    });
  },
};

export function lessonsOfDay(list: Lesson[], day: number): Lesson[] {
  return list.filter((l) => l.day === day).sort((a, b) => a.start.localeCompare(b.start));
}

export const courses = {
  add(name: string, teacher = '', credits = 1) {
    const id = uid();
    updateDB((d) => {
      d.courses.push({ id, name, teacher: teacher || undefined, credits, assessments: [] });
    });
    return id;
  },
  update(id: string, patch: Partial<{ name: string; teacher: string; credits: number }>) {
    updateDB((d) => {
      const c = d.courses.find((x) => x.id === id);
      if (!c) return;
      if (patch.name !== undefined) c.name = patch.name;
      if (patch.teacher !== undefined) c.teacher = patch.teacher || undefined;
      if (patch.credits !== undefined && patch.credits > 0) c.credits = patch.credits;
    });
  },
  remove(id: string) {
    updateDB((d) => {
      d.courses = d.courses.filter((x) => x.id !== id);
    });
  },
  addAssessment(courseId: string, label: string, score: number) {
    updateDB((d) => {
      d.courses.find((c) => c.id === courseId)?.assessments.push({ id: uid(), label, score });
    });
  },
  removeAssessment(courseId: string, assessmentId: string) {
    updateDB((d) => {
      const c = d.courses.find((x) => x.id === courseId);
      if (c) c.assessments = c.assessments.filter((a) => a.id !== assessmentId);
    });
  },
};

export const exams = {
  add(title: string, date: string, time?: string, courseId?: string) {
    const id = uid();
    updateDB((d) => {
      d.exams.push({ id, title, date, time: time || undefined, courseId: courseId || undefined });
    });
    return id;
  },
  remove(id: string) {
    updateDB((d) => {
      d.exams = d.exams.filter((x) => x.id !== id);
    });
  },
};

export const notes = {
  add(): string {
    const id = uid();
    updateDB((d) => {
      d.notes.unshift({
        id,
        title: '',
        body: '',
        pinned: false,
        updatedAt: new Date().toISOString(),
      });
    });
    return id;
  },
  patch(id: string, patch: Partial<Omit<Note, 'id'>>) {
    updateDB((d) => {
      const n = d.notes.find((x) => x.id === id);
      if (!n) return;
      Object.assign(n, patch);
      n.updatedAt = new Date().toISOString();
    });
  },
  remove(id: string) {
    updateDB((d) => {
      d.notes = d.notes.filter((x) => x.id !== id);
    });
  },
};

export const workouts = {
  toggle(dateISO: string, exId: string) {
    updateDB((d) => {
      const cur = d.workouts[dateISO] ?? [];
      const next = cur.includes(exId) ? cur.filter((x) => x !== exId) : [...cur, exId];
      if (next.length === 0) delete d.workouts[dateISO];
      else d.workouts[dateISO] = next;
    });
  },
};

export { todayISO };
