'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Check, 
  Brain, 
  BookOpen, 
  Flame, 
  Sparkles, 
  Save,
  AlertTriangle,
  Smile
} from 'lucide-react';
import { db } from '../../lib/supabase';
import { RuleBook as RuleType, DailyReview, Trade } from '../../lib/types';

interface RuleBookProps {
  userId: string;
  trades: Trade[];
}

export default function RuleBook({ userId, trades }: RuleBookProps) {
  const [rules, setRules] = useState<RuleType[]>([]);
  const [reviews, setReviews] = useState<DailyReview[]>([]);
  const [loading, setLoading] = useState(true);

  // New Rule form state
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleDesc, setNewRuleDesc] = useState('');
  const [newRulePenalty, setNewRulePenalty] = useState(10);
  const [showAddRule, setShowAddRule] = useState(false);

  // Daily Review form state
  const [reviewDate, setReviewDate] = useState(new Date().toISOString().split('T')[0]);
  const [mood, setMood] = useState('Calm');
  const [notes, setNotes] = useState('');
  const [mistakes, setMistakes] = useState('');
  const [marketCond, setMarketCond] = useState('Sideways');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const rList = await db.psychology.listRules(userId);
        const revList = await db.psychology.listDailyReviews(userId);
        setRules(rList);
        setReviews(revList);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [userId]);

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName.trim()) return;

    try {
      const r = await db.psychology.createRule({
        user_id: userId,
        rule_name: newRuleName.trim(),
        description: newRuleDesc.trim() || null,
        penalty_score: newRulePenalty,
        is_active: true
      });
      setRules([...rules, r]);
      setNewRuleName('');
      setNewRuleDesc('');
      setNewRulePenalty(10);
      setShowAddRule(false);
    } catch (err: any) {
      alert(err.message || 'Error creating rule');
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm('Are you sure you want to delete this rule? Any associated logs will be deleted.')) return;
    try {
      await db.psychology.deleteRule(id);
      setRules(rules.filter(r => r.id !== id));
    } catch (err) {
      alert('Error deleting rule');
    }
  };

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Find base discipline score for this day
      const dailyTrades = trades.filter(t => t.trade_date === reviewDate);
      
      // Look up violations to calculate score
      let scorePenalty = 0;
      for (const t of dailyTrades) {
        const violations = await db.psychology.listViolationsForTrade(t.id);
        violations.forEach(v => {
          const rule = rules.find(r => r.id === v.rule_id);
          scorePenalty += rule?.penalty_score || 10;
        });
      }

      const score = Math.max(0, 100 - scorePenalty);

      const rev = await db.psychology.saveDailyReview({
        user_id: userId,
        review_date: reviewDate,
        discipline_score: score,
        mood,
        notes: notes || null,
        mistakes: mistakes || null,
        market_conditions: marketCond || null
      });

      // Update local state list
      const idx = reviews.findIndex(r => r.review_date === reviewDate);
      if (idx !== -1) {
        const updated = [...reviews];
        updated[idx] = rev;
        setReviews(updated);
      } else {
        setReviews([rev, ...reviews]);
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      alert('Error saving daily review');
    }
  };

  // Find review for active date to populate form on change
  useEffect(() => {
    const activeRev = reviews.find(r => r.review_date === reviewDate);
    if (activeRev) {
      setMood(activeRev.mood || 'Calm');
      setNotes(activeRev.notes || '');
      setMistakes(activeRev.mistakes || '');
      setMarketCond(activeRev.market_conditions || 'Sideways');
    } else {
      setMood('Calm');
      setNotes('');
      setMistakes('');
      setMarketCond('Sideways');
    }
  }, [reviewDate, reviews]);

  if (loading) {
    return <div className="text-center py-10 text-slate-500 text-xs">Loading Psychology data...</div>;
  }

  // Calculate stats
  const activeRules = rules.filter(r => r.is_active);
  const avgDiscipline = reviews.length > 0 
    ? Math.round(reviews.reduce((sum, r) => sum + r.discipline_score, 0) / reviews.length)
    : 100;

  return (
    <div className="space-y-6">
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Discipline Score</span>
            <div className="rounded-lg p-1.5 bg-blue-500/10 text-blue-400">
              <Brain className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className={`text-2xl font-bold tracking-tight ${avgDiscipline >= 80 ? 'text-emerald-400' : avgDiscipline >= 60 ? 'text-amber-400' : 'text-rose-500'}`}>
              {avgDiscipline}%
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Average score across daily reviews</p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Rules</span>
            <div className="rounded-lg p-1.5 bg-teal-500/10 text-teal-400">
              <BookOpen className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold tracking-tight text-slate-200">
              {activeRules.length} / {rules.length}
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Active codes of discipline active</p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Discipline Streak</span>
            <div className="rounded-lg p-1.5 bg-orange-500/10 text-orange-400">
              <Flame className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold tracking-tight text-orange-400">
              {reviews.filter(r => r.discipline_score === 100).length} Days
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Total days with 100% rule compliance</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* Column 1 & 2: Rule Book list & form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/30 p-6 backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-md font-bold text-white tracking-tight flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-500" />
                  Your Trading Rule Book
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Define constraints to calculate your discipline scores</p>
              </div>
              <button
                onClick={() => setShowAddRule(!showAddRule)}
                className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/10"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Rule
              </button>
            </div>

            {showAddRule && (
              <form onSubmit={handleCreateRule} className="mt-4 border border-slate-800 rounded-lg p-4 bg-[#080c14] space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Rule Name</label>
                    <input
                      type="text"
                      required
                      value={newRuleName}
                      onChange={(e) => setNewRuleName(e.target.value)}
                      placeholder="e.g. Never add to a losing trade"
                      className="w-full rounded border border-slate-800 bg-[#080c14] px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Penalty Score Deduction (1-50)</label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={newRulePenalty}
                      onChange={(e) => setNewRulePenalty(Number(e.target.value))}
                      className="w-full rounded border border-slate-800 bg-[#080c14] px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Rule Description</label>
                  <input
                    type="text"
                    value={newRuleDesc}
                    onChange={(e) => setNewRuleDesc(e.target.value)}
                    placeholder="Brief detail of why this rule is critical..."
                    className="w-full rounded border border-slate-800 bg-[#080c14] px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddRule(false)}
                    className="rounded px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                  >
                    Save Rule
                  </button>
                </div>
              </form>
            )}

            {/* Rules list */}
            <div className="mt-6 space-y-3">
              {rules.length === 0 ? (
                <p className="text-center py-6 text-xs text-slate-500">No trading rules configured yet. Create one to start grading discipline.</p>
              ) : (
                rules.map((rule) => (
                  <div 
                    key={rule.id}
                    className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-950/20 p-4 hover:border-slate-700/60 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-200">{rule.rule_name}</span>
                        <span className="rounded bg-rose-500/10 px-1.5 py-0.5 text-[9px] font-bold text-rose-400">
                          -{rule.penalty_score} penalty
                        </span>
                      </div>
                      {rule.description && (
                        <p className="text-[11px] text-slate-500">{rule.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      className="rounded p-1.5 text-slate-500 hover:bg-slate-800 hover:text-red-400 transition-colors"
                      title="Delete Rule"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Column 3: Daily review entry */}
        <div>
          <div className="rounded-xl border border-slate-800/85 bg-slate-900/35 p-6 backdrop-blur-md">
            <h3 className="text-md font-bold text-white tracking-tight flex items-center gap-2 border-b border-slate-800 pb-4">
              <Smile className="h-5 w-5 text-blue-400" />
              Daily Review Log
            </h3>

            <form onSubmit={handleSaveReview} className="mt-4 space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Select Date</label>
                <input
                  type="date"
                  required
                  value={reviewDate}
                  onChange={(e) => setReviewDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-[#080c14] px-3.5 py-2 text-xs text-slate-200 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Trader Mood</label>
                  <select
                    value={mood}
                    onChange={(e) => setMood(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-[#080c14] px-3 py-2 text-xs text-slate-200 focus:outline-none"
                  >
                    <option value="Calm">Calm & Patient</option>
                    <option value="Anxious">Anxious / Stressed</option>
                    <option value="Greedy">Greedy / Impulsive</option>
                    <option value="Fearful">Fearful / Hesitant</option>
                    <option value="Angry">Frustrated / Revengeful</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Market State</label>
                  <select
                    value={marketCond}
                    onChange={(e) => setMarketCond(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-[#080c14] px-3 py-2 text-xs text-slate-200 focus:outline-none"
                  >
                    <option value="Trending">Trending Markets</option>
                    <option value="Sideways">Sideways Range</option>
                    <option value="Volatile">High Volatility</option>
                    <option value="Choppy">Choppy / Fakeouts</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Mistakes Made</label>
                <input
                  type="text"
                  value={mistakes}
                  onChange={(e) => setMistakes(e.target.value)}
                  placeholder="e.g. Overtrading, Added to Losers"
                  className="w-full rounded-lg border border-slate-800 bg-[#080c14] px-3.5 py-2 text-xs text-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Daily Review Notes</label>
                <textarea
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Document your psychological states today..."
                  className="w-full rounded-lg border border-slate-800 bg-[#080c14] px-3.5 py-2 text-xs text-slate-200 focus:outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-blue-600 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/10 flex items-center justify-center gap-1.5"
              >
                {saveSuccess ? (
                  <>
                    <Check className="h-4 w-4" />
                    Review Saved
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Log Daily Mental state
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
