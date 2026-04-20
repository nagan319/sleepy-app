'use client';

import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import type { AppState, SleepEntry, SleepProfile } from '@/types';
import { loadState, saveProfile, addEntry, markSunExposure, saveState } from '@/lib/storage';
import { pullFromSupabase, pushToSupabase } from '@/lib/sync';

interface AppContextValue {
  state: AppState;
  syncing: boolean;
  setProfile: (p: SleepProfile) => void;
  logEntry: (e: SleepEntry) => void;
  toggleSun: (date: string, slot: 'morning' | 'afternoon', done: boolean) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>({ profile: null, entries: [], sunExposureDone: {} });
  const [syncing, setSyncing] = useState(false);
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // On mount: load local state, then try to pull from Supabase (remote wins on first load)
  useEffect(() => {
    const local = loadState();
    setState(local);

    pullFromSupabase().then(remote => {
      if (!remote) return;
      // Merge: remote entries + local entries, deduplicated by date
      const mergedEntries = [...(local.entries ?? [])];
      for (const re of remote.entries ?? []) {
        if (!mergedEntries.find(le => le.date === re.date)) {
          mergedEntries.push(re);
        }
      }
      mergedEntries.sort((a, b) => a.date.localeCompare(b.date));

      const merged: AppState = {
        profile: remote.profile ?? local.profile,
        entries: mergedEntries,
        sunExposureDone: { ...local.sunExposureDone, ...(remote.sunExposureDone ?? {}) },
      };
      saveState(merged);
      setState(merged);
    });
  }, []);

  // Debounced push to Supabase after any state mutation
  function schedulePush(nextState: AppState) {
    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(async () => {
      setSyncing(true);
      await pushToSupabase(nextState);
      setSyncing(false);
    }, 1500);
  }

  const setProfile = useCallback((p: SleepProfile) => {
    const next = saveProfile(p);
    setState(next);
    schedulePush(next);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logEntry = useCallback((e: SleepEntry) => {
    const next = addEntry(e);
    setState(next);
    schedulePush(next);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleSun = useCallback((date: string, slot: 'morning' | 'afternoon', done: boolean) => {
    const next = markSunExposure(date, slot, done);
    setState(next);
    schedulePush(next);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AppContext.Provider value={{ state, syncing, setProfile, logEntry, toggleSun }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
