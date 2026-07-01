'use client';

import React from 'react';
import { BookOpen, FileText, ChevronRight, Share2, HelpCircle } from 'lucide-react';
import Link from 'next/link';

interface SEOContentProps {
  slug: string;
}

export default function SEOContent({ slug }: SEOContentProps) {
  
  // Static content mapping for SEO guidelines
  const articles: {
    [key: string]: {
      title: string;
      h1: string;
      desc: string;
      sections: Array<{ heading: string; body: string }>;
    };
  } = {
    'trading-journal-guides': {
      title: 'The Ultimate Guide to Trading Journals | Gully Trader',
      h1: 'Why Every Trader Needs a Trading Journal',
      desc: 'Discover how maintaining an active trading journal is the single biggest factor separating profitable institutional traders from retail market losses.',
      sections: [
        {
          heading: '1. What is a Trading Journal?',
          body: 'A trading journal is a systematic log of all your market activities. It records not just entry and exit execution prices, but the emotional triggers, checklist compliance, strategy definitions, and lessons learned for every position.'
        },
        {
          heading: '2. Tracking Psychological Triggers',
          body: 'Most traders do not fail due to poor technical analysis; they fail due to emotional decisions like revenge trading, FOMO (Fear of Missing Out), or scaling sizes. Journaling forces you to review your discipline logs.'
        },
        {
          heading: '3. Formulating Your Review Routine',
          body: 'Consistently reviewing your cumulative net profit, equity curves, and daily discipline charts allows you to identify statistical edges and refine position sizes.'
        }
      ]
    },
    'tax-guides': {
      title: 'Indian Stock Market Income Tax Guide (F&O & Intraday) | Gully Trader',
      h1: 'Income Tax Rules for Indian F&O & Intraday Traders',
      desc: 'Understand tax obligations under Section 43(5) of the Income Tax Act. Learn about speculative vs business income, GST, and audit requirements.',
      sections: [
        {
          heading: '1. Speculative vs Non-Speculative Business Income',
          body: 'Intraday equity trading is classified as Speculative Business Income. Derivative trading (Futures and Options) is classified as Non-Speculative Business Income. Both must be reported using ITR-3 form.'
        },
        {
          heading: '2. Claiming Business Expense Deductions',
          body: 'As a business, traders can claim deductions against expenses incurred during trading, including flat brokerage, STT (Securities Transaction Tax), GST, stamp duty, exchange charges, internet bills, and advisory subscriptions.'
        },
        {
          heading: '3. Tax Audits under Section 44AB',
          body: 'A tax audit becomes mandatory if your trading turnover exceeds ₹10 crores (or ₹2 crores if more than 5% transactions are cash based), or if you declare losses and your total income exceeds the basic exemption limit.'
        }
      ]
    },
    'trading-templates': {
      title: 'Free Trading Excel & Notion Templates | Gully Trader',
      h1: 'Free Trading Log & Strategy Journals',
      desc: 'Download free Notion trading planners, Excel calculation spreadsheets, and checklist templates designed to keep you organized.',
      sections: [
        {
          heading: '1. Gully Trader Notion Template v1.0',
          body: 'A clean, modern Notion workspace built with strategy checklist databases, psychological check-ins, and daily review tables. Integrates with the Gully Trader web application.'
        },
        {
          heading: '2. Advanced Excel Trading Journal',
          body: 'An offline Excel sheet featuring automatic Indian taxation estimates, STT formulas, CAGR calculators, and win-rate charts. Perfect for swing and equity portfolios.'
        }
      ]
    }
  };

  const article = articles[slug] || articles['trading-journal-guides'];

  return (
    <article className="rounded-xl border border-slate-800/80 bg-slate-900/35 p-6 backdrop-blur-md max-w-3xl mx-auto space-y-6">
      
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-slate-500">
        <Link href="/" className="hover:text-blue-400">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-slate-300">Guides</span>
        <ChevronRight className="h-3 w-3" />
        <span className="text-blue-500">{slug}</span>
      </div>

      <header className="space-y-3">
        <h1 className="text-3xl font-extrabold text-white tracking-tight leading-tight">
          {article.h1}
        </h1>
        <p className="text-xs text-slate-400 leading-relaxed font-medium">
          {article.desc}
        </p>
        <div className="flex items-center gap-3 pt-2 text-[10px] text-slate-500 font-semibold border-b border-slate-800 pb-4">
          <span className="flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5" />
            5 min read
          </span>
          <span>•</span>
          <span>Published by Gully Trader Admin</span>
        </div>
      </header>

      <div className="space-y-6 mt-6">
        {article.sections.map((sec, i) => (
          <div key={i} className="space-y-2.5">
            <h3 className="text-sm font-bold text-slate-200">
              {sec.heading}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {sec.body}
            </p>
          </div>
        ))}
      </div>

      {/* CTA Box */}
      <div className="mt-8 rounded-xl bg-gradient-to-tr from-blue-600/10 to-teal-400/10 border border-blue-500/20 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-xs font-bold text-white uppercase">Start Journaling with Gully Trader</h4>
          <p className="text-[10px] text-slate-400 mt-1">Experience seamless broker CSV uploads and discipline dashboards entirely free.</p>
        </div>
        <Link
          href="/dashboard"
          className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/15"
        >
          Open Free Journal
        </Link>
      </div>

    </article>
  );
}
