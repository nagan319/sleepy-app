import type { Chronotype } from '@/types';

export interface ChronotypeInfo {
  id: Chronotype;
  name: string;
  emoji: string;
  description: string;
  naturalWake: string;
  naturalSleep: string;
  peakProductivity: string;
  peakCreativity: string;
  lowEnergy: string;
  caffeineAdvice: string;
  exerciseTiming: string;
  color: string;
  bgColor: string;
}

export const CHRONOTYPES: Record<Chronotype, ChronotypeInfo> = {
  lion: {
    id: 'lion',
    name: 'Lion',
    emoji: '🦁',
    description: 'Up before everyone else. Morning is your golden hour — you earn your rest early.',
    naturalWake: '5:00–6:30 AM',
    naturalSleep: '9:00–10:00 PM',
    peakProductivity: '8:00 AM – 12:00 PM',
    peakCreativity: '6:00 AM – 9:00 AM',
    lowEnergy: '3:00 PM – 5:00 PM',
    caffeineAdvice: 'Last caffeine by 12:00 PM to protect sleep quality',
    exerciseTiming: 'Early morning works great (6–8 AM)',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10 border-amber-500/20',
  },
  bear: {
    id: 'bear',
    name: 'Bear',
    emoji: '🐻',
    description: 'The cozy middle ground. You follow the sun — steady, reliable, happiest with a good routine.',
    naturalWake: '7:00–8:00 AM',
    naturalSleep: '11:00 PM – 12:00 AM',
    peakProductivity: '10:00 AM – 2:00 PM',
    peakCreativity: '9:00 AM – 11:00 AM',
    lowEnergy: '2:00 PM – 4:00 PM',
    caffeineAdvice: 'Last caffeine by 2:00 PM',
    exerciseTiming: 'Mid-morning or early afternoon (10 AM–2 PM)',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10 border-green-500/20',
  },
  wolf: {
    id: 'wolf',
    name: 'Wolf',
    emoji: '🐺',
    description: 'Night owl with a slow start. You come alive in the afternoon — your best ideas happen after dark.',
    naturalWake: '9:00–10:00 AM',
    naturalSleep: '12:00–1:00 AM',
    peakProductivity: '12:00 PM – 6:00 PM',
    peakCreativity: '4:00 PM – 9:00 PM',
    lowEnergy: '8:00 AM – 11:00 AM',
    caffeineAdvice: 'Last caffeine by 3:00 PM (later biological clock)',
    exerciseTiming: 'Afternoon or evening (4–7 PM)',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10 border-purple-500/20',
  },
};

export function getCurrentZone(chronotype: Chronotype): { zone: string; description: string } {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  const time = h + m / 60;

  if (chronotype === 'lion') {
    if (time >= 6 && time < 9) return { zone: 'Peak Creativity', description: 'Best for deep creative work' };
    if (time >= 9 && time < 12) return { zone: 'Peak Productivity', description: 'Focus on high-priority tasks' };
    if (time >= 12 && time < 15) return { zone: 'Good Focus', description: 'Administrative and collaborative tasks' };
    if (time >= 15 && time < 17) return { zone: 'Low Energy', description: 'Light tasks or a short rest' };
    if (time >= 17 && time < 20) return { zone: 'Wind Down', description: 'Social or low-demand activities' };
    return { zone: 'Rest', description: 'Prepare for sleep' };
  }

  if (chronotype === 'bear') {
    if (time >= 7 && time < 9) return { zone: 'Waking Up', description: 'Light tasks, email, planning' };
    if (time >= 9 && time < 12) return { zone: 'Peak Creativity', description: 'Creative and strategic work' };
    if (time >= 12 && time < 14) return { zone: 'Peak Productivity', description: 'Deep focus work' };
    if (time >= 14 && time < 16) return { zone: 'Low Energy', description: 'Light tasks or a brief walk' };
    if (time >= 16 && time < 20) return { zone: 'Second Wind', description: 'Good for meetings or collaborative work' };
    return { zone: 'Rest', description: 'Prepare for sleep' };
  }

  // wolf
  if (time >= 9 && time < 12) return { zone: 'Waking Up', description: 'Light tasks only, avoid deep work' };
  if (time >= 12 && time < 14) return { zone: 'Good Focus', description: 'Start ramping up productivity' };
  if (time >= 14 && time < 18) return { zone: 'Peak Productivity', description: 'Deep focus and high-priority work' };
  if (time >= 18 && time < 21) return { zone: 'Peak Creativity', description: 'Best for creative thinking and innovation' };
  if (time >= 21 && time < 23) return { zone: 'Good Focus', description: 'Great for writing or planning' };
  return { zone: 'Rest', description: 'Wind down for sleep' };
}
