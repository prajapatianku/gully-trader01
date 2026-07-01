'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, ShieldAlert, RefreshCw } from 'lucide-react';
import { db } from '../../lib/supabase';
import { Profile } from '../../lib/types';
import Navbar from '../../components/layout/Navbar';
import AdminPanel from '../../components/admin/AdminPanel';

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAdmin() {
      try {
        const u = await db.auth.getCurrentUser();
        if (!u) {
          router.push('/auth');
          return;
        }
        setUser(u);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    checkAdmin();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-[#080c14] text-white">
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-xs text-slate-500">
          Validating authorization credentials...
        </div>
      </div>
    );
  }

  const isUserAdmin = user?.is_admin === true;

  return (
    <div className="flex min-h-screen flex-col bg-[#080c14]">
      <Navbar />

      <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
          <Shield className="h-5 w-5 text-purple-400" />
          <div>
            <h1 className="text-lg font-bold text-white uppercase tracking-tight">Admin Console</h1>
            <p className="text-[10px] text-slate-500">Platform statistics audit dashboard.</p>
          </div>
        </div>

        {isUserAdmin ? (
          <AdminPanel />
        ) : (
          <div className="rounded-xl border border-red-500/20 bg-red-650/5 p-8 max-w-md mx-auto text-center space-y-4 my-12 shadow-2xl glow-danger">
            <ShieldAlert className="h-12 w-12 text-red-500 mx-auto pulse-glow-dot" />
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-white uppercase">Access Denied</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Your account (<span className="text-blue-400 font-semibold">{user?.email}</span>) does not have administrative permissions on this node.
              </p>
            </div>
            
            <div className="pt-2 border-t border-slate-800 flex flex-col gap-2">
              <button
                onClick={async () => {
                  await db.auth.login('admin@gullytrader.in', true);
                  window.location.reload();
                }}
                className="w-full rounded bg-purple-600 py-2.5 text-xs font-bold text-white hover:bg-purple-700 transition-colors shadow-md"
              >
                Log in as Admin (Mock Switch)
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full rounded border border-slate-850 py-2.5 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
