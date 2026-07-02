'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TrendingUp, Mail, Lock, AlertCircle, Sparkles } from 'lucide-react';
import { db } from '../../lib/supabase';

export default function AuthPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const targetEmail = email.trim();
    if (!targetEmail || !password) {
      setError('Please enter both email and password.');
      setLoading(false);
      return;
    }

    try {
      // Check if Env variables exist for live connection
      const isLive = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
      
      if (isLive) {
        if (isSignUp) {
          await db.auth.signUp(targetEmail, password);
        } else {
          await db.auth.signIn(targetEmail, password);
        }
      } else {
        // Fallback to local storage mock profile
        const isAdmin = targetEmail === 'admin@gullytrader.in';
        await db.auth.login(targetEmail, isAdmin);
      }
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await db.auth.signInWithGoogle();
      const isLive = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
      if (!isLive) {
        // Direct local storage bypass redirect
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Google Sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-[#080c14] py-12 sm:px-6 lg:px-8">
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-teal-400 font-bold text-white shadow-lg shadow-blue-500/20">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-white leading-tight">
          Welcome to Gully Trader
        </h2>
        <p className="mt-2 text-center text-xs text-slate-500">
          {isSignUp ? 'Create your trading profile' : 'Enter credentials or connect using Google to log your trades'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="rounded-xl border border-slate-800 bg-[#0f172a]/80 p-8 shadow-2xl backdrop-blur-md glow-primary space-y-6">
          
          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-650/10 p-3.5 text-xs text-red-400 flex items-center gap-2">
              <AlertCircle className="h-4.5 w-4.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="trader@gullytrader.in"
                  className="w-full rounded-lg border border-slate-800 bg-[#080c14] pl-10 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-slate-800 bg-[#080c14] pl-10 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 py-3 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/15"
            >
              {loading ? 'Authenticating...' : isSignUp ? 'Sign Up' : 'Sign In'}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
              >
                {isSignUp ? 'Already have an account? Sign In' : "Don't have an account yet? Create one here"}
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-slate-800" />
            <span className="absolute bg-[#0f172a] px-3 text-[10px] uppercase font-bold text-slate-500">Or continue with</span>
          </div>

          {/* Google Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full rounded-lg border border-slate-800 bg-slate-900/50 py-3 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            Google Identity Provider
          </button>

          {/* Setup tips */}
          <div className="flex gap-2 text-[10px] text-slate-400 bg-slate-900/40 p-3 rounded-lg border border-slate-850">
            <Sparkles className="h-4.5 w-4.5 text-teal-400 shrink-0 pulse-glow-dot" />
            <div>
              <p className="font-semibold text-slate-300">Evaluating Gully Trader?</p>
              <p className="mt-0.5">Simply enter any email/password and click Sign In. If connected to Supabase, sign up first by clicking the toggle button.</p>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
