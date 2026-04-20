'use client';

import { useState } from 'react';
import { CheckCircle, Moon, Clock } from 'lucide-react';
import type { Chronotype, SleepProfile } from '@/types';
import { CHRONOTYPES } from '@/lib/chronotype';
import { hhmmToMinutes, minutesToHHMM } from '@/lib/sleep-calculator';
import { useApp } from './AppContext';

export default function SettingsTab() {
  const { state, setProfile } = useApp();
  if (!state.profile) return null;

  const p = state.profile;
  const [chronotype, setChronotype] = useState<Chronotype>(p.chronotype);
  const [targetBedtime, setTargetBedtime] = useState(minutesToHHMM(p.targetBedtime));
  const [sleepDuration, setSleepDuration] = useState(String(p.sleepDuration));
  const [saved, setSaved] = useState(false);

  function handleSave() {
    const profile: SleepProfile = {
      chronotype,
      targetBedtime: hhmmToMinutes(targetBedtime),
      sleepDuration: parseFloat(sleepDuration),
    };
    setProfile(profile);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="px-4 md:px-8 py-6 space-y-5 md:max-w-xl">
      <h2 className="text-xl font-bold text-slate-100">Settings</h2>

      <div>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Chronotype</h3>
        <div className="space-y-2">
          {Object.values(CHRONOTYPES).map(ct => (
            <button
              key={ct.id}
              onClick={() => { setChronotype(ct.id); setSaved(false); }}
              className={`w-full p-3.5 rounded-xl border text-left transition-all ${
                chronotype === ct.id ? 'border-indigo-500 bg-indigo-500/15' : 'border-slate-700 bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{ct.emoji}</span>
                <div>
                  <div className="font-semibold text-sm text-slate-100">{ct.name}</div>
                  <div className="text-xs text-slate-400">{ct.naturalWake} natural wake</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Sleep Goal</h3>
        <div className="space-y-3">
          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
            <label className="flex items-center gap-3">
              <Moon className="w-5 h-5 text-indigo-400 shrink-0" />
              <div className="flex-1">
                <div className="text-xs text-slate-400 mb-1">Target bedtime</div>
                <input
                  type="time"
                  value={targetBedtime}
                  onChange={e => { setTargetBedtime(e.target.value); setSaved(false); }}
                  className="bg-transparent text-xl font-mono font-semibold text-slate-100 outline-none w-full"
                />
              </div>
            </label>
          </div>

          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
            <label className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-indigo-400 shrink-0" />
              <div className="flex-1">
                <div className="text-xs text-slate-400 mb-2">Sleep duration goal</div>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="5"
                    max="10"
                    step="0.5"
                    value={sleepDuration}
                    onChange={e => { setSleepDuration(e.target.value); setSaved(false); }}
                    className="flex-1 accent-indigo-500"
                  />
                  <span className="text-xl font-mono font-semibold text-slate-100 w-12 text-right">
                    {sleepDuration}h
                  </span>
                </div>
              </div>
            </label>
          </div>
        </div>
      </div>

      <button
        onClick={handleSave}
        className={`w-full py-4 rounded-xl font-semibold text-sm transition-all ${
          saved ? 'bg-emerald-600 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white'
        }`}
      >
        {saved ? (
          <span className="flex items-center justify-center gap-2">
            <CheckCircle className="w-4 h-4" /> Saved
          </span>
        ) : 'Save Settings'}
      </button>
    </div>
  );
}
