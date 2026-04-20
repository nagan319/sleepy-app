import { supabase } from './supabase';
import type { AppState } from '@/types';

const DEVICE_ID_KEY = 'sleep-app-device-id';

export function getDeviceId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

export async function pushToSupabase(state: AppState): Promise<void> {
  if (!supabase) return;
  const userId = getDeviceId();

  const profilePromise = state.profile
    ? supabase.from('sleep_profiles').upsert({
        user_id: userId,
        chronotype: state.profile.chronotype,
        target_bedtime: state.profile.targetBedtime,
        sleep_duration: state.profile.sleepDuration,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
    : Promise.resolve();

  const entryRows = state.entries.map(e => ({
    user_id: userId,
    date: e.date,
    bedtime: e.bedtime,
    wake_time: e.wakeTime,
  }));

  const sunRows = Object.entries(state.sunExposureDone).map(([date, v]) => ({
    user_id: userId,
    date,
    morning: v.morning,
    afternoon: v.afternoon,
  }));

  await Promise.all([
    profilePromise,
    entryRows.length > 0
      ? supabase.from('sleep_entries').upsert(entryRows, { onConflict: 'user_id,date' })
      : Promise.resolve(),
    sunRows.length > 0
      ? supabase.from('sun_exposure').upsert(sunRows, { onConflict: 'user_id,date' })
      : Promise.resolve(),
  ]);
}

export async function pullFromSupabase(): Promise<Partial<AppState> | null> {
  if (!supabase) return null;
  const userId = getDeviceId();

  const [profileRes, entriesRes, sunRes] = await Promise.all([
    supabase.from('sleep_profiles').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('sleep_entries').select('*').eq('user_id', userId).order('date'),
    supabase.from('sun_exposure').select('*').eq('user_id', userId),
  ]);

  if (profileRes.error || entriesRes.error || sunRes.error) return null;

  const profile = profileRes.data
    ? {
        chronotype: profileRes.data.chronotype,
        targetBedtime: profileRes.data.target_bedtime,
        sleepDuration: profileRes.data.sleep_duration,
      }
    : null;

  const entries = (entriesRes.data ?? []).map((r: { date: string; bedtime: number; wake_time: number }) => ({
    date: r.date,
    bedtime: r.bedtime,
    wakeTime: r.wake_time,
  }));

  const sunExposureDone = Object.fromEntries(
    (sunRes.data ?? []).map((r: { date: string; morning: boolean; afternoon: boolean }) => [
      r.date,
      { morning: r.morning, afternoon: r.afternoon },
    ])
  );

  return { profile, entries, sunExposureDone };
}
