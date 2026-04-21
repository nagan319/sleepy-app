'use client';

import { useState } from 'react';
import { Moon, Mail, ArrowRight, Loader2, MailCheck, Lock, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Step = 'signin' | 'create' | 'sent' | 'reset_sent';

export default function AuthScreen() {
  const [step, setStep] = useState<Step>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function clearError() { setError(''); }

  async function handleSignIn() {
    if (!supabase || !email.trim() || !password) return;
    setLoading(true);
    clearError();
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) setError('Wrong email or password.');
  }

  async function handleSendMagicLink() {
    if (!supabase || !email.trim()) return;
    setLoading(true);
    clearError();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true, emailRedirectTo: window.location.origin },
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setStep('sent');
  }

  async function handleForgotPassword() {
    if (!supabase || !email.trim()) { setError('Enter your email first.'); return; }
    setLoading(true);
    clearError();
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin,
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setStep('reset_sent');
  }

  function reset() {
    setStep('signin');
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

        {(step === 'signin' || step === 'create') && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-100 mb-1">
                {step === 'signin' ? 'sign in' : 'create account'}
              </h2>
              <p className="text-sm text-slate-400">
                {step === 'signin' ? 'use your email and password' : "we'll send you a sign-in link to get started"}
              </p>
            </div>

            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
              <label className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-green-400 shrink-0" />
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); clearError(); }}
                  onKeyDown={e => e.key === 'Enter' && (step === 'signin' ? handleSignIn() : handleSendMagicLink())}
                  autoFocus
                  className="flex-1 bg-transparent text-slate-100 placeholder-slate-500 outline-none text-base"
                />
              </label>
            </div>

            {step === 'signin' && (
              <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
                <label className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-green-400 shrink-0" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="password"
                    value={password}
                    onChange={e => { setPassword(e.target.value); clearError(); }}
                    onKeyDown={e => e.key === 'Enter' && handleSignIn()}
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
              onClick={step === 'signin' ? handleSignIn : handleSendMagicLink}
              disabled={loading || !email.trim() || (step === 'signin' && !password)}
              className="w-full py-3.5 rounded-xl bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              {loading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : step === 'signin'
                ? <><span>sign in</span><ArrowRight className="w-4 h-4" /></>
                : <><span>send sign-in link</span><ArrowRight className="w-4 h-4" /></>}
            </button>

            {step === 'signin' ? (
              <div className="flex justify-between text-sm">
                <button
                  onClick={() => { setStep('create'); clearError(); setPassword(''); }}
                  className="text-slate-500 hover:text-slate-300 transition-colors"
                >
                  new here? create account
                </button>
                <button
                  onClick={handleForgotPassword}
                  className="text-slate-500 hover:text-slate-300 transition-colors"
                >
                  forgot password?
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setStep('signin'); clearError(); }}
                className="w-full text-sm text-slate-500 hover:text-slate-300 transition-colors py-1"
              >
                already have an account? sign in
              </button>
            )}
          </div>
        )}

        {step === 'sent' && (
          <div className="space-y-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center mx-auto">
              <MailCheck className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-100 mb-1">check your inbox</h2>
              <p className="text-sm text-slate-400">
                sent a sign-in link to <span className="text-slate-200">{email}</span>.<br />
                click it to create your account.
              </p>
            </div>
            <button onClick={reset} className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
              use a different email
            </button>
          </div>
        )}

        {step === 'reset_sent' && (
          <div className="space-y-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center mx-auto">
              <MailCheck className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-100 mb-1">check your inbox</h2>
              <p className="text-sm text-slate-400">
                sent a password reset link to <span className="text-slate-200">{email}</span>.
              </p>
            </div>
            <button onClick={reset} className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
              back to sign in
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
