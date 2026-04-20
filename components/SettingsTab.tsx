'use client';

import { useState, useMemo } from 'react';
import { CheckCircle, Moon, Clock, Globe, Trash2 } from 'lucide-react';
import type { Chronotype, SleepProfile } from '@/types';
import { CHRONOTYPES } from '@/lib/chronotype';
import { hhmmToMinutes, minutesToHHMM } from '@/lib/sleep-calculator';
import { filterCities, findCityByTimezone } from '@/lib/cities';
import { useApp } from './AppContext';

export default function SettingsTab() {
  const { state, setProfile, resetLocalData } = useApp();
  if (!state.profile) return null;

  const p = state.profile;
  const [chronotype, setChronotype] = useState<Chronotype>(p.chronotype);
  const [targetBedtime, setTargetBedtime] = useState(minutesToHHMM(p.targetBedtime));
  const [sleepDuration, setSleepDuration] = useState(String(p.sleepDuration));
  const profileTz = p.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  const defaultCity = findCityByTimezone(profileTz);
  const [cityInput, setCityInput] = useState(defaultCity?.label ?? profileTz);
  const [selectedTz, setSelectedTz] = useState(profileTz);
  const [cityFocused, setCityFocused] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const suggestions = useMemo(() => filterCities(cityInput).slice(0, 8), [cityInput]);

  function handleCitySelect(label: string, tz: string) {
    setCityInput(label);
    setSelectedTz(tz);
    setCityFocused(false);
    setSaved(false);
  }

  function handleSave() {
    const profile: SleepProfile = {
      chronotype,
      targetBedtime: hhmmToMinutes(targetBedtime),
      sleepDuration: parseFloat(sleepDuration),
      timezone: selectedTz,
    };
    setProfile(profile);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function handleReset() {
    resetLocalData();
    setShowResetConfirm(false);
  }

  return (
    <div className="px-4 md:px-8 py-6 space-y-5 md:max-w-xl">
      <h2 className="text-xl font-bold text-slate-100">Settings</h2>

      {/* Timezone */}
      <div>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Timezone</h3>
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
          <label className="flex items-start gap-3">
            <Globe className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
            <div className="flex-1 relative">
              <div className="text-xs text-slate-400 mb-1">City / timezone</div>
              <input
                value={cityInput}
                onChange={e => { setCityInput(e.target.value); setCityFocused(true); setSaved(false); }}
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
        <p className="text-xs text-slate-500 mt-1.5 px-1">
          Affects what counts as &quot;today&quot;, countdowns, and greeting times.
        </p>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Chronotype</h3>
        <div className="space-y-2">
          {Object.values(CHRONOTYPES).map(ct => (
            <button
              key={ct.id}
              onClick={() => { setChronotype(ct.id); setSaved(false); }}
              className={`w-full p-3.5 rounded-xl border text-left transition-all ${
                chronotype === ct.id ? 'border-green-500 bg-green-500/15' : 'border-slate-700 bg-slate-800/50'
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
              <Moon className="w-5 h-5 text-green-400 shrink-0" />
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
              <Clock className="w-5 h-5 text-green-400 shrink-0" />
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
                    className="flex-1 accent-green-500"
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
          saved ? 'bg-emerald-600 text-white' : 'bg-green-600 hover:bg-green-500 text-white'
        }`}
      >
        {saved ? (
          <span className="flex items-center justify-center gap-2">
            <CheckCircle className="w-4 h-4" /> Saved
          </span>
        ) : 'Save Settings'}
      </button>

      {/* Reset local data */}
      <div>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Data</h3>
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
          {!showResetConfirm ? (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Clear local cache
            </button>
          ) : (
            <div>
              <p className="text-sm text-slate-300 mb-3">
                This clears all locally stored data (profile, sleep log, sun exposure). Your cloud data stays intact.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleReset}
                  className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 py-2 rounded-lg border border-slate-600 text-slate-300 text-sm hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          <p className="text-xs text-slate-500 mt-2">
            Use this if your local data is out of sync after a database reset.
          </p>
        </div>
      </div>
    </div>
  );
}
