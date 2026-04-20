'use client';

import { useState } from 'react';
import { Moon, Sun, CheckCircle } from 'lucide-react';
import type { SleepEntry } from '@/types';
import { hhmmToMinutes, minutesToHHMM, todayStrInTz, yesterdayStrInTz } from '@/lib/sleep-calculator';
import { useApp } from './AppContext';

export default function SleepLogTab() {
  const { state, logEntry } = useApp();
  const tz = state.profile?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  const today = todayStrInTz(tz);
  const yesterdayStr = yesterdayStrInTz(tz);

  const existing = state.entries.find(e => e.date === yesterdayStr);

  const [bedtime, setBedtime] = useState(existing ? minutesToHHMM(existing.bedtime) : '23:00');
  const [wakeTime, setWakeTime] = useState(existing ? minutesToHHMM(existing.wakeTime) : '07:00');
  const [saved, setSaved] = useState(false);

  function calcDuration(): number {
    const b = hhmmToMinutes(bedtime);
    const w = hhmmToMinutes(wakeTime);
    const dur = w >= b ? (w - b) / 60 : (1440 - b + w) / 60;
    return Math.round(dur * 10) / 10;
  }

  function handleSave() {
    const entry: SleepEntry = {
      date: yesterdayStr,
      bedtime: hhmmToMinutes(bedtime),
      wakeTime: hhmmToMinutes(wakeTime),
    };
    logEntry(entry);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const duration = calcDuration();
  const durationOk = duration >= 7 && duration <= 9;

  return (
    <div className="px-4 md:px-8 py-6 space-y-4 md:max-w-xl">
      <div>
        <h2 className="text-xl font-bold text-slate-100">Log Last Night</h2>
        <p className="text-sm text-slate-400 mt-0.5">
          {new Date(yesterdayStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div className="space-y-3">
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
          <label className="flex items-center gap-3">
            <Moon className="w-5 h-5 text-green-400 shrink-0" />
            <div className="flex-1">
              <div className="text-xs text-slate-400 mb-1">I went to bed at</div>
              <input
                type="time"
                value={bedtime}
                onChange={e => { setBedtime(e.target.value); setSaved(false); }}
                className="bg-transparent text-xl font-mono font-semibold text-slate-100 outline-none w-full"
              />
            </div>
          </label>
        </div>

        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
          <label className="flex items-center gap-3">
            <Sun className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="flex-1">
              <div className="text-xs text-slate-400 mb-1">I woke up at</div>
              <input
                type="time"
                value={wakeTime}
                onChange={e => { setWakeTime(e.target.value); setSaved(false); }}
                className="bg-transparent text-xl font-mono font-semibold text-slate-100 outline-none w-full"
              />
            </div>
          </label>
        </div>
      </div>

      <div className={`rounded-xl p-4 border ${durationOk ? 'bg-emerald-500/10 border-emerald-500/20' : duration < 6 ? 'bg-red-500/10 border-red-500/20' : 'bg-amber-500/10 border-amber-500/20'}`}>
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-300">Sleep duration</span>
          <span className={`text-xl font-bold font-mono ${durationOk ? 'text-emerald-400' : duration < 6 ? 'text-red-400' : 'text-amber-400'}`}>
            {duration}h
          </span>
        </div>
        <div className={`text-xs mt-1 ${durationOk ? 'text-emerald-400/70' : duration < 6 ? 'text-red-400/70' : 'text-amber-400/70'}`}>
          {durationOk ? 'Optimal range (7–9h)' : duration < 6 ? 'Below recommended minimum' : duration > 9 ? 'Above recommended maximum' : 'Slightly below optimal'}
        </div>
      </div>

      {state.entries.length > 0 && (
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Recent History</h3>
          <div className="space-y-2">
            {[...state.entries].reverse().slice(0, 5).map(e => {
              const dur = e.wakeTime >= e.bedtime ? (e.wakeTime - e.bedtime) / 60 : (1440 - e.bedtime + e.wakeTime) / 60;
              const d = new Date(e.date + 'T12:00:00');
              return (
                <div key={e.date} className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">
                    {d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-green-300 font-mono">{minutesToHHMM(e.bedtime)}</span>
                    <span className="text-slate-600">→</span>
                    <span className="text-amber-300 font-mono">{minutesToHHMM(e.wakeTime)}</span>
                    <span className={`font-mono font-semibold ${Math.round(dur * 10) / 10 >= 7 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {Math.round(dur * 10) / 10}h
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <button
        onClick={handleSave}
        className={`w-full py-4 rounded-xl font-semibold text-sm transition-all ${
          saved
            ? 'bg-emerald-600 text-white'
            : 'bg-green-600 hover:bg-green-500 text-white'
        }`}
      >
        {saved ? (
          <span className="flex items-center justify-center gap-2">
            <CheckCircle className="w-4 h-4" /> Saved!
          </span>
        ) : 'Save Sleep Log'}
      </button>
    </div>
  );
}
