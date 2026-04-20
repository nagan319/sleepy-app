'use client';

import { useState } from 'react';
import { Home, PenLine, BarChart2, Settings, Moon, Cloud, LogOut } from 'lucide-react';
import { AppProvider, useApp } from '@/components/AppContext';
import AuthScreen from '@/components/AuthScreen';
import SetupFlow from '@/components/SetupFlow';
import DashboardTab from '@/components/DashboardTab';
import SleepLogTab from '@/components/SleepLogTab';
import StatsTab from '@/components/StatsTab';
import SettingsTab from '@/components/SettingsTab';
import { CHRONOTYPES } from '@/lib/chronotype';

type Tab = 'home' | 'log' | 'stats' | 'settings';

const NAV_ITEMS = [
  { id: 'home' as const, icon: Home, label: 'Today' },
  { id: 'log' as const, icon: PenLine, label: 'Log Sleep' },
  { id: 'stats' as const, icon: BarChart2, label: 'Insights' },
  { id: 'settings' as const, icon: Settings, label: 'Settings' },
];

function AppShell() {
  const { session, sessionLoading, state, syncing, signOut } = useApp();
  const [tab, setTab] = useState<Tab>('home');

  // Spinner while resolving session
  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Moon className="w-8 h-8 text-green-400 animate-pulse" />
      </div>
    );
  }

  // No session → sign in
  if (!session) return <AuthScreen />;

  // Signed in but not set up → onboarding
  if (!state.profile) return <SetupFlow />;

  const ct = CHRONOTYPES[state.profile.chronotype];

  return (
    <div className="min-h-screen md:flex">
      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex md:flex-col md:w-56 md:shrink-0 bg-slate-900 border-r border-slate-800/80 sticky top-0 h-screen">
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-slate-800/80">
          <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center shrink-0">
            <Moon className="w-4 h-4 text-green-400" />
          </div>
          <span className="font-semibold text-slate-100 text-base tracking-tight">sleepy</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV_ITEMS.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                tab === id
                  ? 'bg-green-500/15 text-green-300 border border-green-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        {syncing && (
          <div className="px-5 py-2 flex items-center gap-1.5 text-xs text-slate-500">
            <Cloud className="w-3.5 h-3.5 animate-pulse" /> Syncing…
          </div>
        )}

        <div className="px-4 pb-2">
          <div className={`rounded-xl p-3 border ${ct.bgColor}`}>
            <div className="text-xs text-slate-500 mb-1">Chronotype</div>
            <div className="flex items-center gap-2">
              <span>{ct.emoji}</span>
              <span className={`font-semibold text-sm ${ct.color}`}>{ct.name}</span>
            </div>
            <div className="text-xs text-slate-500 mt-1 leading-tight">{ct.peakProductivity}</div>
          </div>
        </div>

        {/* Account */}
        <div className="px-4 pb-5 pt-1">
          <div className="text-xs text-slate-600 truncate mb-1.5 px-1">{session.user.email}</div>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </button>
        </div>
      </aside>

      {/* ── Content ── */}
      <main className="flex-1 min-w-0 overflow-y-auto pb-20 md:pb-0 md:max-h-screen">
        <div className="mx-auto md:max-w-5xl">
          {tab === 'home' && <DashboardTab />}
          {tab === 'log' && <SleepLogTab />}
          {tab === 'stats' && <StatsTab />}
          {tab === 'settings' && <SettingsTab />}
        </div>
      </main>

      {/* ── Mobile bottom nav ── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-slate-900/95 backdrop-blur-sm border-t border-slate-700/60 z-50">
        <div className="flex">
          {NAV_ITEMS.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
                tab === id ? 'text-green-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          ))}
        </div>
        <div style={{ height: 'env(safe-area-inset-bottom)' }} />
      </nav>
    </div>
  );
}

export default function Page() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
