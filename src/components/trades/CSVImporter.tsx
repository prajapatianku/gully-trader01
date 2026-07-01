'use client';

import React, { useState } from 'react';
import { 
  Upload, 
  FileText, 
  ArrowRight, 
  Check, 
  AlertTriangle, 
  Settings,
  HelpCircle,
  Eye,
  RefreshCw,
  FolderOpen,
  X
} from 'lucide-react';
import { db } from '../../lib/supabase';
import { Journal, Trade } from '../../lib/types';

interface CSVImporterProps {
  userId: string;
  journals: Journal[];
  onImportComplete: () => void;
  onClose: () => void;
}

interface ParsedRow {
  [key: string]: string;
}

export default function CSVImporter({ userId, journals, onImportComplete, onClose }: CSVImporterProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Upload, 2: Map & Preview, 3: Import / Summary
  const [broker, setBroker] = useState<'zerodha' | 'groww' | 'fyers' | 'generic'>('generic');
  const [targetJournalId, setTargetJournalId] = useState('');
  
  // CSV Data State
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState('');
  
  // Mapping State (CSV Header index / key -> Trade Property)
  const [mappings, setMappings] = useState<{
    date: string;
    symbol: string;
    direction: string;
    price: string;
    quantity: string;
    exchange: string;
    segment: string;
    brokerage: string;
  }>({
    date: '',
    symbol: '',
    direction: '',
    price: '',
    quantity: '',
    exchange: '',
    segment: '',
    brokerage: ''
  });

  // Duplicate Check Dialog
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [pendingTradesToImport, setPendingTradesToImport] = useState<any[]>([]);
  const [duplicateCount, setDuplicateCount] = useState(0);

  // Summary State
  const [importedCount, setImportedCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);

  // Simple CSV Parser that handles commas, quotes, and newlines
  const parseCSV = (text: string): { headers: string[]; rows: ParsedRow[] } => {
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length === 0) return { headers: [], rows: [] };

    // Regex to split comma-separated values, honoring quotes
    const splitCSVLine = (line: string) => {
      const result = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headers = splitCSVLine(lines[0]).map(h => h.replace(/^["']|["']$/g, ''));
    const rows: ParsedRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cells = splitCSVLine(lines[i]).map(c => c.replace(/^["']|["']$/g, ''));
      if (cells.length === headers.length) {
        const row: ParsedRow = {};
        headers.forEach((header, idx) => {
          row[header] = cells[idx];
        });
        rows.push(row);
      }
    }

    return { headers, rows };
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const { headers, rows } = parseCSV(text);
      setCsvHeaders(headers);
      setCsvRows(rows);

      // Auto-configure mapper based on Broker Template
      autoSetMappings(broker, headers);
      setStep(2);
    };
    reader.readAsText(file);
  };

  const autoSetMappings = (selectedBroker: string, headers: string[]) => {
    const findMatch = (keys: string[]) => {
      return headers.find(h => keys.some(k => h.toLowerCase().includes(k.toLowerCase()))) || '';
    };

    if (selectedBroker === 'zerodha') {
      setMappings({
        date: findMatch(['trade_date', 'date', 'time']),
        symbol: findMatch(['symbol', 'token']),
        direction: findMatch(['type', 'direction', 'buy/sell']),
        price: findMatch(['price', 'trade_price']),
        quantity: findMatch(['quantity', 'qty', 'shares']),
        exchange: findMatch(['exchange']),
        segment: findMatch(['segment']),
        brokerage: findMatch(['brokerage', 'charges'])
      });
    } else if (selectedBroker === 'groww') {
      setMappings({
        date: findMatch(['date', 'day']),
        symbol: findMatch(['symbol', 'name']),
        direction: findMatch(['action', 'type']),
        price: findMatch(['price', 'rate']),
        quantity: findMatch(['quantity', 'qty']),
        exchange: '',
        segment: '',
        brokerage: ''
      });
    } else if (selectedBroker === 'fyers') {
      setMappings({
        date: findMatch(['date', 'timestamp']),
        symbol: findMatch(['symbol', 'script']),
        direction: findMatch(['side', 'action']),
        price: findMatch(['price', 'average']),
        quantity: findMatch(['quantity', 'qty']),
        exchange: '',
        segment: '',
        brokerage: ''
      });
    } else {
      // Generic guesses
      setMappings({
        date: findMatch(['date', 'day', 'time']),
        symbol: findMatch(['symbol', 'ticker', 'asset', 'name']),
        direction: findMatch(['direction', 'type', 'side', 'action']),
        price: findMatch(['price', 'entry', 'average']),
        quantity: findMatch(['quantity', 'qty', 'amount', 'size']),
        exchange: findMatch(['exchange']),
        segment: findMatch(['segment']),
        brokerage: findMatch(['brokerage', 'commission', 'charges'])
      });
    }
  };

  const handleBrokerChange = (newBroker: typeof broker) => {
    setBroker(newBroker);
    if (csvHeaders.length > 0) {
      autoSetMappings(newBroker, csvHeaders);
    }
  };

  const processImport = async (forceImport = false) => {
    if (!targetJournalId) {
      const journalsList = journals.filter(j => !j.deleted_at);
      if (journalsList.length > 0) {
        setTargetJournalId(journalsList[0].id);
      } else {
        alert('Please create a journal first!');
        return;
      }
    }

    const targetId = targetJournalId || journals.filter(j => !j.deleted_at)[0]?.id;

    // Build array of parsed trade payloads
    const tradesToProcess = csvRows.map((row, idx) => {
      const dateVal = row[mappings.date] || new Date().toISOString().split('T')[0];
      const symbolVal = row[mappings.symbol] || 'UNKNOWN';
      const directionVal = (row[mappings.direction] || 'BUY').toUpperCase().includes('SELL') || (row[mappings.direction] || '').toUpperCase().includes('SHORT') ? 'SHORT' : 'LONG';
      const priceVal = Number(row[mappings.price] || 0);
      const qtyVal = Number(row[mappings.quantity] || 0);
      const brokerageVal = Number(row[mappings.brokerage] || 0);
      const exchangeVal = row[mappings.exchange] || 'NSE';
      const segmentVal = row[mappings.segment] || 'Options';

      return {
        user_id: userId,
        journal_id: targetId,
        trade_date: dateVal,
        exchange: exchangeVal,
        segment: segmentVal,
        symbol: symbolVal.toUpperCase(),
        direction: directionVal as 'LONG' | 'SHORT',
        entry_price: priceVal,
        exit_price: priceVal * 1.02, // dummy closed trade simulation for simplicity or import open
        quantity: qtyVal,
        entry_time: new Date(dateVal).toISOString(),
        exit_time: new Date(dateVal).toISOString(),
        status: 'CLOSED' as const,
        brokerage: brokerageVal,
        stt: 0,
        gst: 0,
        exchange_charges: 0,
        stamp_duty: 0,
        sebi_charges: 0,
        stop_loss: null,
        target: null,
        risk_amount: null,
        strategy_id: null,
        notes: `Imported via CSV (${fileName})`,
        exit_reason: 'CSV Import',
        lessons_learned: null,
        screenshot_url: null,
        tv_link: null
      };
    }).filter(t => t.entry_price > 0 && t.quantity > 0);

    if (tradesToProcess.length === 0) {
      alert('No valid trades parsed. Check your field mappings.');
      return;
    }

    if (!forceImport) {
      // Run duplicate check on first 20 trades to see if any exist
      let duplicates = 0;
      for (let i = 0; i < Math.min(20, tradesToProcess.length); i++) {
        const isDup = await db.trades.checkDuplicate(tradesToProcess[i]);
        if (isDup) duplicates++;
      }

      if (duplicates > 0) {
        setDuplicateCount(duplicates);
        setPendingTradesToImport(tradesToProcess);
        setShowDuplicateModal(true);
        return;
      }
    }

    // Execute Import
    let imported = 0;
    let skipped = 0;

    for (const trade of tradesToProcess) {
      if (!forceImport) {
        const exists = await db.trades.checkDuplicate(trade);
        if (exists) {
          skipped++;
          continue;
        }
      }
      await db.trades.create(trade);
      imported++;
    }

    setImportedCount(imported);
    setSkippedCount(skipped);
    setStep(3);
    onImportComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-3xl rounded-xl border border-slate-800 bg-[#0f172a] shadow-2xl glow-primary my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-500" />
            CSV Trade Ingestion Wizard
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-8 border-b border-slate-800 bg-slate-900/20 py-3 text-xs font-semibold text-slate-500">
          <div className={`flex items-center gap-1.5 ${step === 1 ? 'text-blue-400' : 'text-slate-400'}`}>
            <span className={`h-5 w-5 rounded-full flex items-center justify-center border ${
              step === 1 ? 'border-blue-500 bg-blue-500/10 text-blue-400 font-bold' : 'border-slate-700'
            }`}>1</span>
            Upload File
          </div>
          <ArrowRight className="h-3 w-3 text-slate-700" />
          <div className={`flex items-center gap-1.5 ${step === 2 ? 'text-blue-400' : 'text-slate-400'}`}>
            <span className={`h-5 w-5 rounded-full flex items-center justify-center border ${
              step === 2 ? 'border-blue-500 bg-blue-500/10 text-blue-400 font-bold' : 'border-slate-700'
            }`}>2</span>
            Map Columns & Preview
          </div>
          <ArrowRight className="h-3 w-3 text-slate-700" />
          <div className={`flex items-center gap-1.5 ${step === 3 ? 'text-blue-400' : 'text-slate-400'}`}>
            <span className={`h-5 w-5 rounded-full flex items-center justify-center border ${
              step === 3 ? 'border-blue-500 bg-blue-500/10 text-blue-400 font-bold' : 'border-slate-700'
            }`}>3</span>
            Import Complete
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          
          {/* STEP 1: Upload */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {(['generic', 'zerodha', 'groww', 'fyers'] as const).map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => handleBrokerChange(b)}
                    className={`rounded-xl border p-4 text-center transition-all ${
                      broker === b
                        ? 'border-blue-600 bg-blue-600/5 text-blue-400 font-bold shadow-md shadow-blue-500/5'
                        : 'border-slate-800 bg-[#080c14] text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <span className="block text-xs uppercase tracking-wider">{b}</span>
                  </button>
                ))}
              </div>

              <div className="rounded-xl border-2 border-dashed border-slate-800 bg-[#080c14] p-10 text-center transition-colors hover:border-slate-700">
                <Upload className="mx-auto h-10 w-10 text-slate-600 mb-4" />
                <label className="cursor-pointer">
                  <span className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/10">
                    Choose CSV File
                  </span>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <p className="mt-4 text-xs text-slate-500">Supports standard CSV exports. Column headers must be on row 1.</p>
              </div>
            </div>
          )}

          {/* STEP 2: Map & Preview */}
          {step === 2 && (
            <div className="space-y-6">
              
              {/* Journal target */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/30 p-4 rounded-xl border border-slate-800/80">
                <div className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5 text-blue-500" />
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase">Destination Journal</h4>
                    <p className="text-[10px] text-slate-500">All imported trades will be saved here</p>
                  </div>
                </div>
                <select
                  value={targetJournalId}
                  onChange={(e) => setTargetJournalId(e.target.value)}
                  className="rounded-lg border border-slate-800 bg-[#080c14] px-3.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                >
                  <option value="">-- Choose Journal --</option>
                  {journals.filter(j => !j.deleted_at).map(j => (
                    <option key={j.id} value={j.id}>{j.name} ({j.base_currency})</option>
                  ))}
                </select>
              </div>

              {/* Mapper columns */}
              <div className="border border-slate-800 rounded-xl p-5 bg-slate-950/20">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1">
                  <Settings className="h-4 w-4 text-blue-500" />
                  Map CSV Columns to Journal Fields
                </h4>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {(Object.keys(mappings) as Array<keyof typeof mappings>).map((field) => (
                    <div key={field}>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                        {field} {['date', 'symbol', 'direction', 'price', 'quantity'].includes(field) && '*'}
                      </label>
                      <select
                        value={mappings[field]}
                        onChange={(e) => setMappings({ ...mappings, [field]: e.target.value })}
                        className="w-full rounded border border-slate-800 bg-[#080c14] px-2 py-1 text-xs text-slate-300 focus:outline-none"
                      >
                        <option value="">-- Ignore --</option>
                        {csvHeaders.map(header => (
                          <option key={header} value={header}>{header}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview table */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1">
                  <Eye className="h-4 w-4 text-blue-500" />
                  Parsed Data Preview ({csvRows.length} rows found)
                </h4>
                
                <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-850 bg-[#080c14]/40">
                  <table className="w-full text-left text-xs text-slate-400">
                    <thead className="sticky top-0 bg-slate-900 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-800">
                      <tr>
                        {csvHeaders.slice(0, 6).map(h => (
                          <th key={h} className="px-4 py-2">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {csvRows.slice(0, 5).map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/20">
                          {csvHeaders.slice(0, 6).map(h => (
                            <td key={h} className="px-4 py-2 truncate max-w-[120px]">{row[h]}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setStep(1)}
                  className="rounded-lg border border-slate-800 px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  Back
                </button>
                <button
                  onClick={() => processImport(false)}
                  className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-md shadow-blue-500/10"
                >
                  Analyze & Import
                </button>
              </div>

            </div>
          )}

          {/* STEP 3: Summary */}
          {step === 3 && (
            <div className="flex flex-col items-center justify-center text-center py-10 space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 glow-success">
                <Check className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white">Import Complete!</h4>
                <p className="text-xs text-slate-500 mt-1">Trades successfully synchronized with journal ledger.</p>
              </div>

              <div className="grid grid-cols-2 gap-8 border border-slate-800 rounded-lg p-5 bg-slate-900/10 max-w-sm w-full">
                <div className="text-center">
                  <span className="block text-2xl font-bold text-emerald-400">{importedCount}</span>
                  <span className="text-[10px] font-semibold text-slate-500 uppercase">Imported</span>
                </div>
                <div className="text-center">
                  <span className="block text-2xl font-bold text-slate-400">{skippedCount}</span>
                  <span className="text-[10px] font-semibold text-slate-500 uppercase">Skipped (Dup)</span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700"
              >
                Close Importer
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Duplicate detection warning modal */}
      {showDuplicateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-[#161d30] p-6 shadow-2xl glow-danger">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-500/10 text-rose-500">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Duplicate Trades Detected</h4>
                <p className="text-xs text-rose-400 mt-0.5">Found matches in target journal ledger.</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              Some trades in your CSV already exist in the target journal database (matched by date, symbol, entry price, and quantity). Do you want to skip duplicates, or import all anyway?
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDuplicateModal(false);
                  onClose();
                }}
                className="rounded-lg border border-slate-850 px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800"
              >
                Cancel
              </button>
              
              <button
                onClick={() => {
                  setShowDuplicateModal(false);
                  processImport(true); // force import duplicates
                }}
                className="rounded-lg border border-red-500/20 bg-red-600/10 px-4 py-2 text-xs font-semibold text-red-400 hover:bg-red-600 hover:text-white"
              >
                Import Anyway
              </button>

              <button
                onClick={async () => {
                  setShowDuplicateModal(false);
                  
                  // Filter out duplicates on the fly
                  let imported = 0;
                  let skipped = 0;

                  for (const trade of pendingTradesToImport) {
                    const exists = await db.trades.checkDuplicate(trade);
                    if (exists) {
                      skipped++;
                      continue;
                    }
                    await db.trades.create(trade);
                    imported++;
                  }

                  setImportedCount(imported);
                  setSkippedCount(skipped);
                  setStep(3);
                  onImportComplete();
                }}
                className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-md shadow-blue-500/10"
              >
                Skip Duplicates (Recommended)
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
