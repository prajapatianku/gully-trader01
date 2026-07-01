'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  TrendingUp, 
  Upload, 
  Brain, 
  ShieldAlert, 
  Share2, 
  CheckCircle2, 
  Calculator, 
  ArrowRight,
  BookOpen
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import SEOContent from '../components/seo/SEOContent';

export default function Home() {
  const [selectedGuide, setSelectedGuide] = useState<string | null>(null);
  
  // Mini calculator state on landing page
  const [capital, setCapital] = useState(100000);
  const [risk, setRisk] = useState(1);
  const [slPoints, setSlPoints] = useState(10);
  
  const riskAmount = (capital * risk) / 100;
  const quantity = slPoints > 0 ? Math.floor(riskAmount / slPoints) : 0;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 bg-[#080c14] text-white">
        
        {/* HERO SECTION */}
        <section className="relative overflow-hidden pt-20 pb-16 lg:pt-32 lg:pb-24 border-b border-slate-900/60">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.08),transparent_50%)]" />
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-3xl mx-auto space-y-6">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400 border border-blue-500/20">
                <SparklesIcon className="h-3.5 w-3.5" />
                100% Free Forever • Built for Performance
              </span>
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                India's Free Trading Journal for Stocks, Options, Forex & Crypto
              </h1>
              <p className="text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
                Log trades in seconds, upload broker CSV sheets, analyze drawdown curves, and track your psychology rules to master consistency.
              </p>
              <div className="flex justify-center gap-4 pt-4">
                <Link
                  href="/dashboard"
                  className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20 flex items-center gap-1.5"
                >
                  Start Journaling Free
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="#mini-calc"
                  className="rounded-lg border border-slate-800 px-6 py-3 text-sm font-semibold text-slate-400 hover:bg-slate-850 hover:text-white transition-colors"
                >
                  Try Position Calculator
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* VALUE PROPOSITIONS */}
        <section className="py-16 bg-slate-950/20 border-b border-slate-900/40">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-center text-xs font-bold uppercase tracking-widest text-slate-500 mb-12">
              Everything You Need to Conquer the Market
            </h2>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-slate-850 bg-slate-900/20 p-6 space-y-4 hover:border-slate-800 transition-all">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/10 text-blue-400">
                  <Upload className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-white uppercase">One-Click CSV Imports</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Support for Zerodha Kite, Groww, Fyers, and a flexible custom generic CSV mapper with duplicate checks.
                </p>
              </div>

              <div className="rounded-xl border border-slate-850 bg-slate-900/20 p-6 space-y-4 hover:border-slate-800 transition-all">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-600/10 text-teal-400">
                  <Brain className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-white uppercase">Psychology Modules</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Create a custom rule book, track violations, and write daily mental checks to calculate a discipline score.
                </p>
              </div>

              <div className="rounded-xl border border-slate-850 bg-slate-900/20 p-6 space-y-4 hover:border-slate-800 transition-all">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-600/10 text-amber-400">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-white uppercase">Drawdown Analytics</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Check your cumulative equity curve, peak-to-trough drawdowns, win rates, strategy parameters, and charges.
                </p>
              </div>

              <div className="rounded-xl border border-slate-850 bg-slate-900/20 p-6 space-y-4 hover:border-slate-800 transition-all">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-600/10 text-purple-400">
                  <Share2 className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-white uppercase">Achievement Cards</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Generate and download premium social sharing cards containing your P&L milestones and appreciation quotes.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* HERO WIDGET: Position size calculator */}
        <section id="mini-calc" className="py-20 border-b border-slate-900/60 scroll-mt-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              
              <div className="space-y-6">
                <h2 className="text-3xl font-extrabold text-white tracking-tight leading-tight">
                  Stop Guessing Positions. Trade with Strict Risk Limits.
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Enter your capital, what percent you want to risk, and your Stop Loss in points. The calculator computes the precise number of shares/units to buy.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    Calculates risk cash size dynamically
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    Protects capital drawdown peaks
                  </div>
                </div>
              </div>

              {/* Calculator Box */}
              <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-6 shadow-xl glow-primary space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-850 pb-3">
                  <Calculator className="h-4 w-4 text-blue-500" />
                  Live Position Size Tool
                </h3>

                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-500 mb-1">Capital (₹)</label>
                    <input
                      type="number"
                      value={capital}
                      onChange={(e) => setCapital(Math.max(1, Number(e.target.value)))}
                      className="w-full rounded border border-slate-800 bg-[#080c14] px-2.5 py-1.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">Risk %</label>
                    <input
                      type="number"
                      value={risk}
                      onChange={(e) => setRisk(Math.max(0.1, Number(e.target.value)))}
                      className="w-full rounded border border-slate-800 bg-[#080c14] px-2.5 py-1.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">SL Points</label>
                    <input
                      type="number"
                      value={slPoints}
                      onChange={(e) => setSlPoints(Math.max(1, Number(e.target.value)))}
                      className="w-full rounded border border-slate-800 bg-[#080c14] px-2.5 py-1.5 text-white"
                    />
                  </div>
                </div>

                <div className="bg-slate-950/65 rounded-lg p-4 flex justify-between items-center text-xs">
                  <div>
                    <span className="text-slate-500 font-bold uppercase tracking-wider block text-[9px]">Risk Amount</span>
                    <span className="text-sm font-extrabold text-rose-400">₹{riskAmount.toLocaleString()}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 font-bold uppercase tracking-wider block text-[9px]">Recommended Qty</span>
                    <span className="text-lg font-black text-teal-400">{quantity.toLocaleString()} Units</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* SEO GUIDES & CONTENT SECTION */}
        <section className="py-20 bg-slate-950/20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-center text-2xl font-extrabold tracking-tight text-white mb-4">
              Trader Resource Guides & Templates
            </h2>
            <p className="text-center text-xs text-slate-500 max-w-md mx-auto mb-12">
              Learn stock market tax regulations, read setup guides, and access free excel templates.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              
              {/* Guides list sidebar */}
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedGuide('trading-journal-guides')}
                  className={`w-full text-left rounded-lg p-4 border transition-colors flex items-center justify-between ${
                    selectedGuide === 'trading-journal-guides'
                      ? 'border-blue-600 bg-blue-600/5 text-blue-400 font-bold'
                      : 'border-slate-850 bg-slate-900/10 text-slate-400 hover:bg-slate-900/30'
                  }`}
                >
                  <span className="text-xs uppercase">Journaling Guide</span>
                  <BookOpen className="h-4 w-4" />
                </button>

                <button
                  onClick={() => setSelectedGuide('tax-guides')}
                  className={`w-full text-left rounded-lg p-4 border transition-colors flex items-center justify-between ${
                    selectedGuide === 'tax-guides'
                      ? 'border-blue-600 bg-blue-600/5 text-blue-400 font-bold'
                      : 'border-slate-850 bg-slate-900/10 text-slate-400 hover:bg-slate-900/30'
                  }`}
                >
                  <span className="text-xs uppercase">Indian Tax Guide</span>
                  <BookOpen className="h-4 w-4" />
                </button>

                <button
                  onClick={() => setSelectedGuide('trading-templates')}
                  className={`w-full text-left rounded-lg p-4 border transition-colors flex items-center justify-between ${
                    selectedGuide === 'trading-templates'
                      ? 'border-blue-600 bg-blue-600/5 text-blue-400 font-bold'
                      : 'border-slate-850 bg-slate-900/10 text-slate-400 hover:bg-slate-900/30'
                  }`}
                >
                  <span className="text-xs uppercase">Free Templates</span>
                  <BookOpen className="h-4 w-4" />
                </button>
              </div>

              {/* Guide display frame */}
              <div className="lg:col-span-3">
                {selectedGuide ? (
                  <SEOContent slug={selectedGuide} />
                ) : (
                  <div className="rounded-xl border border-slate-850 bg-slate-900/10 p-12 text-center flex flex-col items-center justify-center h-full">
                    <BookOpen className="h-10 w-10 text-slate-700 mb-3" />
                    <h3 className="text-sm font-bold text-slate-300">Select a Trading Resource Guide</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs">Click one of the resources on the left to read tax rules, Excel downloads, and trading guidelines.</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        </section>

      </main>

      <footer className="bg-slate-950 border-t border-slate-900 py-8 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} Gully Trader. India's Free Trading Journal. All rights reserved.</p>
        <p className="mt-1 text-[10px] text-slate-600">Trading involves significant risk. None of the calculators or blogs are financial advice.</p>
      </footer>
    </div>
  );
}

// Sparkle icon
function SparklesIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5.5z" />
      <path d="m19 17 1 2.5 2.5.5-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1z" />
    </svg>
  );
}
