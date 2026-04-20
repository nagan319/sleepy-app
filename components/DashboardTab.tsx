'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun, Coffee, UtensilsCrossed, Monitor, Briefcase, Droplets, CheckSquare, Square, Target, Zap } from 'lucide-react';
import { buildDaySchedule, formatTime12h, minutesUntil, formatCountdown } from '@/lib/sleep-calculator';
import { getLastEntry, todayStr } from '@/lib/storage';
import { CHRONOTYPES, getCurrentZone } from '@/lib/chronotype';
import { useApp } from './AppContext';

interface CountdownItem {
  id: string;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  targetMinutes: number;
  urgentThreshold: number;
  warnThreshold: number;
  color: string;
  urgentColor: string;
}

export default function DashboardTab() {
  const { state, toggleSun } = useApp();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(id);
  }, []);

  if (!state.profile) return null;

  const today = todayStr();
  const lastEntry = getLastEntry(state.entries);
  const schedule = buildDaySchedule(state.profile, lastEntry);
  const ct = CHRONOTYPES[state.profile.chronotype];
  const zone = getCurrentZone(state.profile.chronotype);
  const sunToday = state.sunExposureDone[today] || { morning: false, afternoon: false };

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';

  const countdownItems: CountdownItem[] = [
    {
      id: 'caffeine',
      label: 'Last caffeine',
      sublabel: '10h before bed',
      icon: <Coffee className="w-4 h-4" />,
      targetMinutes: schedule.caffeineStop,
      urgentThreshold: 30,
      warnThreshold: 120,
      color: 'text-amber-300',
      urgentColor: 'text-red-400',
    },
    {
      id: 'eat',
      label: 'Last meal / alcohol',
      sublabel: '3h before bed',
      icon: <UtensilsCrossed className="w-4 h-4" />,
      targetMinutes: schedule.eatStop,
      urgentThreshold: 30,
      warnThreshold: 60,
      color: 'text-orange-300',
      urgentColor: 'text-red-400',
    },
    {
      id: 'work',
      label: 'Stop work',
      sublabel: '2h before bed',
      icon: <Briefcase className="w-4 h-4" />,
      targetMinutes: schedule.workStop,
      urgentThreshold: 20,
      warnThreshold: 45,
      color: 'text-blue-300',
      urgentColor: 'text-amber-400',
    },
    {
      id: 'shower',
      label: 'Shower window',
      sublabel: '90–120 min before bed',
      icon: <Droplets className="w-4 h-4" />,
      targetMinutes: schedule.showerStart,
      urgentThreshold: 10,
      warnThreshold: 30,
      color: 'text-cyan-300',
      urgentColor: 'text-amber-400',
    },
    {
      id: 'screens',
      label: 'No screens',
      sublabel: '1h before bed',
      icon: <Monitor className="w-4 h-4" />,
      targetMinutes: schedule.screenStop,
      urgentThreshold: 15,
      warnThreshold: 30,
      color: 'text-violet-300',
      urgentColor: 'text-red-400',
    },
  ];

  return (
    <div className="px-4 md:px-8 py-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-slate-400">{greeting}</p>
          <h2 className="text-xl font-bold text-slate-100">
            {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </h2>
        </div>
        {/* Chronotype zone chip — hidden on desktop (shown in sidebar) */}
        <div className={`md:hidden px-3 py-2 rounded-lg border ${ct.bgColor}`}>
          <div className="text-base">{ct.emoji}</div>
          <div className={`text-xs font-semibold ${ct.color}`}>{zone.zone}</div>
        </div>
        {/* Zone on desktop as inline badge */}
        <div className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-full border text-sm ${ct.bgColor}`}>
          <span>{ct.emoji}</span>
          <span className={`font-medium ${ct.color}`}>{zone.zone}</span>
          <span className="text-slate-500">·</span>
          <span className="text-slate-400 text-xs">{zone.description}</span>
        </div>
      </div>

      {/* ── Responsive grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* ── Left column ── */}
        <div className="space-y-4">

          {/* Bedtime card */}
          <div className="bg-gradient-to-br from-indigo-950/80 to-slate-900 border border-indigo-700/30 rounded-2xl p-5">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-xs text-indigo-300/70 font-medium uppercase tracking-wider mb-1">Tonight&apos;s bedtime</div>
                <div className="text-4xl md:text-5xl font-bold font-mono text-indigo-100">
                  {formatTime12h(schedule.recommendedBedtime)}
                </div>
                {lastEntry && (
                  <div className="text-xs text-indigo-300/60 mt-1.5">
                    {lastEntry.bedtime > state.profile.targetBedtime
                      ? `Shifting 20 min earlier → ${formatTime12h(state.profile.targetBedtime)}`
                      : lastEntry.bedtime < state.profile.targetBedtime
                      ? `Shifting 20 min later → ${formatTime12h(state.profile.targetBedtime)}`
                      : 'On target!'}
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400/70 font-medium uppercase tracking-wider mb-1">Wake up</div>
                <div className="text-2xl md:text-3xl font-bold font-mono text-amber-300">
                  {formatTime12h(schedule.recommendedWakeTime)}
                </div>
                <div className="text-xs text-slate-400/60 mt-1">{state.profile.sleepDuration}h sleep</div>
              </div>
            </div>
            <div className="mt-5">
              <div className="flex items-center gap-2 mb-1.5">
                <Target className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-xs text-indigo-300/70">Target: {formatTime12h(state.profile.targetBedtime)}</span>
              </div>
              <div className="h-1.5 bg-slate-700/60 rounded-full overflow-hidden">
                {(() => {
                  if (!lastEntry) return <div className="h-full w-0 bg-indigo-500 rounded-full" />;
                  const diff = Math.abs(schedule.recommendedBedtime - state.profile.targetBedtime);
                  const maxDiff = 4 * 60;
                  const pct = Math.max(0, Math.min(100, (1 - diff / maxDiff) * 100));
                  return <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${pct}%` }} />;
                })()}
              </div>
            </div>
          </div>

          {/* Shower window */}
          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Droplets className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-slate-200">Shower Window</h3>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              A warm shower 90–120 min before bed accelerates the body temp drop that triggers sleepiness.
            </p>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-slate-700/40 rounded-lg p-2.5 text-center">
                <div className="text-xs text-slate-500 mb-0.5">Start by</div>
                <div className="font-mono font-semibold text-cyan-300">{formatTime12h(schedule.showerStart)}</div>
              </div>
              <span className="text-slate-600 text-lg">→</span>
              <div className="flex-1 bg-slate-700/40 rounded-lg p-2.5 text-center">
                <div className="text-xs text-slate-500 mb-0.5">End by</div>
                <div className="font-mono font-semibold text-cyan-300">{formatTime12h(schedule.showerEnd)}</div>
              </div>
            </div>
          </div>

          {/* Sun exposure — shown in left col on desktop */}
          <div className="md:hidden bg-slate-800/60 border border-slate-700 rounded-xl p-4">
            <SunSection schedule={schedule} sunToday={sunToday} today={today} toggleSun={toggleSun} />
          </div>
        </div>

        {/* ── Right column ── */}
        <div className="space-y-4">

          {/* Sun exposure — right col on desktop */}
          <div className="hidden md:block bg-slate-800/60 border border-slate-700 rounded-xl p-4">
            <SunSection schedule={schedule} sunToday={sunToday} today={today} toggleSun={toggleSun} />
          </div>

          {/* Countdown timers */}
          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-200">Today&apos;s Cutoffs</h3>
            </div>
            <div>
              {countdownItems.map(item => (
                <CountdownRow key={item.id} item={item} tick={tick} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SunSection({
  schedule,
  sunToday,
  today,
  toggleSun,
}: {
  schedule: ReturnType<typeof buildDaySchedule>;
  sunToday: { morning: boolean; afternoon: boolean };
  today: string;
  toggleSun: (date: string, slot: 'morning' | 'afternoon', done: boolean) => void;
}) {
  return (
    <>
      <div className="flex items-center gap-2 mb-3">
        <Sun className="w-4 h-4 text-amber-400" />
        <h3 className="text-sm font-semibold text-slate-200">Sun Exposure (20 min each)</h3>
      </div>
      <div className="space-y-2">
        <SunSlot
          label="Morning window"
          time={`${formatTime12h(schedule.sunMorningStart)} – ${formatTime12h(schedule.sunMorningEnd)}`}
          done={sunToday.morning}
          onToggle={() => toggleSun(today, 'morning', !sunToday.morning)}
        />
        <SunSlot
          label="Afternoon window"
          time="5:00 PM – 7:00 PM"
          done={sunToday.afternoon}
          onToggle={() => toggleSun(today, 'afternoon', !sunToday.afternoon)}
        />
      </div>
    </>
  );
}

function SunSlot({ label, time, done, onToggle }: { label: string; time: string; done: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
        done ? 'bg-amber-500/15 border-amber-500/30' : 'bg-slate-700/30 border-slate-700/50 hover:border-slate-600'
      }`}
    >
      {done
        ? <CheckSquare className="w-4 h-4 text-amber-400 shrink-0" />
        : <Square className="w-4 h-4 text-slate-500 shrink-0" />}
      <div>
        <div className={`text-sm font-medium ${done ? 'text-amber-300 line-through opacity-70' : 'text-slate-200'}`}>
          {label}
        </div>
        <div className="text-xs text-slate-500">{time}</div>
      </div>
    </button>
  );
}

function CountdownRow({ item, tick }: { item: CountdownItem; tick: number }) {
  void tick;
  const remaining = minutesUntil(item.targetMinutes);
  const isPast = remaining <= 0;
  const isUrgent = !isPast && remaining <= item.urgentThreshold;
  const isWarn = !isPast && !isUrgent && remaining <= item.warnThreshold;
  const timeColor = isPast ? 'text-slate-600' : isUrgent ? item.urgentColor : isWarn ? 'text-amber-300' : item.color;

  return (
    <div className={`flex items-center gap-3 py-2.5 border-b border-slate-700/40 last:border-0 ${isPast ? 'opacity-40' : ''}`}>
      <div className={`${isPast ? 'text-slate-600' : timeColor} shrink-0`}>{item.icon}</div>
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium ${isPast ? 'text-slate-500' : 'text-slate-200'}`}>{item.label}</div>
        <div className="text-xs text-slate-500">{formatTime12h(item.targetMinutes)} · {item.sublabel}</div>
      </div>
      <div className={`text-sm font-mono font-bold shrink-0 ${timeColor}`}>
        {isPast ? 'Done' : formatCountdown(remaining)}
      </div>
    </div>
  );
}
