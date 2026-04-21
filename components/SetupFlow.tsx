'use client';

import { useState, useMemo } from 'react';
import { Moon, Sun, Clock, Globe, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import type { Chronotype, SleepProfile } from '@/types';
import { CHRONOTYPES } from '@/lib/chronotype';
import { hhmmToMinutes, yesterdayStrInTz } from '@/lib/sleep-calculator';
import { filterCities, findCityByTimezone } from '@/lib/cities';
import { supabase } from '@/lib/supabase';
import { useApp } from './AppContext';

export default function SetupFlow() {
  const { setProfile, logEntry } = useApp();
  const [step, setStep] = useState(0);
  const [chronotype, setChronotype] = useState<Chronotype>('bear');
  const [targetBedtime, setTargetBedtime] = useState('22:30');
  const [sleepDuration, setSleepDuration] = useState('8');

  const deviceTz = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC';
  const defaultCity = findCityByTimezone(deviceTz);
  const [cityInput, setCityInput] = useState(defaultCity?.label ?? deviceTz);
  const [selectedTz, setSelectedTz] = useState(deviceTz);
  const [cityFocused, setCityFocused] = useState(false);

  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [lastBedtime, setLastBedtime] = useState('23:00');
  const [lastWakeTime, setLastWakeTime] = useState('07:00');

  const suggestions = useMemo(() => filterCities(cityInput).slice(0, 8), [cityInput]);

  function handleCitySelect(label: string, tz: string) {
    setCityInput(label);
    setSelectedTz(tz);
    setCityFocused(false);
  }

  async function handleSetPassword(): Promise<boolean> {
    if (password.length < 6) { setPasswordError('Password must be at least 6 characters.'); return false; }
    if (password !== passwordConfirm) { setPasswordError('Passwords do not match.'); return false; }
    setPasswordLoading(true);
    setPasswordError('');
    const { error } = await supabase!.auth.updateUser({ password });
    setPasswordLoading(false);
    if (error) {
      if (error.message.toLowerCase().includes('jwt') || error.message.toLowerCase().includes('sub claim') || error.message.toLowerCase().includes('does not exist')) {
        await supabase!.auth.signOut();
        setPasswordError('Your session expired — please sign in again.');
      } else {
        setPasswordError(error.message);
      }
      return false;
    }
    return true;
  }

  async function handlePasswordContinue() {
    const ok = await handleSetPassword();
    if (ok) setStep(s => s + 1);
  }

  function handleFinish(skipSleep = false) {
    const profile: SleepProfile = {
      chronotype,
      targetBedtime: hhmmToMinutes(targetBedtime),
      sleepDuration: parseFloat(sleepDuration),
      timezone: selectedTz,
    };
    setProfile(profile);
    if (!skipSleep) {
      const yesterday = yesterdayStrInTz(selectedTz);
      logEntry({ date: yesterday, bedtime: hhmmToMinutes(lastBedtime), wakeTime: hhmmToMinutes(lastWakeTime) });
    }
  }

  // Steps: 0 chronotype, 1 bedtime, 2 duration, 3 timezone, 4 password, 5 last night
  const TOTAL_STEPS = 5;
  const PASSWORD_STEP = 4;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
            <Moon className="w-8 h-8 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">sleepy</h1>
          <p className="text-slate-400 text-sm mt-1">let&apos;s get you set up ✨</p>
        </div>

        <div className="flex gap-1.5 mb-8 justify-center">
          {Array.from({ length: TOTAL_STEPS + 1 }).map((_, i) => (
            <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-green-400' : i < step ? 'w-4 bg-green-600' : 'w-4 bg-slate-700'}`} />
          ))}
        </div>

        {step === 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-5">What&apos;s your natural sleep schedule?</h2>
            <div className="space-y-3">
              {Object.values(CHRONOTYPES).map(ct => (
                <button
                  key={ct.id}
                  onClick={() => setChronotype(ct.id)}
                  className={`w-full p-4 rounded-xl border text-left transition-all ${
                    chronotype === ct.id ? 'border-green-500 bg-green-500/15' : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2.5">
                    <span className="text-2xl">{ct.emoji}</span>
                    <div className="font-semibold text-slate-100">{ct.name}</div>
                  </div>
                  <div className="ml-11 flex gap-x-5">
                    <span className="text-xs text-slate-500">Rise <span className="text-slate-300">{ct.naturalWake}</span></span>
                    <span className="text-xs text-slate-500">Sleep <span className="text-slate-300">{ct.naturalSleep}</span></span>
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
              When do you want to be asleep? sleepy will shift your schedule 30 min/day toward this goal.
            </p>
            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
              <label className="flex items-center gap-3">
                <Moon className="w-5 h-5 text-green-400 shrink-0" />
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
                <Clock className="w-5 h-5 text-green-400 shrink-0" />
                <div className="flex-1">
                  <div className="text-sm text-slate-400 mb-2">Hours of sleep</div>
                  <div className="flex items-center gap-4">
                    <input
                      type="range" min="5" max="10" step="0.5"
                      value={sleepDuration}
                      onChange={e => setSleepDuration(e.target.value)}
                      className="flex-1 accent-green-500"
                    />
                    <span className="text-xl font-mono font-semibold text-slate-100 w-12 text-right">{sleepDuration}h</span>
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
                      const dh = h === 0 ? 12 : h > 12 ? h - 12 : h;
                      return `${dh}:${m.toString().padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
                    })()}
                  </span>
                </span>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-lg font-semibold mb-1">Your timezone</h2>
            <p className="text-slate-400 text-sm mb-5">Used for countdowns and sleep schedule. Search by city name.</p>
            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
              <label className="flex items-start gap-3">
                <Globe className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                <div className="flex-1 relative">
                  <div className="text-sm text-slate-400 mb-1">City / timezone</div>
                  <input
                    value={cityInput}
                    onChange={e => { setCityInput(e.target.value); setCityFocused(true); }}
                    onFocus={() => setCityFocused(true)}
                    onBlur={() => setTimeout(() => setCityFocused(false), 150)}
                    className="bg-transparent text-slate-100 outline-none w-full text-sm"
                    placeholder="Search city…"
                    autoComplete="off"
                  />
                  {cityFocused && suggestions.length > 0 && cityInput.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-slate-800 border border-slate-600 rounded-lg overflow-hidden z-10 shadow-xl">
                      {suggestions.map(city => (
                        <button
                          key={city.label}
                          onMouseDown={() => handleCitySelect(city.label, city.timezone)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-slate-700 text-slate-200 flex justify-between items-center"
                        >
                          <span>{city.label}</span>
                          <span className="text-xs text-slate-500 ml-2 shrink-0">{city.timezone}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="text-xs text-slate-500 mt-1 font-mono">{selectedTz}</div>
                </div>
              </label>
            </div>
          </div>
        )}

        {step === PASSWORD_STEP && (
          <div>
            <h2 className="text-lg font-semibold mb-1">Set your password</h2>
            <p className="text-slate-400 text-sm mb-5">
              You&apos;ll use this to sign in next time.
            </p>
            <div className="space-y-3">
              <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
                <label className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-green-400 shrink-0" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="password (min 6 chars)"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setPasswordError(''); }}
                    className="flex-1 bg-transparent text-slate-100 placeholder-slate-500 outline-none text-base"
                  />
                  <button onClick={() => setShowPassword(v => !v)} className="text-slate-500 hover:text-slate-300">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </label>
              </div>
              <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
                <label className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-slate-600 shrink-0" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="confirm password"
                    value={passwordConfirm}
                    onChange={e => { setPasswordConfirm(e.target.value); setPasswordError(''); }}
                    onKeyDown={e => e.key === 'Enter' && handlePasswordContinue()}
                    className="flex-1 bg-transparent text-slate-100 placeholder-slate-500 outline-none text-base"
                  />
                </label>
              </div>
              {passwordError && <p className="text-sm text-red-400">{passwordError}</p>}
            </div>
          </div>
        )}

        {step === TOTAL_STEPS && (
          <div>
            <h2 className="text-lg font-semibold mb-1">How did you sleep last night?</h2>
            <p className="text-slate-400 text-sm mb-5">
              This lets sleepy calculate tonight&apos;s target right away.
            </p>
            <div className="space-y-3">
              <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
                <label className="flex items-center gap-3">
                  <Moon className="w-5 h-5 text-green-400 shrink-0" />
                  <div className="flex-1">
                    <div className="text-sm text-slate-400 mb-1">Went to bed</div>
                    <input
                      type="time"
                      value={lastBedtime}
                      onChange={e => setLastBedtime(e.target.value)}
                      className="bg-transparent text-xl font-mono font-semibold text-slate-100 outline-none w-full"
                    />
                  </div>
                </label>
              </div>
              <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
                <label className="flex items-center gap-3">
                  <Sun className="w-5 h-5 text-amber-400 shrink-0" />
                  <div className="flex-1">
                    <div className="text-sm text-slate-400 mb-1">Woke up</div>
                    <input
                      type="time"
                      value={lastWakeTime}
                      onChange={e => setLastWakeTime(e.target.value)}
                      className="bg-transparent text-xl font-mono font-semibold text-slate-100 outline-none w-full"
                    />
                  </div>
                </label>
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
          {step === TOTAL_STEPS ? (
            <>
              <button
                onClick={() => handleFinish(true)}
                className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300 font-medium hover:bg-slate-800 transition-colors"
              >
                Skip
              </button>
              <button
                onClick={() => handleFinish(false)}
                className="flex-1 py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-500 transition-colors"
              >
                Get Started
              </button>
            </>
          ) : step === PASSWORD_STEP ? (
            <button
              onClick={handlePasswordContinue}
              disabled={passwordLoading || !password || !passwordConfirm}
              className="flex-1 py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              {passwordLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Continue'}
            </button>
          ) : (
            <button
              onClick={() => setStep(s => s + 1)}
              className="flex-1 py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-500 transition-colors"
            >
              Continue
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
