'use client';

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  ShieldAlert, 
  RefreshCw, 
  X, 
  Check, 
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { Trade } from '../../lib/types';
import { db } from '../../lib/supabase';

interface OpenPositionsDeskProps {
  trades: Trade[];
  currency: 'INR' | 'USD';
  onRefresh: () => void;
}

export default function OpenPositionsDesk({ trades, currency, onRefresh }: OpenPositionsDeskProps) {
  const currencySymbol = currency === 'INR' ? '₹' : '$';

  // 1. Filter open manual trades (Imported trades NEVER appear in open positions)
  const openTrades = trades.filter(t => t.status === 'OPEN' && t.source !== 'csv_import');

  // State for simulated live prices
  const [livePrices, setLivePrices] = useState<{ [id: string]: number }>({});
  const [priceDirections, setPriceDirections] = useState<{ [id: string]: 'up' | 'down' | 'neutral' }>({});
  
  // State for closing position modal/form
  const [closingTradeId, setClosingTradeId] = useState<string | null>(null);
  const [exitPriceInput, setExitPriceInput] = useState<string>('');
  const [isSubmittingClose, setIsSubmittingClose] = useState(false);

  // Initialize live prices close to entry prices
  useEffect(() => {
    const initialPrices: { [id: string]: number } = { ...livePrices };
    const initialDirs: { [id: string]: 'up' | 'down' | 'neutral' } = { ...priceDirections };
    
    let updated = false;
    openTrades.forEach(t => {
      if (!initialPrices[t.id]) {
        // start with entry price or entry price offset slightly
        initialPrices[t.id] = t.entry_price;
        initialDirs[t.id] = 'neutral';
        updated = true;
      }
    });

    if (updated) {
      setLivePrices(initialPrices);
      setPriceDirections(initialDirs);
    }
  }, [openTrades]);

  // Tick prices every 3 seconds to simulate active fluctuations
  useEffect(() => {
    if (openTrades.length === 0) return;

    const interval = setInterval(() => {
      setLivePrices(prev => {
        const nextPrices = { ...prev };
        const nextDirs: { [id: string]: 'up' | 'down' | 'neutral' } = {};

        openTrades.forEach(t => {
          const currentPrice = prev[t.id] || t.entry_price;
          // Random walk between -0.3% and +0.3%
          const percentageChange = (Math.random() - 0.5) * 0.006; 
          const newPrice = Number((currentPrice * (1 + percentageChange)).toFixed(2));
          
          nextPrices[t.id] = newPrice;
          nextDirs[t.id] = newPrice > currentPrice ? 'up' : newPrice < currentPrice ? 'down' : 'neutral';
        });

        setPriceDirections(nextDirs);
        return nextPrices;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [openTrades]);

  if (openTrades.length === 0) {
    return (
      <div className="rounded-xl border border-slate-850 bg-slate-900/10 p-6 text-center space-y-2.5">
        <Activity className="h-7 w-7 text-slate-700 mx-auto" />
        <h3 className="text-xs font-bold text-slate-400">No Open Manual Positions</h3>
        <p className="text-[10px] text-slate-500 max-w-xs mx-auto">Active exposures entered manually are monitored here in real-time. Imported trades are automatically marked as completed.</p>
      </div>
    );
  }

  // Calculate Exposure & Unrealized metrics
  let totalExposure = 0;
  let totalUnrealizedPnL = 0;
  let longExposure = 0;
  let shortExposure = 0;

  openTrades.forEach(t => {
    const currentPrice = livePrices[t.id] || t.entry_price;
    const size = t.quantity * t.entry_price;
    totalExposure += size;

    if (t.direction === 'LONG') {
      longExposure += size;
      totalUnrealizedPnL += (currentPrice - t.entry_price) * t.quantity;
    } else {
      shortExposure += size;
      totalUnrealizedPnL += (t.entry_price - currentPrice) * t.quantity;
    }
  });

  const longPercent = totalExposure > 0 ? (longExposure / totalExposure) * 100 : 0;
  const shortPercent = totalExposure > 0 ? (shortExposure / totalExposure) * 100 : 0;

  // Handle position exit / closing
  const handleOpenCloseModal = (tradeId: string, currentLivePrice: number) => {
    setClosingTradeId(tradeId);
    setExitPriceInput(String(currentLivePrice));
  };

  const handleClosePositionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!closingTradeId || !exitPriceInput) return;
    
    setIsSubmittingClose(true);
    try {
      const exitPrice = Number(exitPriceInput);
      if (isNaN(exitPrice) || exitPrice <= 0) {
        alert('Please enter a valid exit price.');
        setIsSubmittingClose(false);
        return;
      }

      await db.trades.update(closingTradeId, {
        exit_price: exitPrice,
        exit_time: new Date().toISOString(),
        status: 'CLOSED'
      });

      setClosingTradeId(null);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to close position.');
    } finally {
      setIsSubmittingClose(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Open Desk Metrics Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        
        {/* Unrealized P&L Card */}
        <div className="relative rounded-xl border border-slate-800 bg-[#0c1220]/60 p-4 shadow-md backdrop-blur-sm overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Unrealized P&L (Live)</span>
            <div className={`p-1 rounded bg-slate-900 ${totalUnrealizedPnL >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              <Activity className="h-3.5 w-3.5 animate-pulse" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className={`text-xl font-black tracking-tight ${totalUnrealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
              {totalUnrealizedPnL >= 0 ? '+' : ''}{currencySymbol}{totalUnrealizedPnL.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-[9px] text-slate-500 mt-1">Fluctuating in real-time based on active ticks.</p>
        </div>

        {/* Total Capital Exposure Card */}
        <div className="rounded-xl border border-slate-800 bg-[#0c1220]/60 p-4 shadow-md backdrop-blur-sm">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Exposure Size</span>
            <div className="p-1 rounded bg-slate-900 text-blue-500">
              <DollarSign className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-xl font-black text-white tracking-tight">
              {currencySymbol}{totalExposure.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-[9px] text-slate-500 mt-1">{openTrades.length} Active Positions Under Monitor.</p>
        </div>

        {/* Exposure Distribution Card */}
        <div className="rounded-xl border border-slate-800 bg-[#0c1220]/60 p-4 shadow-md backdrop-blur-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Long vs Short Exposure</span>
            <ShieldAlert className="h-4 w-4 text-orange-400" />
          </div>
          <div className="mt-2 space-y-1.5">
            <div className="flex justify-between text-[9px] font-semibold text-slate-400">
              <span>LONG ({longPercent.toFixed(0)}%)</span>
              <span>SHORT ({shortPercent.toFixed(0)}%)</span>
            </div>
            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden flex">
              <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${longPercent}%` }} />
              <div className="bg-rose-500 h-full transition-all duration-500" style={{ width: `${shortPercent}%` }} />
            </div>
          </div>
        </div>

      </div>

      {/* 2. Open Positions Table */}
      <div className="rounded-xl border border-slate-800 bg-[#0c1220]/20 backdrop-blur-sm overflow-x-auto">
        <div className="border-b border-slate-850 px-4 py-3 flex justify-between items-center bg-[#0c1220]/40">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Active Open Monitor</h3>
          </div>
          <span className="text-[9px] text-slate-500 bg-slate-900/60 px-2 py-0.5 rounded font-mono">Real-time simulation active</span>
        </div>

        <table className="w-full text-left text-xs text-slate-400">
          <thead className="bg-[#0c1220]/40 text-[9px] uppercase font-bold text-slate-500 border-b border-slate-850">
            <tr>
              <th className="px-4 py-2.5">Date</th>
              <th className="px-4 py-2.5">Symbol</th>
              <th className="px-4 py-2.5">Dir</th>
              <th className="px-4 py-2.5 text-right">Entry Price</th>
              <th className="px-4 py-2.5 text-right">Qty</th>
              <th className="px-4 py-2.5 text-right">Live Price</th>
              <th className="px-4 py-2.5 text-right">SL / Tgt</th>
              <th className="px-4 py-2.5 text-right">Unrealized P&L</th>
              <th className="px-4 py-2.5 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-850/60">
            {openTrades.map(t => {
              const livePrice = livePrices[t.id] || t.entry_price;
              const priceDirection = priceDirections[t.id] || 'neutral';
              
              let uPnL = 0;
              if (t.direction === 'LONG') {
                uPnL = (livePrice - t.entry_price) * t.quantity;
              } else {
                uPnL = (t.entry_price - livePrice) * t.quantity;
              }

              return (
                <tr key={t.id} className="hover:bg-slate-900/10 transition-colors">
                  <td className="px-4 py-3 font-medium whitespace-nowrap">{t.trade_date}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="font-bold text-slate-200 uppercase">{t.symbol}</div>
                    <div className="text-[9px] text-slate-500">{t.segment} / {t.exchange}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-sm px-1.5 py-0.5 text-[9px] font-bold ${
                      t.direction === 'LONG' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-500'
                    }`}>
                      {t.direction}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-slate-300">
                    {currencySymbol}{t.entry_price.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-slate-400">{t.quantity}</td>
                  <td className="px-4 py-3 text-right font-mono whitespace-nowrap">
                    <span className={`rounded px-1.5 py-0.5 font-bold transition-all duration-300 ${
                      priceDirection === 'up' 
                        ? 'bg-emerald-500/10 text-emerald-400 shadow-sm shadow-emerald-500/15' 
                        : priceDirection === 'down' 
                        ? 'bg-rose-500/10 text-rose-455 shadow-sm shadow-rose-500/15' 
                        : 'text-slate-300'
                    }`}>
                      {currencySymbol}{livePrice.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-[10px] text-slate-500 whitespace-nowrap">
                    <div>{t.stop_loss ? `SL: ${t.stop_loss.toFixed(1)}` : 'SL: -'}</div>
                    <div>{t.target ? `Tgt: ${t.target.toFixed(1)}` : 'Tgt: -'}</div>
                  </td>
                  <td className={`px-4 py-3 text-right font-bold whitespace-nowrap ${uPnL >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                    {uPnL >= 0 ? '+' : ''}{currencySymbol}{uPnL.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    {closingTradeId === t.id ? (
                      <form onSubmit={handleClosePositionSubmit} className="flex items-center gap-1 justify-center">
                        <input
                          type="text"
                          value={exitPriceInput}
                          onChange={(e) => setExitPriceInput(e.target.value)}
                          className="w-16 bg-slate-900 border border-slate-700 text-slate-200 text-[10px] px-1 py-0.5 rounded text-right focus:outline-none"
                          placeholder="Price"
                          required
                          disabled={isSubmittingClose}
                        />
                        <button
                          type="submit"
                          className="p-1 text-emerald-400 hover:bg-slate-800 rounded"
                          title="Save Close Price"
                          disabled={isSubmittingClose}
                        >
                          <Check className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setClosingTradeId(null)}
                          className="p-1 text-slate-500 hover:bg-slate-800 rounded"
                          title="Cancel"
                          disabled={isSubmittingClose}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </form>
                    ) : (
                      <button
                        onClick={() => handleOpenCloseModal(t.id, livePrice)}
                        className="rounded bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 font-bold px-2 py-1 text-[9px] transition-all"
                      >
                        Close Position
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
}
