import type { AppState, SleepEntry, SleepProfile } from '@/types';

const KEY = 'sleep-app-state';

const DEFAULT_STATE: AppState = {
  profile: null,
  entries: [],
  sunExposureDone: {},
};

export function loadState(): AppState {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_STATE;
    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_STATE;
  }
}

export function saveState(state: AppState): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function saveProfile(profile: SleepProfile): AppState {
  const state = loadState();
  const next = { ...state, profile };
  saveState(next);
  return next;
}

export function addEntry(entry: SleepEntry): AppState {
  const state = loadState();
  const filtered = state.entries.filter(e => e.date !== entry.date);
  const entries = [...filtered, entry].sort((a, b) => a.date.localeCompare(b.date)).slice(-60);
  const next = { ...state, entries };
  saveState(next);
  return next;
}

export function markSunExposure(date: string, slot: 'morning' | 'afternoon', done: boolean): AppState {
  const state = loadState();
  const existing = state.sunExposureDone[date] || { morning: false, afternoon: false };
  const next = {
    ...state,
    sunExposureDone: {
      ...state.sunExposureDone,
      [date]: { ...existing, [slot]: done },
    },
  };
  saveState(next);
  return next;
}

export function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export function getLastEntry(entries: SleepEntry[]): SleepEntry | null {
  if (entries.length === 0) return null;
  return entries[entries.length - 1];
}
