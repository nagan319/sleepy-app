'use client';

import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { AppState, SleepEntry, SleepProfile } from '@/types';
import { loadState, saveProfile, addEntry, markSunExposure, saveState } from '@/lib/storage';
import { pullFromSupabase, pushToSupabase } from '@/lib/sync';
import { supabase } from '@/lib/supabase';

interface AppContextValue {
  session: Session | null;
  sessionLoading: boolean;
  state: AppState;
  syncing: boolean;
  setProfile: (p: SleepProfile) => void;
  logEntry: (e: SleepEntry) => void;
  toggleSun: (date: string, slot: 'morning' | 'afternoon', done: boolean) => void;
  signOut: () => Promise<void>;
  resetLocalData: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const EMPTY_STATE: AppState = { profile: null, entries: [], sunExposureDone: {} };

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [state, setState] = useState<AppState>(EMPTY_STATE);
  const [syncing, setSyncing] = useState(false);
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load state from Supabase when user signs in
  async function hydrateFromRemote(userId: string) {
    const local = loadState();
    setState(local);

    const remote = await pullFromSupabase(userId);
    if (!remote) return;

    const mergedEntries = [...(local.entries ?? [])];
    for (const re of remote.entries ?? []) {
      if (!mergedEntries.find(le => le.date === re.date)) mergedEntries.push(re);
    }
    mergedEntries.sort((a, b) => a.date.localeCompare(b.date));

    const merged: AppState = {
      profile: remote.profile ?? local.profile,
      entries: mergedEntries,
      sunExposureDone: { ...local.sunExposureDone, ...(remote.sunExposureDone ?? {}) },
    };
    saveState(merged);
    setState(merged);
  }

  // Auth state listener
  useEffect(() => {
    if (!supabase) {
      setSessionLoading(false);
      setState(loadState());
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setSessionLoading(false);
      if (session?.user.id) hydrateFromRemote(session.user.id);
      else setState(loadState());
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user.id) hydrateFromRemote(session.user.id);
      else { setState(EMPTY_STATE); saveState(EMPTY_STATE); }
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function schedulePush(nextState: AppState, userId?: string) {
    if (!userId) return;
    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(async () => {
      setSyncing(true);
      await pushToSupabase(nextState, userId);
      setSyncing(false);
    }, 1500);
  }

  const setProfile = useCallback((p: SleepProfile) => {
    const next = saveProfile(p);
    setState(next);
    schedulePush(next, session?.user.id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const logEntry = useCallback((e: SleepEntry) => {
    const next = addEntry(e);
    setState(next);
    schedulePush(next, session?.user.id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const toggleSun = useCallback((date: string, slot: 'morning' | 'afternoon', done: boolean) => {
    const next = markSunExposure(date, slot, done);
    setState(next);
    schedulePush(next, session?.user.id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const signOut = useCallback(async () => {
    await supabase?.auth.signOut();
  }, []);

  const resetLocalData = useCallback(() => {
    saveState(EMPTY_STATE);
    setState(EMPTY_STATE);
  }, []);

  return (
    <AppContext.Provider value={{ session, sessionLoading, state, syncing, setProfile, logEntry, toggleSun, signOut, resetLocalData }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
