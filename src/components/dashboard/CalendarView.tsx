'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, History } from 'lucide-react';
import { Trade } from '../../lib/types';

interface CalendarProps {
  trades: Trade[];
  currency: 'INR' | 'USD';
}

export default function CalendarView({ trades, currency }: CalendarProps) {
  const currencySymbol = currency === 'INR' ? '₹' : '$';
  
  // State for active calendar month
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayTrades, setSelectedDayTrades] = useState<Trade[] | null>(null);
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  // Month names
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Days in month
  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  // First day of month (0 = Sunday, 1 = Monday...)
  const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  // Group trades by date string (YYYY-MM-DD)
  const tradesByDate: { [key: string]: Trade[] } = {};
  trades.forEach(t => {
    if (t.status === 'CLOSED') {
      const dateStr = t.trade_date; // assumed YYYY-MM-DD
      if (!tradesByDate[dateStr]) tradesByDate[dateStr] = [];
      tradesByDate[dateStr].push(t);
    }
  });

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDayTrades(null);
    setSelectedDateStr(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDayTrades(null);
    setSelectedDateStr(null);
  };

  // Generate calendar grid array
  const calendarCells = [];
  
  // Empty slots for days before the 1st of the month
  for (let i = 0; i < firstDay; i++) {
    calendarCells.push(null);
  }

  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarCells.push(day);
  }

  const handleDayClick = (day: number) => {
    const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayTrades = tradesByDate[formattedDate] || [];
    setSelectedDayTrades(dayTrades);
    setSelectedDateStr(formattedDate);
  };

  return (
    <div className="rounded-xl border border-slate-800/85 bg-slate-900/35 p-6 backdrop-blur-md">
      {/* Calendar Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-blue-500" />
          Monthly Review Calendar
        </h3>
        <div className="flex items-center gap-3 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800/40">
          <button
            onClick={handlePrevMonth}
            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs font-bold text-slate-200 min-w-[100px] text-center">
            {monthNames[month]} {year}
          </span>
          <button
            onClick={handleNextMonth}
            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Days of Week label */}
      <div className="mt-6 grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-500">
        <div>SUN</div>
        <div>MON</div>
        <div>TUE</div>
        <div>WED</div>
        <div>THU</div>
        <div>FRI</div>
        <div>SAT</div>
      </div>

      {/* Grid cells */}
      <div className="mt-2 grid grid-cols-7 gap-1.5">
        {calendarCells.map((cell, idx) => {
          if (cell === null) {
            return <div key={`empty-${idx}`} className="h-14 rounded-lg bg-transparent" />;
          }

          const dayDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(cell).padStart(2, '0')}`;
          const dayTrades = tradesByDate[dayDateStr] || [];
          
          let dayPnl = 0;
          dayTrades.forEach(t => dayPnl += t.net_pnl);

          let cellClass = 'calendar-day-neutral';
          if (dayTrades.length > 0) {
            cellClass = dayPnl >= 0 ? 'calendar-day-win' : 'calendar-day-loss';
          }

          const isSelected = selectedDateStr === dayDateStr;

          return (
            <button
              key={`day-${cell}`}
              onClick={() => handleDayClick(cell)}
              className={`flex h-14 flex-col justify-between rounded-lg p-1.5 text-left transition-all hover:scale-[1.03] ${cellClass} ${
                isSelected ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-[#080c14] scale-[1.03]' : ''
              }`}
            >
              <span className="text-[10px] font-bold opacity-80">{cell}</span>
              {dayTrades.length > 0 && (
                <span className="text-[10px] font-extrabold truncate w-full text-right leading-none">
                  {dayPnl >= 0 ? '+' : ''}{dayPnl >= 1000 || dayPnl <= -1000 
                    ? `${(dayPnl / 1000).toFixed(1)}k`
                    : Math.round(dayPnl)}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Day Details Drawer/Container */}
      {selectedDateStr && (
        <div className="mt-6 border-t border-slate-800 pt-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-slate-300 flex items-center gap-2">
              <History className="h-4 w-4 text-blue-400" />
              Trades on {new Date(selectedDateStr).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
            </h4>
            <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full uppercase font-bold">
              {selectedDayTrades?.length || 0} setups
            </span>
          </div>

          {!selectedDayTrades || selectedDayTrades.length === 0 ? (
            <p className="text-xs text-slate-500 py-3">No closed trade setups logged on this day.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-800 bg-[#080c14]/50">
              <table className="w-full text-left text-xs text-slate-400">
                <thead className="bg-[#0f172a] text-[10px] uppercase font-bold text-slate-500 border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-2">Symbol</th>
                    <th className="px-4 py-2">Dir</th>
                    <th className="px-4 py-2 text-right">Entry</th>
                    <th className="px-4 py-2 text-right">Exit</th>
                    <th className="px-4 py-2 text-right">Qty</th>
                    <th className="px-4 py-2 text-right">Charges</th>
                    <th className="px-4 py-2 text-right">Net P&L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {selectedDayTrades.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-900/40">
                      <td className="px-4 py-2.5 font-bold text-slate-200 uppercase">{t.symbol}</td>
                      <td className="px-4 py-2.5">
                        <span className={`rounded-sm px-1.5 py-0.5 text-[9px] font-bold ${
                          t.direction === 'LONG' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-500'
                        }`}>
                          {t.direction}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right font-medium">{t.entry_price.toFixed(2)}</td>
                      <td className="px-4 py-2.5 text-right font-medium">{t.exit_price?.toFixed(2) || '-'}</td>
                      <td className="px-4 py-2.5 text-right">{t.quantity}</td>
                      <td className="px-4 py-2.5 text-right">{currencySymbol}{t.total_charges.toFixed(2)}</td>
                      <td className={`px-4 py-2.5 text-right font-bold ${
                        t.net_pnl >= 0 ? 'text-emerald-400' : 'text-rose-500'
                      }`}>
                        {t.net_pnl >= 0 ? '+' : ''}{t.net_pnl.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
