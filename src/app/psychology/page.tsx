'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Brain, Sparkles, RefreshCw } from 'lucide-react';
import { db } from '../../lib/supabase';
import { Trade, Profile } from '../../lib/types';
import Navbar from '../../components/layout/Navbar';
import RuleBook from '../../components/psychology/RuleBook';

export default function PsychologyPage() {
  const router = useRouter();
  const [user, setUser] = useState<Profile | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const u = await db.auth.getCurrentUser();
        if (!u) {
          router.push('/auth');
          return;
        }
        setUser(u);

        const tList = await db.trades.list(u.id);
        setTrades(tList);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-[#080c14] text-white">
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-xs text-slate-500">
          Loading discipline files...
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#080c14]">
      <Navbar />

      <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
          <Brain className="h-5 w-5 text-blue-500" />
          <div>
            <h1 className="text-lg font-bold text-white uppercase tracking-tight">Psychological Code Desk</h1>
            <p className="text-[10px] text-slate-500">Log rules, audit violations, and score mental discipline.</p>
          </div>
        </div>

        {user && (
          <RuleBook userId={user.id} trades={trades} />
        )}

      </main>
    </div>
  );
}
