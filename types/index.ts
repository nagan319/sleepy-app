export type Chronotype = 'lion' | 'bear' | 'wolf';

export interface SleepProfile {
  chronotype: Chronotype;
  targetBedtime: number; // minutes since midnight in profile timezone
  sleepDuration: number; // hours (7-9)
  timezone: string;      // IANA timezone, e.g. "America/New_York"
}

export interface SleepEntry {
  date: string; // YYYY-MM-DD
  bedtime: number; // minutes since midnight
  wakeTime: number; // minutes since midnight
}

export interface DaySchedule {
  recommendedBedtime: number;
  recommendedWakeTime: number;
  caffeineStop: number;
  eatStop: number;
  workStop: number;
  screenStop: number;
  showerStart: number;
  showerEnd: number;
  sunMorningStart: number;
  sunMorningEnd: number;
  sunAfternoonStart: number;
  sunAfternoonEnd: number;
}

export interface SocialJetLag {
  weekdayAvgBedtime: number | null;
  weekendAvgBedtime: number | null;
  lagHours: number | null;
  cvdRiskIncrease: number | null;
}

export interface AppState {
  profile: SleepProfile | null;
  entries: SleepEntry[];
  sunExposureDone: Record<string, { morning: boolean; afternoon: boolean }>;
}
