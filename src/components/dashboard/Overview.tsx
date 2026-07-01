'use client';

import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Percent, 
  Scale, 
  DollarSign, 
  CreditCard,
  Briefcase,
  AlertTriangle
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

  closedTrades.forEach(t => {
    netProfit += t.net_pnl;
    brokeragePaid += t.brokerage;
    taxesPaid += (t.stt + t.gst + t.exchange_charges + t.stamp_duty + t.sebi_charges);

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

  // Max Drawdown calculation based on trade sequence
  let peak = 0;
  let currentRunningEquity = 0;
  let maxDrawdownVal = 0;

  // Sort trades chronologically to build equity curve
  const chronoTrades = [...closedTrades].sort((a, b) => new Date(a.trade_date).getTime() - new Date(b.trade_date).getTime());
  
  chronoTrades.forEach(t => {
    currentRunningEquity += t.net_pnl;
    if (currentRunningEquity > peak) {
      peak = currentRunningEquity;
    }
    const drawdown = peak - currentRunningEquity;
    if (drawdown > maxDrawdownVal) {
      maxDrawdownVal = drawdown;
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

  const metrics = [
    {
      name: 'Net Profit/Loss',
      value: formatValue(netProfit),
      description: 'After commissions and charges',
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
      color: profitFactor >= 1.5 ? 'text-emerald-400' : profitFactor >= 1.0 ? 'text-amber-400' : 'text-rose-400',
      bgColor: 'bg-slate-800/60',
      glow: ''
    },
    {
      name: 'Max Drawdown',
      value: formatValue(maxDrawdownVal),
      description: 'Peak-to-trough decline',
      icon: AlertTriangle,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      glow: ''
    },
    {
      name: 'Total Trades',
      value: totalTradesCount.toString(),
      description: 'Closed trade setups logged',
      icon: Briefcase,
      color: 'text-slate-200',
      bgColor: 'bg-slate-800/60',
      glow: ''
    },
    {
      name: 'Avg Winner / Loser',
      value: `${formatValue(avgWinner)} / ${formatValue(avgLoser)}`,
      description: `Win avg: ${currencySymbol}${Math.round(avgWinner)}`,
      icon: DollarSign,
      color: 'text-slate-300',
      bgColor: 'bg-slate-800/60',
      glow: ''
    },
    {
      name: 'Brokerage Paid',
      value: formatValue(brokeragePaid),
      description: 'Direct flat rate broker charges',
      icon: CreditCard,
      color: 'text-slate-400',
      bgColor: 'bg-slate-800/40',
      glow: ''
    },
    {
      name: 'Taxes & Other Charges',
      value: formatValue(taxesPaid),
      description: 'STT, GST, Stamp Duty, Exchange',
      icon: CreditCard,
      color: 'text-slate-400',
      bgColor: 'bg-slate-800/40',
      glow: ''
    }
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric, i) => (
        <div
          key={i}
          className={`relative overflow-hidden rounded-xl border border-slate-800/80 bg-slate-900/50 p-5 backdrop-blur-md transition-all duration-300 hover:border-slate-700/60 ${metric.glow}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {metric.name}
            </span>
            <div className={`rounded-lg p-1.5 ${metric.bgColor} ${metric.color}`}>
              <metric.icon className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className={`text-2xl font-bold tracking-tight ${metric.color}`}>
              {metric.value}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              {metric.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
