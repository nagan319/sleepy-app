'use client';

import { useState } from 'react';
import { Moon, Lock, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function SetNewPasswordScreen({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function handleSubmit() {
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    setError('');
    const { error } = await supabase!.auth.updateUser({ password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setDone(true);
    setTimeout(onDone, 1500);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-4">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
            <Moon className="w-8 h-8 text-green-400" />
          </div>
          <h1 className="text-xl font-bold text-slate-100">Set new password</h1>
          <p className="text-slate-400 text-sm mt-1">choose something you&apos;ll remember</p>
        </div>

        {done ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <CheckCircle className="w-10 h-10 text-emerald-400" />
            <p className="text-slate-200 font-medium">Password updated!</p>
          </div>
        ) : (
          <>
            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
              <label className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-green-400 shrink-0" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="new password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  autoFocus
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
                  value={confirm}
                  onChange={e => { setConfirm(e.target.value); setError(''); }}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  className="flex-1 bg-transparent text-slate-100 placeholder-slate-500 outline-none text-base"
                />
              </label>
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={loading || !password || !confirm}
              className="w-full py-3.5 rounded-xl bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update password'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
