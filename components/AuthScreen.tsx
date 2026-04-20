'use client';

import { useState } from 'react';
import { Moon, Mail, ArrowRight, Loader2, MailCheck, Lock, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Mode = 'link' | 'password';
type Step = 'form' | 'sent';

export default function AuthScreen() {
  const [mode, setMode] = useState<Mode>('link');
  const [step, setStep] = useState<Step>('form');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function sendLink() {
    if (!supabase || !email.trim()) return;
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true, emailRedirectTo: window.location.origin },
    });
    setLoading(false);
    if (error) {
      if (error.message.toLowerCase().includes('rate limit') || error.status === 429) {
        setError('Too many emails sent — try signing in with a password instead.');
      } else {
        setError(error.message);
      }
      return;
    }
    setStep('sent');
  }

  async function signInWithPassword() {
    if (!supabase || !email.trim() || !password) return;
    setLoading(true);
    setError('');

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (!signInError) {
      setLoading(false);
      return; // success — onAuthStateChange handles the redirect
    }

    // Sign-in failed — attempt sign-up (handles new users)
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    if (!signUpData.session) {
      // Email confirmation is ON in Supabase — user must confirm before signing in
      setError('Check your inbox for a confirmation email, then try again.');
    }
    // If session exists, onAuthStateChange handles the redirect
  }

  function reset() {
    setStep('form');
    setError('');
    setPassword('');
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
            <Moon className="w-8 h-8 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">sleepy</h1>
          <p className="text-slate-400 text-sm mt-1">sleep helper</p>
        </div>

        {step === 'form' ? (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-100 mb-1">sign in</h2>
              <p className="text-sm text-slate-400">
                {mode === 'link' ? 'we\'ll email you a sign-in link' : 'use your email and password'}
              </p>
            </div>

            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
              <label className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-green-400 shrink-0" />
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  onKeyDown={e => e.key === 'Enter' && (mode === 'link' ? sendLink() : signInWithPassword())}
                  autoFocus
                  className="flex-1 bg-transparent text-slate-100 placeholder-slate-500 outline-none text-base"
                />
              </label>
            </div>

            {mode === 'password' && (
              <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
                <label className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-green-400 shrink-0" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="password"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(''); }}
                    onKeyDown={e => e.key === 'Enter' && signInWithPassword()}
                    autoFocus
                    className="flex-1 bg-transparent text-slate-100 placeholder-slate-500 outline-none text-base"
                  />
                  <button onClick={() => setShowPassword(v => !v)} className="text-slate-500 hover:text-slate-300">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </label>
              </div>
            )}

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              onClick={mode === 'link' ? sendLink : signInWithPassword}
              disabled={loading || !email.trim() || (mode === 'password' && !password)}
              className="w-full py-3.5 rounded-xl bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              {loading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : mode === 'link'
                ? <><span>send sign-in link</span><ArrowRight className="w-4 h-4" /></>
                : <><span>continue</span><ArrowRight className="w-4 h-4" /></>}
            </button>

            <button
              onClick={() => { setMode(m => m === 'link' ? 'password' : 'link'); setError(''); }}
              className="w-full text-sm text-slate-500 hover:text-slate-300 transition-colors py-1"
            >
              {mode === 'link' ? 'use a password instead' : 'send a magic link instead'}
            </button>
          </div>
        ) : (
          <div className="space-y-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center mx-auto">
              <MailCheck className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-100 mb-1">check your inbox</h2>
              <p className="text-sm text-slate-400">
                sent a sign-in link to <span className="text-slate-200">{email}</span>.<br />
                click it to sign in — you can close this tab.
              </p>
            </div>
            <button onClick={reset} className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
              use a different email
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
