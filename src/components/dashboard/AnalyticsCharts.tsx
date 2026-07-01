'use client';

import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Trade } from '../../lib/types';

interface ChartsProps {
  trades: Trade[];
  currency: 'INR' | 'USD';
}

export default function AnalyticsCharts({ trades, currency }: ChartsProps) {
  const [activeTab, setActiveTab] = useState<'equity' | 'strategies' | 'symbols' | 'charges' | 'direction'>('equity');
  const currencySymbol = currency === 'INR' ? '₹' : '$';

  // Process closed trades chronologically
  const closedTrades = [...trades]
    .filter(t => t.status === 'CLOSED')
    .sort((a, b) => new Date(a.trade_date).getTime() - new Date(b.trade_date).getTime());

  // 1. Equity & Drawdown Curve Data
  let runningEquity = 0;
  let peak = 0;
  const equityData = closedTrades.map((t, idx) => {
    runningEquity += t.net_pnl;
    if (runningEquity > peak) peak = runningEquity;
    const drawdown = peak - runningEquity;

    return {
      index: idx + 1,
      date: t.trade_date,
      symbol: t.symbol,
      pnl: Number(t.net_pnl.toFixed(2)),
      equity: Number(runningEquity.toFixed(2)),
      drawdown: Number(drawdown.toFixed(2))
    };
  });

  // 2. Strategy Performance Data
  const strategyMap: { [key: string]: { name: string; pnl: number; win: number; loss: number } } = {};
  closedTrades.forEach(t => {
    const stratName = t.strategy_name || 'No Strategy';
    if (!strategyMap[stratName]) {
      strategyMap[stratName] = { name: stratName, pnl: 0, win: 0, loss: 0 };
    }
    strategyMap[stratName].pnl += t.net_pnl;
    if (t.net_pnl > 0) {
      strategyMap[stratName].win += t.net_pnl;
    } else {
      strategyMap[stratName].loss += Math.abs(t.net_pnl);
    }
  });
  const strategyData = Object.values(strategyMap).map(s => ({
    ...s,
    pnl: Number(s.pnl.toFixed(2)),
    win: Number(s.win.toFixed(2)),
    loss: Number(s.loss.toFixed(2))
  }));

  // 3. Symbol Performance Data (top 8 symbols)
  const symbolMap: { [key: string]: number } = {};
  closedTrades.forEach(t => {
    if (!symbolMap[t.symbol]) symbolMap[t.symbol] = 0;
    symbolMap[t.symbol] += t.net_pnl;
  });
  const symbolData = Object.entries(symbolMap)
    .map(([name, pnl]) => ({ name, pnl: Number(pnl.toFixed(2)) }))
    .sort((a, b) => b.pnl - a.pnl)
    .slice(0, 8);

  // 4. Directional (Long vs Short) Data
  let longPnl = 0;
  let shortPnl = 0;
  let longCount = 0;
  let shortCount = 0;
  let longWins = 0;
  let shortWins = 0;

  closedTrades.forEach(t => {
    if (t.direction === 'LONG') {
      longPnl += t.net_pnl;
      longCount++;
      if (t.net_pnl > 0) longWins++;
    } else {
      shortPnl += t.net_pnl;
      shortCount++;
      if (t.net_pnl > 0) shortWins++;
    }
  });

  const directionData = [
    {
      name: 'LONG',
      trades: longCount,
      winRate: longCount > 0 ? Number(((longWins / longCount) * 100).toFixed(1)) : 0,
      pnl: Number(longPnl.toFixed(2))
    },
    {
      name: 'SHORT',
      trades: shortCount,
      winRate: shortCount > 0 ? Number(((shortWins / shortCount) * 100).toFixed(1)) : 0,
      pnl: Number(shortPnl.toFixed(2))
    }
  ];

  // 5. Charges Analysis Data
  let totalBrokerage = 0;
  let totalStt = 0;
  let totalGst = 0;
  let totalExChg = 0;
  let totalStamp = 0;
  let totalSebi = 0;

  closedTrades.forEach(t => {
    totalBrokerage += t.brokerage;
    totalStt += t.stt;
    totalGst += t.gst;
    totalExChg += t.exchange_charges;
    totalStamp += t.stamp_duty;
    totalSebi += t.sebi_charges;
  });

  const chargesData = [
    { name: 'Brokerage', value: Number(totalBrokerage.toFixed(2)) },
    { name: 'STT (Securities Tax)', value: Number(totalStt.toFixed(2)) },
    { name: 'GST', value: Number(totalGst.toFixed(2)) },
    { name: 'Exchange Charges', value: Number(totalExChg.toFixed(2)) },
    { name: 'Stamp Duty', value: Number(totalStamp.toFixed(2)) },
    { name: 'SEBI Charges', value: Number(totalSebi.toFixed(2)) }
  ].filter(c => c.value > 0);

  const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#14b8a6', '#ef4444'];

  // Custom tooltips
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-slate-800 bg-[#0f172a] p-3 shadow-xl">
          <p className="text-xs font-semibold text-slate-400">
            {label ? `Trade #${label}` : ''} {payload[0].payload.date || ''}
          </p>
          {payload.map((entry: any, i: number) => (
            <p key={i} className="text-sm font-bold mt-1" style={{ color: entry.color || entry.fill }}>
              {entry.name}: {currencySymbol}{entry.value.toLocaleString('en-IN')}
            </p>
          ))}
          {payload[0].payload.symbol && (
            <p className="text-[10px] text-slate-500 mt-1 uppercase">
              Asset: {payload[0].payload.symbol}
            </p>
          )}
        </div>
      );
    };
    return null;
  };

  const tabs = [
    { id: 'equity', name: 'Equity & Drawdown' },
    { id: 'strategies', name: 'Strategies' },
    { id: 'symbols', name: 'Top Symbols' },
    { id: 'direction', name: 'Long vs Short' },
    { id: 'charges', name: 'Charges Breakdown' }
  ];

  return (
    <div className="rounded-xl border border-slate-800/80 bg-slate-900/30 p-6 backdrop-blur-md">
      {/* Tab Switcher */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-4 gap-4">
        <h3 className="text-lg font-bold text-white tracking-tight">Interactive Analytics</h3>
        <div className="flex overflow-x-auto rounded-lg bg-slate-950 p-1 border border-slate-800/40">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="mt-6 h-80 w-full">
        {closedTrades.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="text-sm text-slate-500">No closed trades available to construct performance charts.</p>
          </div>
        ) : (
          <>
            {activeTab === 'equity' && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={equityData}>
                  <defs>
                    <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                  <XAxis dataKey="index" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `${currencySymbol}${v}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Area
                    type="monotone"
                    dataKey="equity"
                    name="Running Net Capital"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#equityGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="drawdown"
                    name="Drawdown Peak-to-Trough"
                    stroke="#ef4444"
                    strokeWidth={1.5}
                    fillOpacity={1}
                    fill="url(#ddGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}

            {activeTab === 'strategies' && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={strategyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `${currencySymbol}${v}`} />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Legend verticalAlign="top" height={36} />
                  <Bar dataKey="win" name="Gross Gains" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="loss" name="Gross Losses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pnl" name="Net Realized P&L" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}

            {activeTab === 'symbols' && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={symbolData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `${currencySymbol}${v}`} />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Bar 
                    dataKey="pnl" 
                    name="Net Profit" 
                    radius={[4, 4, 0, 0]}
                  >
                    {symbolData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}

            {activeTab === 'direction' && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={directionData} barGap={8}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Legend verticalAlign="top" height={36} />
                  <Bar dataKey="trades" name="Trades Executed" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="winRate" name="Win Rate (%)" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pnl" name="Realized P&L" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}

            {activeTab === 'charges' && (
              <div className="flex h-full flex-col md:flex-row items-center justify-around">
                <div className="h-60 w-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chargesData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {chargesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${currencySymbol}${Number(value).toLocaleString('en-IN')}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  {chargesData.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                      <span className="text-slate-400 font-medium">{item.name}:</span>
                      <span className="text-slate-200 font-bold">{currencySymbol}{item.value.toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                  {chargesData.length === 0 && (
                    <p className="col-span-2 text-slate-500">No trading charges or fees logged yet.</p>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
