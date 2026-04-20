import type { SleepProfile, SleepEntry, DaySchedule, SocialJetLag } from '@/types';

// ── Timezone-aware time helpers ──────────────────────────────────────────────

export function nowMinutesInTz(tz: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hour: 'numeric', minute: 'numeric', hour12: false,
  }).formatToParts(new Date());
  const h = parseInt(parts.find(p => p.type === 'hour')!.value);
  const m = parseInt(parts.find(p => p.type === 'minute')!.value);
  return (h === 24 ? 0 : h) * 60 + m;
}

export function todayStrInTz(tz: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
}

export function yesterdayStrInTz(tz: string): string {
  const today = todayStrInTz(tz);
  const d = new Date(today + 'T12:00:00Z');
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

export function hourInTz(tz: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hour: 'numeric', hour12: false,
  }).formatToParts(new Date());
  const h = parseInt(parts.find(p => p.type === 'hour')!.value);
  return h === 24 ? 0 : h;
}

// ── Plain time formatting ────────────────────────────────────────────────────

export function minutesToHHMM(minutes: number): string {
  const normalized = ((minutes % 1440) + 1440) % 1440;
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export function hhmmToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function formatTime12h(minutes: number): string {
  const normalized = ((minutes % 1440) + 1440) % 1440;
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  const period = h < 12 ? 'AM' : 'PM';
  const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${displayH}:${m.toString().padStart(2, '0')} ${period}`;
}

export function minutesUntil(targetMinutes: number, tz: string): number {
  const nowMinutes = nowMinutesInTz(tz);
  let diff = targetMinutes - nowMinutes;
  if (diff < -720) diff += 1440;
  return diff;
}

export function formatCountdown(totalMinutes: number): string {
  if (totalMinutes <= 0) return 'Now';
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

// ── Schedule calculation ─────────────────────────────────────────────────────

export function moveBedtimeTowardTarget(current: number, target: number, stepMinutes = 20): number {
  const diff = target - current;
  if (Math.abs(diff) <= stepMinutes) return target;
  return current + Math.sign(diff) * stepMinutes;
}

export function buildDaySchedule(profile: SleepProfile, lastEntry: SleepEntry | null): DaySchedule {
  const recommendedBedtime = lastEntry
    ? moveBedtimeTowardTarget(lastEntry.bedtime, profile.targetBedtime)
    : profile.targetBedtime;

  const sleepDurationMins = profile.sleepDuration * 60;
  const recommendedWakeTime = (recommendedBedtime + sleepDurationMins) % 1440;

  return {
    recommendedBedtime,
    recommendedWakeTime,
    caffeineStop:  ((recommendedBedtime - 600)  + 1440) % 1440,
    eatStop:       ((recommendedBedtime - 180)  + 1440) % 1440,
    workStop:      ((recommendedBedtime - 120)  + 1440) % 1440,
    screenStop:    ((recommendedBedtime - 60)   + 1440) % 1440,
    showerStart:   ((recommendedBedtime - 120)  + 1440) % 1440,
    showerEnd:     ((recommendedBedtime - 90)   + 1440) % 1440,
    sunMorningStart: recommendedWakeTime,
    sunMorningEnd:   (recommendedWakeTime + 60) % 1440,
    sunAfternoonStart: 17 * 60,
    sunAfternoonEnd:   19 * 60,
  };
}

// ── Social jet lag ───────────────────────────────────────────────────────────

function isWeekend(dateStr: string): boolean {
  // Parse as UTC noon so weekday is stable across timezones
  const d = new Date(dateStr + 'T12:00:00Z');
  return d.getUTCDay() === 0 || d.getUTCDay() === 6;
}

function circularMean(angles: number[]): number {
  if (angles.length === 0) return 0;
  const sinSum = angles.reduce((s, a) => s + Math.sin((a / 1440) * 2 * Math.PI), 0);
  const cosSum = angles.reduce((s, a) => s + Math.cos((a / 1440) * 2 * Math.PI), 0);
  const mean = Math.atan2(sinSum / angles.length, cosSum / angles.length);
  return ((mean / (2 * Math.PI)) * 1440 + 1440) % 1440;
}

export function calcSocialJetLag(entries: SleepEntry[]): SocialJetLag {
  const weekdayBedtimes = entries.filter(e => !isWeekend(e.date)).map(e => e.bedtime);
  const weekendBedtimes = entries.filter(e =>  isWeekend(e.date)).map(e => e.bedtime);

  if (weekdayBedtimes.length === 0 || weekendBedtimes.length === 0) {
    return { weekdayAvgBedtime: null, weekendAvgBedtime: null, lagHours: null, cvdRiskIncrease: null };
  }

  const weekdayAvg = circularMean(weekdayBedtimes);
  const weekendAvg = circularMean(weekendBedtimes);

  let lagMinutes = Math.abs(weekendAvg - weekdayAvg);
  if (lagMinutes > 720) lagMinutes = 1440 - lagMinutes;
  const lagHours = lagMinutes / 60;

  return {
    weekdayAvgBedtime: weekdayAvg,
    weekendAvgBedtime: weekendAvg,
    lagHours,
    cvdRiskIncrease: Math.max(0, lagHours - 1) * 11,
  };
}
