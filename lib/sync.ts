import { supabase } from './supabase';
import type { AppState } from '@/types';

export async function pushToSupabase(state: AppState, userId: string): Promise<void> {
  if (!supabase || !userId) return;

  const profilePromise = state.profile
    ? supabase.from('sleep_profiles').upsert({
        user_id: userId,
        chronotype: state.profile.chronotype,
        target_bedtime: state.profile.targetBedtime,
        sleep_duration: state.profile.sleepDuration,
        timezone: state.profile.timezone,
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

export async function pullFromSupabase(userId: string): Promise<Partial<AppState> | null> {
  if (!supabase || !userId) return null;

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
        timezone: profileRes.data.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
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
