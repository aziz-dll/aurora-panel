import { useSyncExternalStore } from 'react';
import type { DB, Settings } from './types';
import { todayISO, uid } from './utils';

const KEY = 'okul-paneli.v1';

function plusDays(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function seed(): DB {
  return {
    todos: [
      { id: uid(), title: 'Matematik ödevini bitir', done: false, priority: 'high', due: todayISO(), course: 'Matematik', createdAt: new Date().toISOString() },
      { id: uid(), title: 'Fizik deney raporunu yaz', done: false, priority: 'med', due: plusDays(2), course: 'Fizik', createdAt: new Date().toISOString() },
      { id: uid(), title: 'Kitap oku (30 sayfa)', done: false, priority: 'low', createdAt: new Date().toISOString() },
    ],
    lessons: [
      { id: uid(), day: 0, start: '09:00', end: '09:40', name: 'Matematik', room: '301', color: '#2383e2' },
      { id: uid(), day: 0, start: '10:00', end: '10:40', name: 'Fizik', room: 'Lab 2', color: '#e07a5f' },
      { id: uid(), day: 1, start: '09:00', end: '09:40', name: 'Edebiyat', room: '205', color: '#9065b0' },
      { id: uid(), day: 1, start: '11:00', end: '11:40', name: 'Matematik', room: '301', color: '#2383e2' },
      { id: uid(), day: 2, start: '09:00', end: '09:40', name: 'Tarih', room: '108', color: '#d9730d' },
      { id: uid(), day: 3, start: '10:00', end: '10:40', name: 'İngilizce', room: '402', color: '#0f7b6c' },
      { id: uid(), day: 4, start: '09:00', end: '09:40', name: 'Biyoloji', room: 'Lab 1', color: '#3d9970' },
    ],
    courses: [
      { id: uid(), name: 'Matematik', teacher: '', credits: 1, assessments: [{ id: uid(), label: '1. Yazılı', score: 85 }] },
      { id: uid(), name: 'Fizik', teacher: '', credits: 1, assessments: [{ id: uid(), label: '1. Yazılı', score: 78 }] },
      { id: uid(), name: 'Edebiyat', teacher: '', credits: 1, assessments: [] },
    ],
    exams: [
      { id: uid(), title: 'Matematik 1. Yazılı', courseId: undefined, date: plusDays(7), time: '09:00' },
      { id: uid(), title: 'Fizik 1. Yazılı', courseId: undefined, date: plusDays(14), time: '10:00' },
    ],
    notes: [
      {
        id: uid(),
        title: 'Panelime hoş geldin 👋',
        body: 'Bu panel tamamen lokal çalışır; tüm veriler cihazında (localStorage) saklanır.\n\n• Görevler sekmesinden ödev/takip listeni yönet\n• Ders Programı\'na derslerini ekle\n• Öğrenci bölümünde notlarını ve sınavlarını tut\n\nAyarlar > Termux ile bildirim, titreşim ve batarya özelliklerini bağlayabilirsin.',
        pinned: true,
        updatedAt: new Date().toISOString(),
      },
    ],
    settings: { ...defaultSettings },
    workouts: {},
  };
}

function load(): DB {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DB;
      return { ...seed(), ...parsed, settings: normalizeSettings(parsed.settings) };
    }
  } catch {
    // bozuk veri → tohum veriyle devam
  }
  return seed();
}

const defaultSettings: Settings = {
  studentName: '',
  theme: 'system',
  accent: '#2383e2',
  weightKg: 102,
  heightCm: 180,
  ageYears: 17,
  filebrowserUrl: 'http://192.168.1.200:5555',
  remindersEnabled: true,
  todoReminderDays: 2,
  examReminderDays: 7,
  waterEnabled: true,
  waterFrom: '08:00',
  waterTo: '22:00',
  waterEveryHours: 2,
  workoutEnabled: true,
  workoutTime: '10:00',
};

function normalizeSettings(s: Partial<Settings> | undefined): Settings {
  return { ...defaultSettings, ...(s ?? {}) };
}

let db: DB = load();
const listeners = new Set<() => void>();

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    // kota dolu olabilir, sessiz geç
  }
}

function emit() {
  for (const fn of listeners) fn();
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function useDB(): DB {
  return useSyncExternalStore(subscribe, () => db);
}

export function updateDB(mutate: (draft: DB) => void) {
  const draft = structuredClone(db);
  mutate(draft);
  db = draft;
  persist();
  emit();
}

export function getDB(): DB {
  return db;
}

export function patchSettings(patch: Partial<Settings>) {
  updateDB((d) => {
    d.settings = { ...d.settings, ...patch };
  });
}

export function exportJSON(): string {
  return JSON.stringify(db, null, 2);
}

export function importJSON(text: string): boolean {
  try {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== 'object') return false;
    db = { ...seed(), ...parsed, settings: normalizeSettings(parsed.settings) };
    persist();
    emit();
    return true;
  } catch {
    return false;
  }
}

export function resetAll() {
  db = seed();
  persist();
  emit();
}
