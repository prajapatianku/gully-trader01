'use client';

import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  ShieldAlert, 
  DollarSign, 
  AlertOctagon, 
  Check, 
  Briefcase,
  TrendingDown
} from 'lucide-react';
import { Trade } from '../../lib/types';

interface RiskToolsProps {
  trades: Trade[];
  currency: 'INR' | 'USD';
}

export default function RiskTools({ trades, currency }: RiskToolsProps) {
  const currencySymbol = currency === 'INR' ? '₹' : '$';

  // Position Size Calculator state
  const [capital, setCapital] = useState<number>(100000);
  const [riskPct, setRiskPct] = useState<number>(1);
  const [entryPrice, setEntryPrice] = useState<number>(100);
  const [stopLoss, setStopLoss] = useState<number>(95);
  const [multiplier, setMultiplier] = useState<number>(1); // e.g. 15 for Bank Nifty options lot, 50 for Nifty

  // Daily Loss Limit state
  const [dailyLossLimit, setDailyLossLimit] = useState<number>(5000);
  const [todayLoss, setTodayLoss] = useState<number>(0);
  const [limitExceeded, setLimitExceeded] = useState<boolean>(false);

  // Calculate Position Size values
  const riskAmount = (capital * riskPct) / 100;
  const slDifference = Math.abs(entryPrice - stopLoss);
  const rawQuantity = slDifference > 0 ? riskAmount / slDifference : 0;
  const recommendedQuantity = multiplier > 1 
    ? Math.floor(rawQuantity / multiplier) * multiplier 
    : Number(rawQuantity.toFixed(1));
  const totalPositionSize = recommendedQuantity * entryPrice;

  // Intraday loss compliance check
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayTrades = trades.filter(t => t.trade_date === todayStr && t.status === 'CLOSED');
    
    let netToday = 0;
    todayTrades.forEach(t => {
      netToday += t.net_pnl;
    });

    setTodayLoss(netToday < 0 ? Math.abs(netToday) : 0);
    setLimitExceeded(netToday < 0 && Math.abs(netToday) >= dailyLossLimit);
  }, [trades, dailyLossLimit]);

  // Open trades tracking
  const openTrades = trades.filter(t => t.status === 'OPEN');
  const openPositionsRisk = openTrades.reduce((sum, t) => sum + (t.risk_amount || 0), 0);

  return (
    <div className="space-y-6">
      
      {/* Intraday Loss Limit banner */}
      {limitExceeded && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-5 backdrop-blur-md glow-danger flex items-start gap-4">
          <AlertOctagon className="h-8 w-8 text-rose-500 shrink-0 pulse-glow-dot" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Daily Loss Limit Exceeded!</h4>
            <p className="text-xs text-rose-400">
              Your closed realized losses today are {currencySymbol}{todayLoss.toLocaleString('en-IN')}, which exceeds your daily risk throttle threshold of {currencySymbol}{dailyLossLimit.toLocaleString('en-IN')}.
            </p>
            <p className="text-[10px] text-slate-400 font-semibold uppercase pt-2">
              ⚠️ Recommendation: Close terminal immediately. Prevent revenge trading.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        
        {/* Position Size Calculator */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/30 p-6 backdrop-blur-md">
          <h3 className="text-md font-bold text-white tracking-tight flex items-center gap-2 border-b border-slate-800 pb-4">
            <Calculator className="h-5 w-5 text-blue-500" />
            Position Size Calculator
          </h3>

          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Account Balance</label>
                <input
                  type="number"
                  value={capital}
                  onChange={(e) => setCapital(Math.max(0, Number(e.target.value)))}
                  className="w-full rounded border border-slate-800 bg-[#080c14] px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Risk Percent (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={riskPct}
                  onChange={(e) => setRiskPct(Math.max(0, Number(e.target.value)))}
                  className="w-full rounded border border-slate-800 bg-[#080c14] px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Entry Price</label>
                <input
                  type="number"
                  step="any"
                  value={entryPrice}
                  onChange={(e) => setEntryPrice(Math.max(0, Number(e.target.value)))}
                  className="w-full rounded border border-slate-800 bg-[#080c14] px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Stop Loss</label>
                <input
                  type="number"
                  step="any"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(Math.max(0, Number(e.target.value)))}
                  className="w-full rounded border border-slate-800 bg-[#080c14] px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Lot Multiplier</label>
                <input
                  type="number"
                  value={multiplier}
                  onChange={(e) => setMultiplier(Math.max(1, Number(e.target.value)))}
                  className="w-full rounded border border-slate-800 bg-[#080c14] px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
                />
              </div>
            </div>

            {/* Calculations results */}
            <div className="mt-6 rounded-lg bg-slate-950/50 border border-slate-850 p-4 space-y-3.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">Risk Cash Capital:</span>
                <span className="text-slate-200 font-bold">{currencySymbol}{riskAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">Stop Loss Margin:</span>
                <span className="text-slate-200 font-bold">
                  {slDifference.toFixed(2)} ({entryPrice > 0 ? ((slDifference / entryPrice) * 100).toFixed(1) : 0}%)
                </span>
              </div>
              <hr className="border-slate-800/40" />
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400 font-medium">Recommended Quantity:</span>
                <span className="text-lg font-extrabold text-teal-400">{recommendedQuantity.toLocaleString('en-IN')} units</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">Total Margin Required:</span>
                <span className="text-slate-200 font-bold">{currencySymbol}{totalPositionSize.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Intraday Throttle Config & Open trades risk */}
        <div className="space-y-6">
          
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/30 p-6 backdrop-blur-md">
            <h3 className="text-md font-bold text-white tracking-tight flex items-center gap-2 border-b border-slate-800 pb-4">
              <ShieldAlert className="h-5 w-5 text-blue-500" />
              Intraday Loss Safeguards
            </h3>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Max Daily Loss Limit Threshold</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={dailyLossLimit}
                    onChange={(e) => setDailyLossLimit(Math.max(0, Number(e.target.value)))}
                    className="flex-1 rounded border border-slate-800 bg-[#080c14] px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
                  />
                  <div className="rounded bg-slate-800 px-3 py-1.5 text-xs text-slate-400 flex items-center">
                    {currency}
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-3.5 bg-slate-950/40 rounded-lg p-4 border border-slate-850">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Today's Realized Losses:</span>
                  <span className={`font-bold ${todayLoss > 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                    {currencySymbol}{todayLoss.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Remaining Loss Runway:</span>
                  <span className={`font-bold ${dailyLossLimit - todayLoss <= 0 ? 'text-red-500 font-extrabold' : 'text-emerald-400'}`}>
                    {currencySymbol}{Math.max(0, dailyLossLimit - todayLoss).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800/80 bg-slate-900/30 p-6 backdrop-blur-md">
            <h3 className="text-md font-bold text-white tracking-tight flex items-center gap-2 border-b border-slate-800 pb-4">
              <Briefcase className="h-5 w-5 text-blue-500" />
              Open Capital Exposure
            </h3>

            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950/40 rounded-lg p-4 border border-slate-850 text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Open Trades</span>
                  <span className="block text-2xl font-bold text-blue-400 mt-1">{openTrades.length}</span>
                </div>
                <div className="bg-slate-950/40 rounded-lg p-4 border border-slate-850 text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Current Open Risk</span>
                  <span className="block text-2xl font-bold text-amber-500 mt-1">{currencySymbol}{openPositionsRisk.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {openTrades.length > 0 && (
                <div className="max-h-24 overflow-y-auto border border-slate-800 rounded bg-[#080c14]/40 text-[11px]">
                  <table className="w-full text-left text-slate-400">
                    <thead className="bg-slate-900 text-[9px] uppercase font-bold text-slate-500 border-b border-slate-800">
                      <tr>
                        <th className="px-3 py-1">Symbol</th>
                        <th className="px-3 py-1 text-right">Price</th>
                        <th className="px-3 py-1 text-right">SL Risk</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {openTrades.map(t => (
                        <tr key={t.id}>
                          <td className="px-3 py-1 font-semibold text-slate-300 uppercase">{t.symbol}</td>
                          <td className="px-3 py-1 text-right">{t.entry_price.toFixed(2)}</td>
                          <td className="px-3 py-1 text-right text-rose-400">-{currencySymbol}{(t.risk_amount || 0).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
