'use client';

import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Percent, 
  Scale, 
  DollarSign, 
  CreditCard,
  AlertTriangle,
  Trophy,
  AlertCircle,
  Flame,
  ZapOff,
  Briefcase
} from 'lucide-react';
import { Trade } from '../../lib/types';

interface OverviewProps {
  trades: Trade[];
  currency: 'INR' | 'USD';
}

export default function Overview({ trades, currency }: OverviewProps) {
  const currencySymbol = currency === 'INR' ? '₹' : '$';

  // Filters closed trades
  const closedTrades = trades.filter(t => t.status === 'CLOSED');
  const totalTradesCount = closedTrades.length;

  let netProfit = 0;
  let grossProfit = 0;
  let grossLoss = 0;
  let winCount = 0;
  let lossCount = 0;
  let brokeragePaid = 0;
  let taxesPaid = 0;
  let largestWinner = 0;
  let largestLoser = 0;

  closedTrades.forEach(t => {
    netProfit += t.net_pnl;
    brokeragePaid += t.brokerage;
    taxesPaid += (t.stt + t.gst + t.exchange_charges + t.stamp_duty + t.sebi_charges);

    if (t.net_pnl > largestWinner) {
      largestWinner = t.net_pnl;
    }
    if (t.net_pnl < largestLoser) {
      largestLoser = t.net_pnl;
    }

    if (t.gross_pnl > 0) {
      grossProfit += t.gross_pnl;
      winCount++;
    } else {
      grossLoss += t.gross_pnl;
      lossCount++;
    }
  });

  const winRate = totalTradesCount > 0 ? (winCount / totalTradesCount) * 100 : 0;
  const profitFactor = Math.abs(grossLoss) > 0 ? grossProfit / Math.abs(grossLoss) : grossProfit > 0 ? 99.9 : 0;
  const avgWinner = winCount > 0 ? grossProfit / winCount : 0;
  const avgLoser = lossCount > 0 ? grossLoss / lossCount : 0;
  const totalCharges = brokeragePaid + taxesPaid;

  // Max Drawdown & Streaks calculation based on trade sequence
  let peak = 0;
  let currentRunningEquity = 0;
  let maxDrawdownVal = 0;

  let maxConsecWins = 0;
  let maxConsecLosses = 0;
  let currentWins = 0;
  let currentLosses = 0;

  // Sort trades chronologically to build equity curve and calculate streaks
  const chronoTrades = [...closedTrades].sort((a, b) => new Date(a.trade_date).getTime() - new Date(b.trade_date).getTime());
  
  chronoTrades.forEach(t => {
    // 1. Drawdown
    currentRunningEquity += t.net_pnl;
    if (currentRunningEquity > peak) {
      peak = currentRunningEquity;
    }
    const drawdown = peak - currentRunningEquity;
    if (drawdown > maxDrawdownVal) {
      maxDrawdownVal = drawdown;
    }

    // 2. Streaks
    if (t.net_pnl > 0) {
      currentWins++;
      currentLosses = 0;
      if (currentWins > maxConsecWins) {
        maxConsecWins = currentWins;
      }
    } else if (t.net_pnl < 0) {
      currentLosses++;
      currentWins = 0;
      if (currentLosses > maxConsecLosses) {
        maxConsecLosses = currentLosses;
      }
    }
  });

  const formatValue = (val: number) => {
    const isNegative = val < 0;
    const absVal = Math.abs(val).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return `${isNegative ? '-' : ''}${currencySymbol}${absVal}`;
  };

  const mainMetrics = [
    {
      name: 'Total Net P&L',
      value: formatValue(netProfit),
      description: 'Total realized return after charges',
      icon: netProfit >= 0 ? TrendingUp : TrendingDown,
      color: netProfit >= 0 ? 'text-emerald-400' : 'text-rose-500',
      bgColor: netProfit >= 0 ? 'bg-emerald-500/10' : 'bg-rose-500/10',
      glow: netProfit >= 0 ? 'glow-success' : 'glow-danger'
    },
    {
      name: 'Win Rate',
      value: `${winRate.toFixed(1)}%`,
      description: `${winCount} Wins / ${lossCount} Losses`,
      icon: Percent,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      glow: 'glow-primary'
    },
    {
      name: 'Profit Factor',
      value: profitFactor.toFixed(2),
      description: 'Gross Profit / Gross Loss ratio',
      icon: Scale,
      color: profitFactor >= 1.5 ? 'text-emerald-400' : profitFactor >= 1.0 ? 'text-amber-450' : 'text-rose-400',
      bgColor: 'bg-slate-800/40',
      glow: ''
    },
    {
      name: 'Max Drawdown',
      value: formatValue(maxDrawdownVal),
      description: 'Peak-to-trough equity decline',
      icon: AlertTriangle,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
      glow: ''
    }
  ];

  const helperMetrics = [
    {
      name: 'Gross Profit',
      value: formatValue(grossProfit),
      description: 'Sum of all winning setups',
      icon: TrendingUp,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10'
    },
    {
      name: 'Gross Loss',
      value: formatValue(grossLoss),
      description: 'Sum of all losing setups',
      icon: TrendingDown,
      color: 'text-rose-500',
      bgColor: 'bg-rose-500/10'
    },
    {
      name: 'Total Charges',
      value: formatValue(totalCharges),
      description: `Brokerage: ${formatValue(brokeragePaid)}`,
      icon: CreditCard,
      color: 'text-slate-400',
      bgColor: 'bg-slate-800/60'
    },
    {
      name: 'Consecutive Wins',
      value: `${maxConsecWins} Trades`,
      description: 'Maximum winning streak',
      icon: Flame,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/15'
    },
    {
      name: 'Consecutive Losses',
      value: `${maxConsecLosses} Trades`,
      description: 'Maximum losing streak',
      icon: ZapOff,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10'
    }
  ];

  const analysisMetrics = [
    {
      name: 'Average Winner',
      value: formatValue(avgWinner),
      description: `Win count: ${winCount}`,
      icon: DollarSign,
      color: 'text-emerald-400',
      bgColor: 'bg-slate-800/40'
    },
    {
      name: 'Average Loser',
      value: formatValue(avgLoser),
      description: `Loss count: ${lossCount}`,
      icon: DollarSign,
      color: 'text-rose-450',
      bgColor: 'bg-slate-800/40'
    },
    {
      name: 'Largest Winner',
      value: formatValue(largestWinner),
      description: 'Single biggest profitable trade',
      icon: Trophy,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10'
    },
    {
      name: 'Largest Loser',
      value: formatValue(largestLoser),
      description: 'Single biggest losing trade',
      icon: AlertCircle,
      color: 'text-rose-600',
      bgColor: 'bg-rose-500/10'
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* Row 1: Primary Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {mainMetrics.map((metric, i) => (
          <div
            key={i}
            className={`relative overflow-hidden rounded-xl border border-slate-800/80 bg-slate-900/50 p-5 backdrop-blur-md transition-all duration-300 hover:border-slate-700/60 ${metric.glow}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {metric.name}
              </span>
              <div className={`rounded-lg p-1.5 ${metric.bgColor} ${metric.color}`}>
                <metric.icon className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className={`text-2xl font-black tracking-tight ${metric.color}`}>
                {metric.value}
              </h3>
              <p className="mt-1 text-[10px] text-slate-500">
                {metric.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Row 2: Secondary & Operational Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {helperMetrics.map((metric, i) => (
          <div
            key={i}
            className="relative overflow-hidden rounded-xl border border-slate-850 bg-slate-900/30 p-4.5 transition-all duration-300 hover:border-slate-800/60"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {metric.name}
              </span>
              <div className={`rounded-lg p-1.5 ${metric.bgColor} ${metric.color}`}>
                <metric.icon className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-3">
              <h4 className={`text-lg font-bold tracking-tight ${metric.color}`}>
                {metric.value}
              </h4>
              <p className="mt-0.5 text-[9px] text-slate-550 leading-tight">
                {metric.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Row 3: Winning & Losing Analysis */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {analysisMetrics.map((metric, i) => (
          <div
            key={i}
            className="relative overflow-hidden rounded-xl border border-slate-850 bg-slate-900/20 p-4 transition-all duration-300 hover:border-slate-800/60"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {metric.name}
              </span>
              <div className={`rounded-lg p-1.5 ${metric.bgColor} ${metric.color}`}>
                <metric.icon className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-3">
              <h4 className={`text-base font-extrabold tracking-tight ${metric.color}`}>
                {metric.value}
              </h4>
              <p className="mt-0.5 text-[9px] text-slate-550">
                {metric.description}
              </p>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
