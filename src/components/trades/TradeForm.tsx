'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  X, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Info,
  Layers,
  Calculator,
  CheckCircle2,
  Brain
} from 'lucide-react';
import { db } from '../../lib/supabase';
import { Journal, Strategy, Trade } from '../../lib/types';

interface TradeFormProps {
  userId: string;
  journals: Journal[];
  strategies: Strategy[];
  tradeToEdit?: Trade | null;
  onClose: () => void;
  onSave: () => void;
}

export default function TradeForm({ 
  userId, 
  journals, 
  strategies, 
  tradeToEdit, 
  onClose, 
  onSave 
}: TradeFormProps) {
  // Collapsible sections state
  const [secRiskOpen, setSecRiskOpen] = useState(false);
  const [secChargesOpen, setSecChargesOpen] = useState(false);
  const [secNotesOpen, setSecNotesOpen] = useState(true);

  // Form Field State
  const [journalId, setJournalId] = useState('');
  const [tradeDate, setTradeDate] = useState(new Date().toISOString().split('T')[0]);
  const [exchange, setExchange] = useState('NSE');
  const [segment, setSegment] = useState('Options');
  const [symbol, setSymbol] = useState('');
  const [direction, setDirection] = useState<'LONG' | 'SHORT'>('LONG');

  const [entryPrice, setEntryPrice] = useState<number | ''>('');
  const [exitPrice, setExitPrice] = useState<number | ''>('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [entryTime, setEntryTime] = useState('');
  const [exitTime, setExitTime] = useState('');
  const [status, setStatus] = useState<'OPEN' | 'CLOSED' | 'CANCELLED'>('CLOSED');

  // Risk info
  const [stopLoss, setStopLoss] = useState<number | ''>('');
  const [target, setTarget] = useState<number | ''>('');
  const [riskAmount, setRiskAmount] = useState<number | ''>('');

  // Charges
  const [autoCalcCharges, setAutoCalcCharges] = useState(true);
  const [brokerage, setBrokerage] = useState<number>(0);
  const [stt, setStt] = useState<number>(0);
  const [gst, setGst] = useState<number>(0);
  const [exchangeCharges, setExchangeCharges] = useState<number>(0);
  const [stampDuty, setStampDuty] = useState<number>(0);
  const [sebiCharges, setSebiCharges] = useState<number>(0);

  // Notes
  const [strategyId, setStrategyId] = useState('');
  const [newStrategyName, setNewStrategyName] = useState('');
  const [showAddStrat, setShowAddStrat] = useState(false);
  const [notes, setNotes] = useState('');
  const [exitReason, setExitReason] = useState('');
  const [lessonsLearned, setLessonsLearned] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  
  // Attachments
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [tvLink, setTvLink] = useState('');

  // Set default journal if available
  useEffect(() => {
    if (journals.length > 0 && !journalId) {
      setJournalId(journals[0].id);
    }
  }, [journals, journalId]);

  // Adjust defaults based on selected Journal Market Type
  useEffect(() => {
    const journal = journals.find(j => j.id === journalId);
    if (journal) {
      if (journal.market_type === 'Crypto') {
        setExchange('BINANCE');
        setSegment('Spot');
      } else if (journal.market_type === 'Forex') {
        setExchange('FOREX');
        setSegment('Spot');
      } else {
        setExchange('NSE');
        setSegment(journal.market_type === 'Equity' ? 'Equity' : 'Options');
      }
    }
  }, [journalId, journals]);

  // Hydrate fields if editing
  useEffect(() => {
    if (tradeToEdit) {
      setJournalId(tradeToEdit.journal_id);
      setTradeDate(tradeToEdit.trade_date);
      setExchange(tradeToEdit.exchange);
      setSegment(tradeToEdit.segment);
      setSymbol(tradeToEdit.symbol);
      setDirection(tradeToEdit.direction);
      setEntryPrice(tradeToEdit.entry_price);
      setExitPrice(tradeToEdit.exit_price ?? '');
      setQuantity(tradeToEdit.quantity);
      setEntryTime(tradeToEdit.entry_time ? new Date(tradeToEdit.entry_time).toISOString().substring(0, 16) : '');
      setExitTime(tradeToEdit.exit_time ? new Date(tradeToEdit.exit_time).toISOString().substring(0, 16) : '');
      setStatus(tradeToEdit.status);

      setStopLoss(tradeToEdit.stop_loss ?? '');
      setTarget(tradeToEdit.target ?? '');
      setRiskAmount(tradeToEdit.risk_amount ?? '');

      setBrokerage(tradeToEdit.brokerage);
      setStt(tradeToEdit.stt);
      setGst(tradeToEdit.gst);
      setExchangeCharges(tradeToEdit.exchange_charges);
      setStampDuty(tradeToEdit.stamp_duty);
      setSebiCharges(tradeToEdit.sebi_charges);
      
      const totalManualCharges = tradeToEdit.brokerage + tradeToEdit.stt + tradeToEdit.gst + tradeToEdit.exchange_charges + tradeToEdit.stamp_duty + tradeToEdit.sebi_charges;
      setAutoCalcCharges(totalManualCharges === 0);

      setStrategyId(tradeToEdit.strategy_id || '');
      setNotes(tradeToEdit.notes || '');
      setExitReason(tradeToEdit.exit_reason || '');
      setLessonsLearned(tradeToEdit.lessons_learned || '');
      setTagsInput(tradeToEdit.tags?.join(', ') || '');
      setScreenshotUrl(tradeToEdit.screenshot_url || '');
      setTvLink(tradeToEdit.tv_link || '');
    }
  }, [tradeToEdit]);

  const handleCreateStrategy = async () => {
    if (!newStrategyName.trim()) return;
    const strat = await db.strategies.create({
      user_id: userId,
      name: newStrategyName.trim(),
      description: 'Manually added strategy'
    });
    setStrategyId(strat.id);
    setNewStrategyName('');
    setShowAddStrat(false);
    onSave(); // trigger updates for strategy list in parent
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!journalId || !symbol || entryPrice === '' || quantity === '') {
      alert('Please fill out all required fields.');
      return;
    }

    const tags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const parsedEntryTime = entryTime ? new Date(entryTime).toISOString() : null;
    const parsedExitTime = exitTime ? new Date(exitTime).toISOString() : null;

    const payload = {
      user_id: userId,
      journal_id: journalId,
      trade_date: tradeDate,
      exchange,
      segment,
      symbol: symbol.toUpperCase(),
      direction,
      entry_price: Number(entryPrice),
      exit_price: exitPrice !== '' ? Number(exitPrice) : null,
      quantity: Number(quantity),
      entry_time: parsedEntryTime,
      exit_time: parsedExitTime,
      status,
      stop_loss: stopLoss !== '' ? Number(stopLoss) : null,
      target: target !== '' ? Number(target) : null,
      risk_amount: riskAmount !== '' ? Number(riskAmount) : null,
      
      // If auto-calculated, send 0 to trigger mockDb defaults, else send manual values
      brokerage: autoCalcCharges ? 0 : brokerage,
      stt: autoCalcCharges ? 0 : stt,
      gst: autoCalcCharges ? 0 : gst,
      exchange_charges: autoCalcCharges ? 0 : exchangeCharges,
      stamp_duty: autoCalcCharges ? 0 : stampDuty,
      sebi_charges: autoCalcCharges ? 0 : sebiCharges,
      
      strategy_id: strategyId || null,
      notes: notes || null,
      exit_reason: exitReason || null,
      lessons_learned: lessonsLearned || null,
      screenshot_url: screenshotUrl || null,
      tv_link: tvLink || null,
      tags
    };

    try {
      if (tradeToEdit) {
        await db.trades.update(tradeToEdit.id, payload);
      } else {
        await db.trades.create(payload);
      }
      onSave();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Error saving trade');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-2xl rounded-xl border border-slate-800 bg-[#0f172a] shadow-2xl glow-primary my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Plus className="h-5 w-5 text-blue-500" />
            {tradeToEdit ? 'Edit Closed/Open Trade Setup' : 'Log New Manual Trade'}
          </h3>
          <button 
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* SECTION 1: Basic Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <Layers className="h-4 w-4 text-blue-400" />
              1. Basic Setup Information
            </div>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Target Journal *</label>
                <select
                  required
                  value={journalId}
                  onChange={(e) => setJournalId(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-[#080c14] px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {journals.map(j => (
                    <option key={j.id} value={j.id}>{j.name} ({j.base_currency})</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-xs text-slate-500 mb-1">Trade Date *</label>
                <input
                  type="date"
                  required
                  value={tradeDate}
                  onChange={(e) => setTradeDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-[#080c14] px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">Symbol / Asset *</label>
                <input
                  type="text"
                  required
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  placeholder="e.g. BANKNIFTY 48000 CE, BTCUSDT"
                  className="w-full rounded-lg border border-slate-800 bg-[#080c14] px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Exchange</label>
                <input
                  type="text"
                  value={exchange}
                  onChange={(e) => setExchange(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-[#080c14] px-3 py-2 text-xs text-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">Segment</label>
                <select
                  value={segment}
                  onChange={(e) => setSegment(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-[#080c14] px-3 py-2 text-xs text-slate-200 focus:outline-none"
                >
                  <option value="Equity">Equity (Spot)</option>
                  <option value="Futures">Futures</option>
                  <option value="Options">Options</option>
                  <option value="Spot">Spot (Crypto/FX)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">Direction</label>
                <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setDirection('LONG')}
                    className={`rounded py-1 text-center text-xs font-bold transition-all ${
                      direction === 'LONG' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500'
                    }`}
                  >
                    LONG
                  </button>
                  <button
                    type="button"
                    onClick={() => setDirection('SHORT')}
                    className={`rounded py-1 text-center text-xs font-bold transition-all ${
                      direction === 'SHORT' ? 'bg-rose-500/20 text-rose-500' : 'text-slate-500'
                    }`}
                  >
                    SHORT
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">Setup Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full rounded-lg border border-slate-800 bg-[#080c14] px-3 py-2 text-xs text-slate-200 focus:outline-none"
                >
                  <option value="CLOSED">CLOSED (Settled)</option>
                  <option value="OPEN">OPEN (Running)</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>
            </div>
          </div>

          <hr className="border-slate-800/60" />

          {/* SECTION 2: Execution Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <Calculator className="h-4 w-4 text-blue-400" />
              2. Trade Details & Quantities
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Entry Price *</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={entryPrice}
                  onChange={(e) => setEntryPrice(e.target.value !== '' ? Number(e.target.value) : '')}
                  placeholder="e.g. 154.50"
                  className="w-full rounded-lg border border-slate-800 bg-[#080c14] px-3 py-2 text-xs text-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">Exit Price {status === 'CLOSED' && '*'}</label>
                <input
                  type="number"
                  step="any"
                  required={status === 'CLOSED'}
                  value={exitPrice}
                  onChange={(e) => setExitPrice(e.target.value !== '' ? Number(e.target.value) : '')}
                  placeholder="e.g. 195.00"
                  className="w-full rounded-lg border border-slate-800 bg-[#080c14] px-3 py-2 text-xs text-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">Quantity *</label>
                <input
                  type="number"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value !== '' ? Number(e.target.value) : '')}
                  placeholder="e.g. 15 (1 lot)"
                  className="w-full rounded-lg border border-slate-800 bg-[#080c14] px-3 py-2 text-xs text-slate-200 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Entry Timestamp</label>
                <input
                  type="datetime-local"
                  value={entryTime}
                  onChange={(e) => setEntryTime(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-[#080c14] px-3 py-2 text-xs text-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">Exit Timestamp</label>
                <input
                  type="datetime-local"
                  value={exitTime}
                  onChange={(e) => setExitTime(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-[#080c14] px-3 py-2 text-xs text-slate-200 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <hr className="border-slate-800/60" />

          {/* SECTION 3: Risk Management (Collapsible) */}
          <div className="border border-slate-800 rounded-lg p-4">
            <button
              type="button"
              onClick={() => setSecRiskOpen(!secRiskOpen)}
              className="flex w-full items-center justify-between text-xs font-bold text-slate-300 uppercase tracking-wider"
            >
              <span className="flex items-center gap-1.5">
                <Info className="h-4 w-4 text-blue-400" />
                3. Risk Parameters (Optional)
              </span>
              {secRiskOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {secRiskOpen && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mt-4 pt-2 border-t border-slate-800">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Stop Loss</label>
                  <input
                    type="number"
                    step="any"
                    value={stopLoss}
                    onChange={(e) => setStopLoss(e.target.value !== '' ? Number(e.target.value) : '')}
                    className="w-full rounded-lg border border-slate-800 bg-[#080c14] px-3 py-2 text-xs text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Take Profit Target</label>
                  <input
                    type="number"
                    step="any"
                    value={target}
                    onChange={(e) => setTarget(e.target.value !== '' ? Number(e.target.value) : '')}
                    className="w-full rounded-lg border border-slate-800 bg-[#080c14] px-3 py-2 text-xs text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Risk Amount (Capital at Risk)</label>
                  <input
                    type="number"
                    value={riskAmount}
                    onChange={(e) => setRiskAmount(e.target.value !== '' ? Number(e.target.value) : '')}
                    className="w-full rounded-lg border border-slate-800 bg-[#080c14] px-3 py-2 text-xs text-slate-200 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* SECTION 4: Charges & Commissions (Collapsible) */}
          <div className="border border-slate-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSecChargesOpen(!secChargesOpen)}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-300 uppercase tracking-wider"
              >
                <Layers className="h-4 w-4 text-blue-400" />
                4. Brokerage, Taxes & Charges
                {secChargesOpen ? <ChevronUp className="h-4 w-4 ml-2 inline" /> : <ChevronDown className="h-4 w-4 ml-2 inline" />}
              </button>

              <div className="flex items-center gap-2 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                <input
                  type="checkbox"
                  id="autoCalc"
                  checked={autoCalcCharges}
                  onChange={(e) => setAutoCalcCharges(e.target.checked)}
                  className="rounded border-slate-800 text-blue-500 focus:ring-0 cursor-pointer h-3.5 w-3.5"
                />
                <label htmlFor="autoCalc" className="text-[10px] font-bold text-slate-400 cursor-pointer uppercase select-none">
                  Estimate Automatically
                </label>
              </div>
            </div>

            {secChargesOpen && (
              <div className="mt-4 pt-2 border-t border-slate-800 space-y-4">
                {autoCalcCharges ? (
                  <div className="flex items-center gap-2 text-xs text-slate-400 bg-blue-900/10 border border-blue-800/40 p-3 rounded-lg">
                    <Info className="h-4 w-4 text-blue-400 shrink-0" />
                    <span>
                      Tax estimates will be automatically calculated on submit according to segment rules (e.g. ₹40 flat Zerodha brokerage + SEBI, GST, STT margins).
                    </span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Brokerage Fee</label>
                      <input
                        type="number"
                        step="any"
                        value={brokerage}
                        onChange={(e) => setBrokerage(Number(e.target.value))}
                        className="w-full rounded-lg border border-slate-800 bg-[#080c14] px-3 py-2 text-xs text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">STT / CTT</label>
                      <input
                        type="number"
                        step="any"
                        value={stt}
                        onChange={(e) => setStt(Number(e.target.value))}
                        className="w-full rounded-lg border border-slate-800 bg-[#080c14] px-3 py-2 text-xs text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">GST (18%)</label>
                      <input
                        type="number"
                        step="any"
                        value={gst}
                        onChange={(e) => setGst(Number(e.target.value))}
                        className="w-full rounded-lg border border-slate-800 bg-[#080c14] px-3 py-2 text-xs text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Exchange Charges</label>
                      <input
                        type="number"
                        step="any"
                        value={exchangeCharges}
                        onChange={(e) => setExchangeCharges(Number(e.target.value))}
                        className="w-full rounded-lg border border-slate-800 bg-[#080c14] px-3 py-2 text-xs text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Stamp Duty</label>
                      <input
                        type="number"
                        step="any"
                        value={stampDuty}
                        onChange={(e) => setStampDuty(Number(e.target.value))}
                        className="w-full rounded-lg border border-slate-800 bg-[#080c14] px-3 py-2 text-xs text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">SEBI Turnover Fee</label>
                      <input
                        type="number"
                        step="any"
                        value={sebiCharges}
                        onChange={(e) => setSebiCharges(Number(e.target.value))}
                        className="w-full rounded-lg border border-slate-800 bg-[#080c14] px-3 py-2 text-xs text-slate-200"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SECTION 5: Notes & Psychology */}
          <div className="border border-slate-800 rounded-lg p-4">
            <button
              type="button"
              onClick={() => setSecNotesOpen(!secNotesOpen)}
              className="flex w-full items-center justify-between text-xs font-bold text-slate-300 uppercase tracking-wider"
            >
              <span className="flex items-center gap-1.5">
                <Brain className="h-4 w-4 text-blue-400" />
                5. Notes, Strategy & Psychology
              </span>
              {secNotesOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {secNotesOpen && (
              <div className="mt-4 pt-2 border-t border-slate-800 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Trading Strategy</label>
                    <div className="flex gap-2">
                      <select
                        value={strategyId}
                        onChange={(e) => setStrategyId(e.target.value)}
                        className="flex-1 rounded-lg border border-slate-800 bg-[#080c14] px-3 py-2 text-xs text-slate-200 focus:outline-none"
                      >
                        <option value="">No Strategy / Discretionary</option>
                        {strategies.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setShowAddStrat(!showAddStrat)}
                        className="rounded-lg bg-slate-800 px-3 text-xs font-semibold text-slate-300 hover:bg-slate-700"
                      >
                        New
                      </button>
                    </div>

                    {showAddStrat && (
                      <div className="mt-2 flex gap-1 bg-slate-950 p-2 rounded-lg border border-slate-850">
                        <input
                          type="text"
                          value={newStrategyName}
                          onChange={(e) => setNewStrategyName(e.target.value)}
                          placeholder="Strategy Name"
                          className="flex-1 rounded border border-slate-800 bg-[#080c14] px-2 py-1 text-xs text-slate-200 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleCreateStrategy}
                          className="rounded bg-blue-600 px-2.5 text-xs text-white hover:bg-blue-700"
                        >
                          Add
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Tags (Comma Separated)</label>
                    <input
                      type="text"
                      value={tagsInput}
                      onChange={(e) => setTagsInput(e.target.value)}
                      placeholder="e.g. FOMO, Disciplined, Trend-Following"
                      className="w-full rounded-lg border border-slate-800 bg-[#080c14] px-3 py-2 text-xs text-slate-200 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Setup Notes / Checklist</label>
                    <textarea
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Why did you take this setup?"
                      className="w-full rounded-lg border border-slate-800 bg-[#080c14] px-3.5 py-2 text-xs text-slate-200 focus:outline-none resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Exit Reason</label>
                    <textarea
                      rows={3}
                      value={exitReason}
                      onChange={(e) => setExitReason(e.target.value)}
                      placeholder="Target hit, Trailing SL hit, or emotional exit?"
                      className="w-full rounded-lg border border-slate-800 bg-[#080c14] px-3.5 py-2 text-xs text-slate-200 focus:outline-none resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Lessons Learned</label>
                    <textarea
                      rows={3}
                      value={lessonsLearned}
                      onChange={(e) => setLessonsLearned(e.target.value)}
                      placeholder="What could be improved?"
                      className="w-full rounded-lg border border-slate-800 bg-[#080c14] px-3.5 py-2 text-xs text-slate-200 focus:outline-none resize-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Screenshot Image Link</label>
                    <input
                      type="url"
                      value={screenshotUrl}
                      onChange={(e) => setScreenshotUrl(e.target.value)}
                      placeholder="https://imgur.com/image.png"
                      className="w-full rounded-lg border border-slate-800 bg-[#080c14] px-3 py-2 text-xs text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">TradingView Chart Link</label>
                    <input
                      type="url"
                      value={tvLink}
                      onChange={(e) => setTvLink(e.target.value)}
                      placeholder="https://tradingview.com/x/abcde123/"
                      className="w-full rounded-lg border border-slate-800 bg-[#080c14] px-3 py-2 text-xs text-slate-200"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 py-3 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/10 flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 className="h-4.5 w-4.5" />
            {tradeToEdit ? 'Save Changes & Recalculate' : 'Log Trade Setup'}
          </button>
        </form>
      </div>
    </div>
  );
}
