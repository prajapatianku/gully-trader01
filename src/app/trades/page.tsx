'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  History, 
  Plus, 
  Upload, 
  Trash2, 
  Edit, 
  Search, 
  Filter,
  RefreshCw,
  Eye,
  Check,
  Lock,
  Layers
} from 'lucide-react';
import { db } from '../../lib/supabase';
import { Trade, Journal, Strategy, Profile } from '../../lib/types';
import Navbar from '../../components/layout/Navbar';
import TradeForm from '../../components/trades/TradeForm';
import CSVImporter from '../../components/trades/CSVImporter';

export default function TradesPage() {
  const router = useRouter();
  const [user, setUser] = useState<Profile | null>(null);
  
  const [trades, setTrades] = useState<Trade[]>([]);
  const [journals, setJournals] = useState<Journal[]>([]);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Triggers
  const [showManualForm, setShowManualForm] = useState(false);
  const [showCSVWizard, setShowCSVWizard] = useState(false);
  const [tradeToEdit, setTradeToEdit] = useState<Trade | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJournalId, setSelectedJournalId] = useState('all');
  const [selectedSegment, setSelectedSegment] = useState('all');

  const loadAllData = async () => {
    try {
      const u = await db.auth.getCurrentUser();
      if (!u) {
        router.push('/auth');
        return;
      }
      setUser(u);

      const jList = await db.journals.list(u.id);
      const sList = await db.strategies.list(u.id);
      const tList = await db.trades.list(u.id);

      setJournals(jList);
      setStrategies(sList);
      setTrades(tList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [router]);

  const handleDeleteTrade = async (id: string) => {
    if (!confirm('Are you sure you want to delete this trade record permanently?')) return;
    try {
      await db.trades.delete(id);
      setTrades(trades.filter(t => t.id !== id));
    } catch (err) {
      alert('Error deleting trade');
    }
  };

  const handleDeleteBatch = async (batchId: string | null | undefined) => {
    if (!batchId) return;
    if (!confirm('Are you sure you want to delete ALL trades imported in this file batch? This action cannot be undone.')) return;
    try {
      setLoading(true);
      await db.trades.deleteBatch(batchId);
      setTrades(trades.filter(t => t.batch_id !== batchId));
    } catch (err) {
      alert('Error deleting import batch');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (trade: Trade) => {
    setTradeToEdit(trade);
    setShowManualForm(true);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-[#080c14] text-white">
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-xs text-slate-500">
          Loading trades ledger...
        </div>
      </div>
    );
  }

  // Filter Trades
  const filteredTrades = trades.filter(t => {
    const matchesSearch = t.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesJournal = selectedJournalId === 'all' || t.journal_id === selectedJournalId;
    const matchesSegment = selectedSegment === 'all' || t.segment === selectedSegment;

    return matchesSearch && matchesJournal && matchesSegment;
  });

  return (
    <div className="flex min-h-screen flex-col bg-[#080c14]">
      <Navbar />

      <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Actions header bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-blue-500" />
            <div>
              <h1 className="text-lg font-bold text-white uppercase tracking-tight">Trade Ledger Logs</h1>
              <p className="text-[10px] text-slate-500">Review, search, manually enter, or import files.</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              onClick={() => {
                setTradeToEdit(null);
                setShowManualForm(true);
              }}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/10"
            >
              <Plus className="h-4 w-4" />
              Manual Trade
            </button>

            <button
              onClick={() => setShowCSVWizard(true)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-lg border border-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <Upload className="h-4 w-4" />
              CSV Import
            </button>
          </div>
        </div>

        {/* Filter Ribbon */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4 bg-slate-900/10 p-4 rounded-xl border border-slate-800/80">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by Symbol, tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-[#080c14] pl-9 pr-3.5 py-1.5 text-xs text-slate-200 focus:outline-none"
            />
          </div>

          <div className="relative">
            <select
              value={selectedJournalId}
              onChange={(e) => setSelectedJournalId(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-[#080c14] px-3.5 py-2 text-xs text-slate-300 focus:outline-none"
            >
              <option value="all">All Journals</option>
              {journals.map(j => (
                <option key={j.id} value={j.id}>{j.name}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <select
              value={selectedSegment}
              onChange={(e) => setSelectedSegment(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-[#080c14] px-3.5 py-2 text-xs text-slate-300 focus:outline-none"
            >
              <option value="all">All Segments</option>
              <option value="Equity">Equity</option>
              <option value="Futures">Futures</option>
              <option value="Options">Options</option>
              <option value="Spot">Spot (Crypto/FX)</option>
            </select>
          </div>

          <div className="flex justify-end items-center">
            <button
              onClick={loadAllData}
              className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-300 uppercase font-bold"
            >
              <RefreshCw className="h-3 w-3" />
              Refresh
            </button>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/30 overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-400">
            <thead className="bg-[#0f172a] text-[10px] uppercase font-bold text-slate-500 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Symbol</th>
                <th className="px-4 py-3">Dir</th>
                <th className="px-4 py-3 text-right">Entry</th>
                <th className="px-4 py-3 text-right">Exit</th>
                <th className="px-4 py-3 text-right">Qty</th>
                <th className="px-4 py-3 text-right">Charges</th>
                <th className="px-4 py-3 text-right">Net P&L</th>
                <th className="px-4 py-3">Strategy</th>
                <th className="px-4 py-3">Tags</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {filteredTrades.map((t) => {
                const journal = journals.find(j => j.id === t.journal_id);
                const curSym = journal?.base_currency === 'INR' ? '₹' : '$';

                return (
                  <tr key={t.id} className="hover:bg-slate-900/20 group">
                    <td className="px-4 py-3 font-medium whitespace-nowrap">{t.trade_date}</td>
                    <td className="px-4 py-3 font-bold text-slate-200 uppercase whitespace-nowrap">{t.symbol}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-sm px-1.5 py-0.5 text-[9px] font-bold ${
                        t.direction === 'LONG' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-500'
                      }`}>
                        {t.direction}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{t.entry_price.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-medium">
                      {t.status === 'OPEN' ? (
                        <span className="text-[10px] bg-blue-500/10 text-blue-400 px-1 rounded uppercase font-bold tracking-wider">OPEN</span>
                      ) : t.exit_price?.toFixed(2) || '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-300">{t.quantity}</td>
                    <td className="px-4 py-3 text-right">{curSym}{t.total_charges.toFixed(2)}</td>
                    <td className={`px-4 py-3 text-right font-bold ${
                      t.status === 'OPEN' ? 'text-slate-400' : t.net_pnl >= 0 ? 'text-emerald-400' : 'text-rose-500'
                    }`}>
                      {t.status === 'OPEN' ? '0.00' : `${t.net_pnl >= 0 ? '+' : ''}${t.net_pnl.toFixed(2)}`}
                    </td>
                    <td className="px-4 py-3 text-slate-400 max-w-[120px] truncate">{t.strategy_name || 'Discretionary'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1 max-w-[150px]">
                        {t.tags?.map(tag => (
                          <span key={tag} className="rounded bg-slate-800 text-slate-400 px-1.5 py-0.5 text-[9px] font-semibold">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {t.source !== 'csv_import' ? (
                          <button
                            onClick={() => handleEditClick(t)}
                            className="p-1 rounded text-slate-500 hover:bg-slate-800 hover:text-blue-400 transition-colors"
                            title="Edit Trade"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <span className="p-1 text-slate-700 cursor-not-allowed" title="Imported trades cannot be edited">
                            <Lock className="h-3.5 w-3.5" />
                          </span>
                        )}
                        <button
                          onClick={() => handleDeleteTrade(t.id)}
                          className="p-1 rounded text-slate-500 hover:bg-slate-800 hover:text-rose-450 transition-colors"
                          title="Delete Permanently"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        {t.batch_id && (
                          <button
                            onClick={() => handleDeleteBatch(t.batch_id)}
                            className="p-1 rounded text-slate-500 hover:bg-slate-800 hover:text-orange-400 transition-colors"
                            title="Delete entire import batch"
                          >
                            <Layers className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredTrades.length === 0 && (
                <tr>
                  <td colSpan={11} className="text-center py-10 text-xs text-slate-500">
                    No matching trades logged in ledger. Click "Manual Trade" or "CSV Import" to start.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </main>

      {/* Manual form modal */}
      {showManualForm && user && (
        <TradeForm
          userId={user.id}
          journals={journals}
          strategies={strategies}
          tradeToEdit={tradeToEdit}
          onClose={() => {
            setShowManualForm(false);
            setTradeToEdit(null);
          }}
          onSave={loadAllData}
        />
      )}

      {/* CSV Import modal */}
      {showCSVWizard && user && (
        <CSVImporter
          userId={user.id}
          journals={journals}
          onImportComplete={loadAllData}
          onClose={() => setShowCSVWizard(false)}
        />
      )}
    </div>
  );
}
