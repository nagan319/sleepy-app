'use client';

import { Heart, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { calcSocialJetLag, formatTime12h } from '@/lib/sleep-calculator';
import { CHRONOTYPES, getCurrentZone } from '@/lib/chronotype';
import { useApp } from './AppContext';

export default function StatsTab() {
  const { state } = useApp();
  if (!state.profile) return null;

  const jetLag = calcSocialJetLag(state.entries);
  const ct = CHRONOTYPES[state.profile.chronotype];
  const zone = getCurrentZone(state.profile.chronotype);

  const hasEnoughData = jetLag.lagHours !== null;

  return (
    <div className="px-4 md:px-8 py-6">
      <h2 className="text-xl font-bold text-slate-100 mb-6">insights ✨</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

      {/* Current zone */}
      <div className={`rounded-xl p-4 border ${ct.bgColor}`}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">{ct.emoji}</span>
          <span className="text-sm font-semibold text-slate-300">{ct.name} — Right Now</span>
        </div>
        <div className={`text-xl font-bold ${ct.color}`}>{zone.zone}</div>
        <div className="text-sm text-slate-400 mt-0.5">{zone.description}</div>
      </div>

      {/* Social Jet Lag */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Heart className="w-4 h-4 text-rose-400" />
          <h3 className="text-sm font-semibold text-slate-200">Social Jet Lag</h3>
        </div>

        {!hasEnoughData ? (
          <div className="text-sm text-slate-400">
            log a weekday and a weekend night to see how consistent your schedule is 🌙
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-700/40 rounded-lg p-3">
                <div className="text-xs text-slate-400 mb-1">Weekday avg</div>
                <div className="text-lg font-mono font-semibold text-green-300">
                  {formatTime12h(jetLag.weekdayAvgBedtime!)}
                </div>
              </div>
              <div className="bg-slate-700/40 rounded-lg p-3">
                <div className="text-xs text-slate-400 mb-1">Weekend avg</div>
                <div className="text-lg font-mono font-semibold text-purple-300">
                  {formatTime12h(jetLag.weekendAvgBedtime!)}
                </div>
              </div>
            </div>

            <div className={`rounded-lg p-3 border ${
              jetLag.lagHours! <= 1
                ? 'bg-emerald-500/10 border-emerald-500/20'
                : jetLag.lagHours! <= 2
                ? 'bg-amber-500/10 border-amber-500/20'
                : 'bg-rose-500/10 border-rose-500/20'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Lag</span>
                <span className={`text-xl font-bold font-mono ${
                  jetLag.lagHours! <= 1 ? 'text-emerald-400' : jetLag.lagHours! <= 2 ? 'text-amber-400' : 'text-rose-400'
                }`}>
                  {jetLag.lagHours!.toFixed(1)}h
                </span>
              </div>

              {jetLag.cvdRiskIncrease! > 0 && (
                <div className="mt-2 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-rose-400" />
                  <span className="text-xs text-rose-300">
                    +{jetLag.cvdRiskIncrease!.toFixed(0)}% heart health risk
                  </span>
                </div>
              )}
              {jetLag.lagHours! <= 1 && (
                <div className="mt-1 text-xs text-emerald-400/80">Within safe range (&lt; 1h)</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Chronotype Detail */}
      <div className={`rounded-xl p-4 border ${ct.bgColor}`}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">{ct.emoji}</span>
          <h3 className="text-sm font-semibold text-slate-200">{ct.name} Chronotype</h3>
        </div>
        <div className="space-y-2 text-sm">
          {[
            { label: 'Natural wake', value: ct.naturalWake },
            { label: 'Peak productivity', value: ct.peakProductivity },
            { label: 'Peak creativity', value: ct.peakCreativity },
            { label: 'Low energy', value: ct.lowEnergy },
            { label: 'Best exercise', value: ct.exerciseTiming },
            { label: 'Caffeine cutoff', value: ct.caffeineAdvice },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between items-start gap-3">
              <span className="text-slate-400 shrink-0">{label}</span>
              <span className="text-slate-200 text-right">{value}</span>
            </div>
          ))}
        </div>
      </div>

      </div>{/* end 2-col grid */}

      {/* Sleep trend — full width below grid */}
      {state.entries.length >= 2 && (
        <div className="mt-4 bg-slate-800/60 border border-slate-700 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-slate-200 mb-3">Bedtime Trend (last 7 days)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1.5">
            {[...state.entries].reverse().slice(0, 7).map((e, i, arr) => {
              const prev = arr[i + 1];
              const target = state.profile!.targetBedtime;
              const diff = e.bedtime - target;
              const icon = !prev ? <Minus className="w-3 h-3" /> : e.bedtime < prev.bedtime ? <TrendingDown className="w-3 h-3 text-emerald-400" /> : e.bedtime > prev.bedtime ? <TrendingUp className="w-3 h-3 text-rose-400" /> : <Minus className="w-3 h-3 text-slate-500" />;
              const d = new Date(e.date + 'T12:00:00');
              return (
                <div key={e.date} className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 w-8">{d.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                  <span className="font-mono text-sm text-slate-200">{formatTime12h(e.bedtime)}</span>
                  <span className="text-slate-600">{icon}</span>
                  <span className={`text-xs ml-auto ${Math.abs(diff) <= 20 ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {diff === 0 ? 'On target' : `${Math.abs(diff)}m ${diff > 0 ? 'late' : 'early'}`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
