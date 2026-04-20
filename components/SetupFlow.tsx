'use client';

import { useState } from 'react';
import { Moon, Sun, Clock } from 'lucide-react';
import type { Chronotype, SleepProfile } from '@/types';
import { CHRONOTYPES } from '@/lib/chronotype';
import { hhmmToMinutes } from '@/lib/sleep-calculator';
import { useApp } from './AppContext';

export default function SetupFlow() {
  const { setProfile } = useApp();
  const [step, setStep] = useState(0);
  const [chronotype, setChronotype] = useState<Chronotype>('bear');
  const [targetBedtime, setTargetBedtime] = useState('22:30');
  const [sleepDuration, setSleepDuration] = useState('8');

  function handleFinish() {
    const profile: SleepProfile = {
      chronotype,
      targetBedtime: hhmmToMinutes(targetBedtime),
      sleepDuration: parseFloat(sleepDuration),
    };
    setProfile(profile);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center mx-auto mb-4">
            <Moon className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">SleepSync</h1>
          <p className="text-slate-400 text-sm mt-1">Optimize your sleep with science</p>
        </div>

        <div className="flex gap-1.5 mb-8 justify-center">
          {[0, 1, 2].map(i => (
            <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-indigo-400' : i < step ? 'w-4 bg-indigo-600' : 'w-4 bg-slate-700'}`} />
          ))}
        </div>

        {step === 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-1">What&apos;s your chronotype?</h2>
            <p className="text-slate-400 text-sm mb-5">Your natural sleep-wake preference shapes your entire day.</p>
            <div className="space-y-3">
              {(Object.values(CHRONOTYPES)).map(ct => (
                <button
                  key={ct.id}
                  onClick={() => setChronotype(ct.id)}
                  className={`w-full p-4 rounded-xl border text-left transition-all ${
                    chronotype === ct.id
                      ? `border-indigo-500 bg-indigo-500/15`
                      : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{ct.emoji}</span>
                    <div>
                      <div className="font-semibold text-slate-100">{ct.name}</div>
                      <div className="text-xs text-slate-400">{ct.description}</div>
                    </div>
                  </div>
                  <div className="mt-2.5 ml-11 flex flex-wrap gap-x-4 gap-y-1">
                    <span className="text-xs text-slate-500"><span className="text-slate-400">Wakes</span> {ct.naturalWake}</span>
                    <span className="text-xs text-slate-500"><span className="text-slate-400">Peak</span> {ct.peakProductivity}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 className="text-lg font-semibold mb-1">Target bedtime</h2>
            <p className="text-slate-400 text-sm mb-5">
              When do you want to be asleep? SleepSync will shift your schedule 20 min/day toward this goal.
            </p>
            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
              <label className="flex items-center gap-3">
                <Moon className="w-5 h-5 text-indigo-400 shrink-0" />
                <div className="flex-1">
                  <div className="text-sm text-slate-400 mb-1">Desired bedtime</div>
                  <input
                    type="time"
                    value={targetBedtime}
                    onChange={e => setTargetBedtime(e.target.value)}
                    className="bg-transparent text-xl font-mono font-semibold text-slate-100 outline-none w-full"
                  />
                </div>
              </label>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-lg font-semibold mb-1">Sleep duration goal</h2>
            <p className="text-slate-400 text-sm mb-5">
              Most adults need 7–9 hours. This determines your target wake time.
            </p>
            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
              <label className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-indigo-400 shrink-0" />
                <div className="flex-1">
                  <div className="text-sm text-slate-400 mb-2">Hours of sleep</div>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="5"
                      max="10"
                      step="0.5"
                      value={sleepDuration}
                      onChange={e => setSleepDuration(e.target.value)}
                      className="flex-1 accent-indigo-500"
                    />
                    <span className="text-xl font-mono font-semibold text-slate-100 w-12 text-right">
                      {sleepDuration}h
                    </span>
                  </div>
                </div>
              </label>
            </div>
            <div className="mt-4 p-3 rounded-lg bg-slate-800/40 border border-slate-700/50">
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="text-sm text-slate-300">
                  You&apos;ll wake at approximately{' '}
                  <span className="text-amber-400 font-semibold">
                    {(() => {
                      const bed = hhmmToMinutes(targetBedtime);
                      const wake = (bed + parseFloat(sleepDuration) * 60) % 1440;
                      const h = Math.floor(wake / 60);
                      const m = wake % 60;
                      const p = h < 12 ? 'AM' : 'PM';
                      const dh = h === 0 ? 12 : h > 12 ? h - 12 : h;
                      return `${dh}:${m.toString().padStart(2, '0')} ${p}`;
                    })()}
                  </span>
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 flex gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300 font-medium hover:bg-slate-800 transition-colors"
            >
              Back
            </button>
          )}
          <button
            onClick={() => step < 2 ? setStep(s => s + 1) : handleFinish()}
            className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-500 transition-colors"
          >
            {step < 2 ? 'Continue' : 'Get Started'}
          </button>
        </div>
      </div>
    </div>
  );
}
