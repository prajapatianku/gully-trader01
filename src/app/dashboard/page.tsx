'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Filter, 
  Calendar, 
  RefreshCw, 
  Folder,
  ArrowUpRight
} from 'lucide-react';
import { db } from '../../lib/supabase';
import { Journal, Trade, Profile } from '../../lib/types';
import Navbar from '../../components/layout/Navbar';
import Overview from '../../components/dashboard/Overview';
import AnalyticsCharts from '../../components/dashboard/AnalyticsCharts';
import CalendarView from '../../components/dashboard/CalendarView';
import OpenPositionsDesk from '../../components/dashboard/OpenPositionsDesk';
import MonthlyHeatmap from '../../components/dashboard/MonthlyHeatmap';

export default function DashboardPage() {
  const router = useRouter();
  
  // App state
  const [user, setUser] = useState<Profile | null>(null);
  const [journals, setJournals] = useState<Journal[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dashboard filters
  const [selectedJournalId, setSelectedJournalId] = useState<string>('global');
  const [timeFilter, setTimeFilter] = useState<'7d' | '30d' | '90d' | '180d' | '365d' | 'custom'>('30d');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const u = await db.auth.getCurrentUser();
        if (!u) {
          router.push('/auth');
          return;
        }
        setUser(u);

        const jList = await db.journals.list(u.id);
        const tList = await db.trades.list(u.id);
        
        setJournals(jList);
        setTrades(tList);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router]);

  const handleRefresh = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const jList = await db.journals.list(user.id);
      const tList = await db.trades.list(user.id);
      setJournals(jList);
      setTrades(tList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-[#080c14] text-white">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-2">
            <RefreshCw className="h-8 w-8 text-blue-500 animate-spin mx-auto" />
            <p className="text-xs text-slate-500">Loading your trading journals...</p>
          </div>
        </div>
      </div>
    );
  }

  // 1. FILTER BY JOURNAL
  let filteredTrades = [...trades];
  if (selectedJournalId !== 'global') {
    filteredTrades = filteredTrades.filter(t => t.journal_id === selectedJournalId);
  }

  // Determine active currency
  const activeJournal = journals.find(j => j.id === selectedJournalId);
  const activeCurrency = activeJournal ? activeJournal.base_currency : 'INR';

  // 2. FILTER BY DATE RANGE
  const now = new Date();
  let filterCutoff = new Date();

  if (timeFilter === '7d') {
    filterCutoff.setDate(now.getDate() - 7);
  } else if (timeFilter === '30d') {
    filterCutoff.setDate(now.getDate() - 30);
  } else if (timeFilter === '90d') {
    filterCutoff.setDate(now.getDate() - 90);
  } else if (timeFilter === '180d') {
    filterCutoff.setDate(now.getDate() - 180);
  } else if (timeFilter === '365d') {
    filterCutoff.setDate(now.getDate() - 365);
  }

  if (timeFilter !== 'custom') {
    filteredTrades = filteredTrades.filter(t => new Date(t.trade_date) >= filterCutoff);
  } else {
    if (startDate) {
      filteredTrades = filteredTrades.filter(t => new Date(t.trade_date) >= new Date(startDate));
    }
    if (endDate) {
      filteredTrades = filteredTrades.filter(t => new Date(t.trade_date) <= new Date(endDate));
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#080c14]">
      <Navbar />

      <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Top Header & Filter Ribbon */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/10 p-4 rounded-xl border border-slate-800/80 backdrop-blur-sm">
          <div className="flex items-center gap-2.5">
            <LayoutDashboard className="h-5 w-5 text-blue-500" />
            <div>
              <h1 className="text-lg font-bold text-white uppercase tracking-tight">Performance Desk</h1>
              <p className="text-[10px] text-slate-500">Track and review realized ledger statistics.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Journal selector */}
            <div className="flex items-center gap-1 bg-[#080c14] px-2.5 py-1.5 rounded-lg border border-slate-800 text-xs">
              <Folder className="h-3.5 w-3.5 text-blue-400" />
              <select
                value={selectedJournalId}
                onChange={(e) => setSelectedJournalId(e.target.value)}
                className="bg-transparent border-none text-slate-300 font-bold focus:outline-none cursor-pointer"
              >
                <option value="global">All Journals (Global)</option>
                {journals.map(j => (
                  <option key={j.id} value={j.id}>{j.name} ({j.base_currency})</option>
                ))}
              </select>
            </div>

            {/* Time filter selector */}
            <div className="flex items-center gap-1 bg-[#080c14] px-2.5 py-1.5 rounded-lg border border-slate-800 text-xs">
              <Filter className="h-3.5 w-3.5 text-blue-400" />
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value as any)}
                className="bg-transparent border-none text-slate-300 font-bold focus:outline-none cursor-pointer"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last Quarter (90d)</option>
                <option value="180d">Last 6 Months</option>
                <option value="365d">Last Year (365d)</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {/* Custom Dates Inputs */}
            {timeFilter === 'custom' && (
              <div className="flex items-center gap-2 bg-[#080c14] px-2.5 py-1 rounded-lg border border-slate-800 text-[10px]">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent text-slate-300 focus:outline-none"
                />
                <span className="text-slate-650">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-transparent text-slate-300 focus:outline-none"
                />
              </div>
            )}

            <button
              onClick={handleRefresh}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition-all border border-slate-850"
              title="Reload data"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Dashboard Empty state prompt */}
        {journals.length === 0 ? (
          <div className="rounded-xl border border-slate-850 bg-slate-900/10 p-12 text-center max-w-md mx-auto space-y-4 mt-10">
            <Folder className="h-12 w-12 text-slate-700 mx-auto" />
            <h3 className="text-sm font-bold text-slate-300">Welcome to Gully Trader!</h3>
            <p className="text-xs text-slate-500">To start analyzing trading statistics, you must first create a journal folder.</p>
            <Link
              href="/journals"
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition-all shadow-md"
            >
              Create Your First Journal
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <>
            {/* 1. Overview metrics grid */}
            <Overview trades={filteredTrades} currency={activeCurrency} />

            {/* 1.4 Monthly P&L Heatmap Grid */}
            <div className="border-t border-slate-800/80 pt-6">
              <MonthlyHeatmap trades={filteredTrades} currency={activeCurrency} />
            </div>

            {/* 1.5 Live Open Positions & Exposure Desk */}
            <div className="border-t border-slate-800/80 pt-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Live Open Positions & Exposure Desk</h2>
              </div>
              <OpenPositionsDesk 
                trades={trades.filter(t => selectedJournalId === 'global' || t.journal_id === selectedJournalId)} 
                currency={activeCurrency} 
                onRefresh={handleRefresh} 
              />
            </div>

            {/* 2. Analytics charts and Calendar row */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <AnalyticsCharts trades={filteredTrades} currency={activeCurrency} />
              </div>
              <div>
                <CalendarView trades={filteredTrades} currency={activeCurrency} />
              </div>
            </div>
          </>
        )}

      </main>
    </div>
  );
}
