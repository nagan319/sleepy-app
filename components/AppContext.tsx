'use client';

import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import type { Session, RealtimeChannel } from '@supabase/supabase-js';
import type { AppState, SleepEntry, SleepProfile } from '@/types';
import { loadState, saveProfile, addEntry, deleteEntry, markSunExposure, saveState } from '@/lib/storage';
import { pullFromSupabase, pushToSupabase } from '@/lib/sync';
import { supabase } from '@/lib/supabase';

interface AppContextValue {
  session: Session | null;
  sessionLoading: boolean;
  passwordRecovery: boolean;
  state: AppState;
  syncing: boolean;
  setProfile: (p: SleepProfile) => void;
  logEntry: (e: SleepEntry) => void;
  toggleSun: (date: string, slot: 'morning' | 'afternoon', done: boolean) => void;
  removeEntry: (date: string) => void;
  signOut: () => Promise<void>;
  resetLocalData: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const EMPTY_STATE: AppState = { profile: null, entries: [], sunExposureDone: {} };

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [passwordRecovery, setPasswordRecovery] = useState(false);
  const [state, setState] = useState<AppState>(EMPTY_STATE);
  const [syncing, setSyncing] = useState(false);
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

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

  function subscribeRealtime(userId: string) {
    if (!supabase || channelRef.current) return;

    channelRef.current = supabase
      .channel(`user-${userId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'sleep_profiles',
        filter: `user_id=eq.${userId}`,
      }, payload => {
        if (payload.eventType === 'DELETE') return;
        const d = payload.new as Record<string, unknown>;
        setState(prev => {
          const next: AppState = {
            ...prev,
            profile: {
              chronotype: d.chronotype as import('@/types').Chronotype,
              targetBedtime: d.target_bedtime as number,
              sleepDuration: d.sleep_duration as number,
              timezone: (d.timezone as string) ?? 'UTC',
            },
          };
          saveState(next);
          return next;
        });
      })
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'sleep_entries',
        filter: `user_id=eq.${userId}`,
      }, payload => {
        setState(prev => {
          let entries = [...prev.entries];
          if (payload.eventType === 'DELETE') {
            const old = payload.old as Record<string, unknown>;
            entries = entries.filter(e => e.date !== old.date);
          } else {
            const d = payload.new as Record<string, unknown>;
            const entry: SleepEntry = { date: d.date as string, bedtime: d.bedtime as number, wakeTime: d.wake_time as number };
            entries = entries.filter(e => e.date !== entry.date);
            entries = [...entries, entry].sort((a, b) => a.date.localeCompare(b.date));
          }
          const next = { ...prev, entries };
          saveState(next);
          return next;
        });
      })
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'sun_exposure',
        filter: `user_id=eq.${userId}`,
      }, payload => {
        setState(prev => {
          const sun = { ...prev.sunExposureDone };
          if (payload.eventType === 'DELETE') {
            const old = payload.old as Record<string, unknown>;
            delete sun[old.date as string];
          } else {
            const d = payload.new as Record<string, unknown>;
            sun[d.date as string] = { morning: d.morning as boolean, afternoon: d.afternoon as boolean };
          }
          const next = { ...prev, sunExposureDone: sun };
          saveState(next);
          return next;
        });
      })
      .subscribe();
  }

  function unsubscribeRealtime() {
    if (channelRef.current) {
      supabase?.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }

  useEffect(() => {
    if (!supabase) {
      setSessionLoading(false);
      setState(loadState());
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setSessionLoading(false);
      if (session?.user.id) {
        hydrateFromRemote(session.user.id);
        subscribeRealtime(session.user.id);
      } else {
        setState(loadState());
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setPasswordRecovery(true);
        setSession(session);
        return;
      }
      setPasswordRecovery(false);
      setSession(session);
      if (session?.user.id) {
        hydrateFromRemote(session.user.id);
        subscribeRealtime(session.user.id);
      } else {
        setState(EMPTY_STATE);
        saveState(EMPTY_STATE);
        unsubscribeRealtime();
      }
    });

    return () => {
      subscription.unsubscribe();
      unsubscribeRealtime();
    };
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

  const removeEntry = useCallback((date: string) => {
    const next = deleteEntry(date);
    setState(next);
    if (supabase && session?.user.id) {
      supabase.from('sleep_entries').delete().eq('user_id', session.user.id).eq('date', date);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const signOut = useCallback(async () => {
    unsubscribeRealtime();
    await supabase?.auth.signOut();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetLocalData = useCallback(() => {
    saveState(EMPTY_STATE);
    setState(EMPTY_STATE);
  }, []);

  return (
    <AppContext.Provider value={{ session, sessionLoading, passwordRecovery, state, syncing, setProfile, logEntry, toggleSun, removeEntry, signOut, resetLocalData }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
