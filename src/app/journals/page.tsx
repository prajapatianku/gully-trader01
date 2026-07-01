'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FolderPlus, 
  Trash2, 
  RotateCcw, 
  AlertTriangle, 
  Coins, 
  Plus, 
  Folder,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { db } from '../../lib/supabase';
import { Journal, Profile } from '../../lib/types';
import Navbar from '../../components/layout/Navbar';

export default function JournalsPage() {
  const router = useRouter();
  const [user, setUser] = useState<Profile | null>(null);
  
  const [activeJournals, setActiveJournals] = useState<Journal[]>([]);
  const [deletedJournals, setDeletedJournals] = useState<Journal[]>([]);
  const [loading, setLoading] = useState(true);

  // New Journal form state
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');
  const [marketType, setMarketType] = useState('Options');
  const [tradingStyle, setTradingStyle] = useState('Scalping');
  const [startingCapital, setStartingCapital] = useState<number | ''>('');
  const [broker, setBroker] = useState('Zerodha');
  
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    async function loadJournals() {
      try {
        const u = await db.auth.getCurrentUser();
        if (!u) {
          router.push('/auth');
          return;
        }
        setUser(u);

        const active = await db.journals.list(u.id, false);
        const deleted = await db.journals.listDeleted(u.id);

        setActiveJournals(active);
        setDeletedJournals(deleted);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadJournals();
  }, [router]);

  const handleCreateJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name) return;

    try {
      const newJ = await db.journals.create({
        user_id: user.id,
        name: name.trim(),
        base_currency: currency,
        market_type: marketType,
        trading_style: tradingStyle,
        starting_capital: Number(startingCapital) || 0.00,
        default_broker: broker
      });

      setActiveJournals([...activeJournals, newJ]);
      setName('');
      setStartingCapital('');
      setShowAddForm(false);
    } catch (err) {
      alert('Error creating journal');
    }
  };

  const handleSoftDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this journal? It will be soft-deleted and remains recoverable for 30 days.')) return;
    try {
      const deletedJ = await db.journals.softDelete(id);
      setActiveJournals(activeJournals.filter(j => j.id !== id));
      setDeletedJournals([...deletedJournals, deletedJ]);
    } catch (err) {
      alert('Error deleting journal');
    }
  };

  const handleRecover = async (id: string) => {
    try {
      const recoveredJ = await db.journals.recover(id);
      setDeletedJournals(deletedJournals.filter(j => j.id !== id));
      setActiveJournals([...activeJournals, recoveredJ]);
    } catch (err) {
      alert('Error recovering journal');
    }
  };

  const handleHardDelete = async (id: string) => {
    if (!confirm('WARNING: This will permanently delete this journal and all associated trade logs. This action CANNOT be undone!')) return;
    try {
      await db.journals.hardDelete(id);
      setDeletedJournals(deletedJournals.filter(j => j.id !== id));
    } catch (err) {
      alert('Error hard deleting journal');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-[#080c14] text-white">
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-xs text-slate-500">
          Loading configuration...
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#080c14]">
      <Navbar />

      <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Header section */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Folder className="h-5 w-5 text-blue-500" />
            <div>
              <h1 className="text-lg font-bold text-white uppercase tracking-tight">Trading Journal Desks</h1>
              <p className="text-[10px] text-slate-500">Configure separate books for specific styles, segments, or currencies.</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/10"
          >
            <Plus className="h-4 w-4" />
            New Journal
          </button>
        </div>

        {/* Create Form Panel */}
        {showAddForm && (
          <form 
            onSubmit={handleCreateJournal}
            className="rounded-xl border border-slate-800 bg-[#0f172a] p-6 shadow-xl glow-primary space-y-4 max-w-2xl"
          >
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-850 pb-2.5">
              <FolderPlus className="h-4.5 w-4.5 text-blue-500" />
              Configure New Journal Ledger
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Journal Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Bank Nifty Scalping"
                  className="w-full rounded border border-slate-800 bg-[#080c14] px-3.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Base Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as any)}
                  className="w-full rounded border border-slate-800 bg-[#080c14] px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
                >
                  <option value="INR">INR (Rupees ₹)</option>
                  <option value="USD">USD (Dollars $)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Starting Capital *</label>
                <input
                  type="number"
                  required
                  value={startingCapital}
                  onChange={(e) => setStartingCapital(e.target.value !== '' ? Number(e.target.value) : '')}
                  placeholder="e.g. 100000"
                  className="w-full rounded border border-slate-800 bg-[#080c14] px-3.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Market Segment</label>
                <select
                  value={marketType}
                  onChange={(e) => setMarketType(e.target.value)}
                  className="w-full rounded border border-slate-800 bg-[#080c14] px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
                >
                  <option value="Equity">Equity / Stock Cash</option>
                  <option value="Futures">Index Futures</option>
                  <option value="Options">Index Options</option>
                  <option value="Forex">Global Forex Pairs</option>
                  <option value="Crypto">Crypto Spot/Futures</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Trading Style</label>
                <select
                  value={tradingStyle}
                  onChange={(e) => setTradingStyle(e.target.value)}
                  className="w-full rounded border border-slate-800 bg-[#080c14] px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
                >
                  <option value="Scalping">Scalping (Mins)</option>
                  <option value="Day Trading">Intraday (Hours)</option>
                  <option value="Swing">Swing (Days/Weeks)</option>
                  <option value="Positional">Positional (Months)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Default Broker Link</label>
                <select
                  value={broker}
                  onChange={(e) => setBroker(e.target.value)}
                  className="w-full rounded border border-slate-800 bg-[#080c14] px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
                >
                  <option value="Zerodha">Zerodha Kite</option>
                  <option value="Groww">Groww</option>
                  <option value="Fyers">Fyers</option>
                  <option value="Binance">Binance Exchange</option>
                  <option value="OANDA">OANDA</option>
                  <option value="Custom">Other Custom Broker</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="rounded px-4 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded bg-blue-600 px-5 py-1.5 text-xs font-bold text-white hover:bg-blue-700"
              >
                Launch Book
              </button>
            </div>
          </form>
        )}

        {/* Active Journals Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {activeJournals.map((j) => (
            <div 
              key={j.id}
              className="rounded-xl border border-slate-800/80 bg-slate-900/30 p-5 backdrop-blur-md flex flex-col justify-between hover:border-slate-700/60 transition-all hover:translate-y-[-2px] group"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="rounded-lg p-2 bg-blue-500/10 text-blue-400">
                    <Folder className="h-5 w-5" />
                  </div>
                  
                  <button
                    onClick={() => handleSoftDelete(j.id)}
                    className="p-1 rounded text-slate-500 hover:bg-slate-800/40 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                    title="Soft Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-100 uppercase tracking-tight">{j.name}</h3>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-semibold uppercase mt-1">
                    <span>{j.market_type}</span>
                    <span>•</span>
                    <span>{j.trading_style}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-850 flex justify-between items-center text-xs">
                <div>
                  <span className="text-slate-500 font-bold block text-[9px] uppercase">Starting Risk Capital</span>
                  <span className="font-extrabold text-slate-350">{j.base_currency === 'INR' ? '₹' : '$'}{j.starting_capital.toLocaleString('en-IN')}</span>
                </div>

                <button
                  onClick={() => {
                    localStorage.setItem('gully_trader_active_journal', j.id);
                    router.push('/dashboard');
                  }}
                  className="rounded bg-slate-800 px-3 py-1.5 text-[10px] font-bold text-slate-300 hover:bg-slate-700 hover:text-white transition-all flex items-center gap-1"
                >
                  Inspect
                  <ArrowUpRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}

          {activeJournals.length === 0 && (
            <div className="col-span-full rounded-xl border border-slate-850 bg-slate-900/10 p-12 text-center text-xs text-slate-500">
              No active journals logged. Configure one above to begin.
            </div>
          )}
        </div>

        {/* 30-Day Recovery Shelf (only show if deleted journals exist) */}
        {deletedJournals.length > 0 && (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-rose-500/10 pb-3">
              <AlertTriangle className="h-4.5 w-4.5 text-rose-400" />
              <div>
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">30-Day Recovery Shelf</h3>
                <p className="text-[10px] text-slate-500">Journals listed below will be automatically deleted permanently after 30 days.</p>
              </div>
            </div>

            <div className="divide-y divide-rose-500/10">
              {deletedJournals.map((j) => {
                const deletedDate = j.deleted_at ? new Date(j.deleted_at) : new Date();
                const daysRemaining = 30 - Math.ceil((Date.now() - deletedDate.getTime()) / (24 * 60 * 60 * 1000));

                return (
                  <div key={j.id} className="flex justify-between items-center py-3">
                    <div>
                      <span className="text-xs font-bold text-slate-300">{j.name}</span>
                      <span className="block text-[9px] text-rose-400 uppercase mt-0.5">
                        Soft Deleted • {daysRemaining} days left for recovery
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRecover(j.id)}
                        className="rounded bg-slate-800 px-3 py-1.5 text-[10px] font-bold text-emerald-400 hover:bg-slate-700 flex items-center gap-1"
                        title="Recover Journal"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Recover
                      </button>
                      <button
                        onClick={() => handleHardDelete(j.id)}
                        className="rounded bg-red-600/10 text-red-400 hover:bg-red-600 hover:text-white px-3 py-1.5 text-[10px] font-bold"
                        title="Delete Permanently"
                      >
                        Hard Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
