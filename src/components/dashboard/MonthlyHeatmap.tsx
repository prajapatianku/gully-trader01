'use client';

import React, { useState } from 'react';
import { Calendar, HelpCircle, Info } from 'lucide-react';
import { Trade } from '../../lib/types';

interface MonthlyHeatmapProps {
  trades: Trade[];
  currency: 'INR' | 'USD';
}

interface MonthlyData {
  pnl: number;
  tradeCount: number;
  wins: number;
  grossProfit: number;
  grossLoss: number;
}

export default function MonthlyHeatmap({ trades, currency }: MonthlyHeatmapProps) {
  const currencySymbol = currency === 'INR' ? '₹' : '$';
  const closedTrades = trades.filter(t => t.status === 'CLOSED');

  // Months labels
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  // State for hover tooltips
  const [hoveredCell, setHoveredCell] = useState<{
    year: number;
    monthIndex: number;
    data: MonthlyData;
    x: number;
    y: number;
  } | null>(null);

  // Group trades by Year and Month
  const heatmapData: { [year: number]: { [month: number]: MonthlyData } } = {};
  const yearsSet = new Set<number>();

  closedTrades.forEach(t => {
    const date = new Date(t.trade_date);
    const y = date.getFullYear();
    const m = date.getMonth(); // 0-11
    
    yearsSet.add(y);

    if (!heatmapData[y]) {
      heatmapData[y] = {};
    }
    if (!heatmapData[y][m]) {
      heatmapData[y][m] = { pnl: 0, tradeCount: 0, wins: 0, grossProfit: 0, grossLoss: 0 };
    }

    const monthCell = heatmapData[y][m];
    monthCell.pnl += t.net_pnl;
    monthCell.tradeCount += 1;
    if (t.net_pnl > 0) {
      monthCell.wins += 1;
      monthCell.grossProfit += t.gross_pnl;
    } else {
      monthCell.grossLoss += t.gross_pnl;
    }
  });

  // Convert unique years to sorted descending array
  const years = Array.from(yearsSet).sort((a, b) => b - a);
  if (years.length === 0) {
    years.push(new Date().getFullYear());
  }

  // Find max absolute P&L to dynamically normalize background color opacities
  let maxAbsPnL = 0;
  Object.values(heatmapData).forEach(yearRow => {
    Object.values(yearRow).forEach(cell => {
      if (Math.abs(cell.pnl) > maxAbsPnL) {
        maxAbsPnL = Math.abs(cell.pnl);
      }
    });
  });

  // Calculate opacity based on P&L size
  const getCellColorStyle = (pnl: number) => {
    if (pnl === 0) return 'bg-slate-900 text-slate-500 border border-slate-850';
    
    const absPnL = Math.abs(pnl);
    // scale opacity between 0.15 and 0.85
    const opacity = maxAbsPnL > 0 
      ? 0.15 + (absPnL / maxAbsPnL) * 0.7 
      : 0.5;

    if (pnl > 0) {
      return {
        backgroundColor: `rgba(16, 185, 129, ${opacity})`, // Emerald-500
        color: opacity > 0.55 ? '#061b11' : '#a7f3d0' // dark text for high opacity, light for low
      };
    } else {
      return {
        backgroundColor: `rgba(239, 68, 68, ${opacity})`, // Red-500
        color: opacity > 0.55 ? '#1f0707' : '#fecaca'
      };
    }
  };

  const handleCellMouseEnter = (e: React.MouseEvent, year: number, monthIndex: number, cellData: MonthlyData | undefined) => {
    const data = cellData || { pnl: 0, tradeCount: 0, wins: 0, grossProfit: 0, grossLoss: 0 };
    const rect = e.currentTarget.getBoundingClientRect();
    
    setHoveredCell({
      year,
      monthIndex,
      data,
      x: rect.left + window.scrollX + rect.width / 2,
      y: rect.top + window.scrollY - 10
    });
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0c1220]/20 p-5 shadow-lg backdrop-blur-sm relative">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="h-4.5 w-4.5 text-blue-500" />
        <div>
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Monthly P&L Heatmap</h3>
          <p className="text-[9px] text-slate-500">Track realization curves month-by-month and year-by-year.</p>
        </div>
      </div>

      {/* Grid container with overflow scroll for mobile responsiveness */}
      <div className="overflow-x-auto w-full scrollbar-thin scrollbar-thumb-slate-800">
        <div className="min-w-[760px] pb-2">
          
          {/* Header Row */}
          <div 
            className="grid gap-1.5 text-center text-[10px] font-bold text-slate-500 uppercase tracking-tight pb-2 border-b border-slate-850"
            style={{ gridTemplateColumns: 'repeat(14, minmax(0, 1fr))' }}
          >
            <div className="text-left font-mono pl-1 text-slate-400">Year</div>
            {monthNames.map(m => (
              <div key={m}>{m}</div>
            ))}
            <div className="text-right pr-2 text-slate-400">Total</div>
          </div>

          {/* Yearly Rows */}
          <div className="space-y-1.5 pt-2">
            {years.map(year => {
              const yearMonths = heatmapData[year] || {};
              let yearlyNetPnL = 0;

              return (
                <div 
                  key={year} 
                  className="grid gap-1.5 items-center text-center font-mono"
                  style={{ gridTemplateColumns: 'repeat(14, minmax(0, 1fr))' }}
                >
                  
                  {/* Year Label */}
                  <div className="text-left text-xs font-bold text-slate-350 select-none pl-1">
                    {year}
                  </div>

                  {/* 12 Months Cells */}
                  {Array.from({ length: 12 }).map((_, mIndex) => {
                    const cellData = yearMonths[mIndex];
                    const pnl = cellData ? cellData.pnl : 0;
                    yearlyNetPnL += pnl;

                    const colorStyle = getCellColorStyle(pnl);
                    const isCustomStyle = typeof colorStyle === 'object';

                    return (
                      <div
                        key={mIndex}
                        onMouseEnter={(e) => handleCellMouseEnter(e, year, mIndex, cellData)}
                        onMouseLeave={() => setHoveredCell(null)}
                        style={isCustomStyle ? colorStyle : undefined}
                        className={`py-2 rounded text-[10px] font-extrabold cursor-pointer transition-all hover:scale-105 select-none ${
                          !isCustomStyle ? colorStyle : ''
                        }`}
                      >
                        {pnl !== 0 
                          ? `${pnl > 0 ? '+' : ''}${Math.round(pnl / 1000)}k` 
                          : '-'
                        }
                      </div>
                    );
                  })}

                  {/* Yearly Total Cell */}
                  <div className={`text-right pr-2 text-[10px] font-black ${
                    yearlyNetPnL > 0 
                      ? 'text-emerald-400' 
                      : yearlyNetPnL < 0 
                      ? 'text-rose-500' 
                      : 'text-slate-500'
                  }`}>
                    {yearlyNetPnL !== 0 
                      ? `${yearlyNetPnL > 0 ? '+' : ''}${yearlyNetPnL.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` 
                      : '-'
                    }
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      </div>

      {/* Dynamic Hover Tooltip Overlay */}
      {hoveredCell && (
        <div 
          className="absolute z-50 p-3 bg-slate-950 border border-slate-800 rounded-lg shadow-xl text-left pointer-events-none w-48 text-[10px] space-y-1 backdrop-blur-md transition-all duration-150"
          style={{
            left: `${hoveredCell.x - 96}px`, // centered
            top: `${hoveredCell.y - 120}px` // slightly above
          }}
        >
          <div className="font-bold text-slate-200 border-b border-slate-800 pb-1 flex justify-between uppercase">
            <span>{monthNames[hoveredCell.monthIndex]} {hoveredCell.year}</span>
            <span className={hoveredCell.data.pnl >= 0 ? 'text-emerald-400' : 'text-rose-500'}>
              {hoveredCell.data.pnl >= 0 ? 'PROFIT' : 'LOSS'}
            </span>
          </div>
          <div className="flex justify-between pt-1">
            <span className="text-slate-500">Net P&L:</span>
            <span className={`font-bold ${hoveredCell.data.pnl >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
              {hoveredCell.data.pnl >= 0 ? '+' : ''}{currencySymbol}{hoveredCell.data.pnl.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Total Trades:</span>
            <span className="font-bold text-slate-350">{hoveredCell.data.tradeCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Win Rate:</span>
            <span className="font-bold text-slate-350">
              {hoveredCell.data.tradeCount > 0 
                ? `${((hoveredCell.data.wins / hoveredCell.data.tradeCount) * 100).toFixed(0)}%` 
                : '0%'
              }
            </span>
          </div>
          <div className="flex justify-between text-[9px] border-t border-slate-900 pt-1 text-slate-500">
            <span>Wins: {hoveredCell.data.wins}</span>
            <span>Losses: {hoveredCell.data.tradeCount - hoveredCell.data.wins}</span>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-end gap-1.5 mt-4 text-[9px] text-slate-500 select-none">
        <span>Loss</span>
        <div className="w-2.5 h-2.5 bg-rose-500/20 rounded-sm" />
        <div className="w-2.5 h-2.5 bg-rose-500/50 rounded-sm" />
        <div className="w-2.5 h-2.5 bg-rose-500/80 rounded-sm" />
        <span className="mx-1">|</span>
        <div className="w-2.5 h-2.5 bg-emerald-500/20 rounded-sm" />
        <div className="w-2.5 h-2.5 bg-emerald-500/50 rounded-sm" />
        <div className="w-2.5 h-2.5 bg-emerald-500/80 rounded-sm" />
        <span>Profit</span>
      </div>

    </div>
  );
}
