'use client';

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Users, 
  BookOpen, 
  MessageSquare, 
  History, 
  Globe, 
  FileText, 
  Check, 
  X, 
  Save,
  Plus
} from 'lucide-react';
import { db } from '../../lib/supabase';
import { FeedbackSubmission } from '../../lib/types';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<'stats' | 'feedback' | 'content'>('stats');
  const [stats, setStats] = useState({ totalUsers: 0, totalJournals: 0, totalTrades: 0, pendingFeedback: 0 });
  const [feedbacks, setFeedbacks] = useState<FeedbackSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  // Content manager form state
  const [blogTitle, setBlogTitle] = useState('');
  const [blogSlug, setBlogSlug] = useState('');
  const [blogMarkdown, setBlogMarkdown] = useState('');
  const [contentSaved, setContentSaved] = useState(false);

  useEffect(() => {
    async function loadAdminData() {
      try {
        const s = await db.admin.getStats();
        const fb = await db.admin.listFeedback();
        setStats(s);
        setFeedbacks(fb);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadAdminData();
  }, []);

  const handleResolveFeedback = async (id: string) => {
    try {
      await db.admin.updateFeedbackStatus(id, 'RESOLVED');
      setFeedbacks(feedbacks.map(f => f.id === id ? { ...f, status: 'RESOLVED' as const } : f));
      
      // Update stats count
      setStats(prev => ({
        ...prev,
        pendingFeedback: Math.max(0, prev.pendingFeedback - 1)
      }));
    } catch (err) {
      alert('Error updating feedback status');
    }
  };

  const handleCreateBlogMock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!blogTitle || !blogSlug) return;
    
    setContentSaved(true);
    setTimeout(() => {
      setContentSaved(false);
      setBlogTitle('');
      setBlogSlug('');
      setBlogMarkdown('');
    }, 2000);
  };

  if (loading) {
    return <div className="text-center py-12 text-slate-500 text-xs">Loading Admin details...</div>;
  }

  return (
    <div className="space-y-6">
      
      {/* Banner */}
      <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Shield className="h-5 w-5 text-purple-400" />
          <div>
            <h4 className="text-sm font-bold text-white uppercase">System Administrative Console</h4>
            <p className="text-[10px] text-slate-500">Manage platform statistics, feedback queries, and dynamic SEO pages.</p>
          </div>
        </div>
        <div className="hidden sm:flex overflow-x-auto rounded-lg bg-slate-950 p-1 border border-slate-800/40">
          {(['stats', 'feedback', 'content'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded px-3 py-1 text-[10px] uppercase font-bold transition-all ${
                activeTab === tab
                  ? 'bg-purple-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs for mobile */}
      <div className="flex sm:hidden overflow-x-auto rounded-lg bg-slate-950 p-1 border border-slate-800/40">
        {(['stats', 'feedback', 'content'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded py-1.5 text-[10px] uppercase font-bold transition-all ${
              activeTab === tab ? 'bg-purple-600 text-white' : 'text-slate-400'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* TAB 1: Stats */}
      {activeTab === 'stats' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total System Users</span>
              <Users className="h-4 w-4 text-purple-400" />
            </div>
            <h3 className="text-3xl font-bold tracking-tight text-white mt-3">{stats.totalUsers}</h3>
            <p className="text-[10px] text-slate-500 mt-1">Mock user registration list count</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Active Journals</span>
              <BookOpen className="h-4 w-4 text-purple-400" />
            </div>
            <h3 className="text-3xl font-bold tracking-tight text-white mt-3">{stats.totalJournals}</h3>
            <p className="text-[10px] text-slate-500 mt-1">Excludes soft-deleted journals</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Closed Trades</span>
              <History className="h-4 w-4 text-purple-400" />
            </div>
            <h3 className="text-3xl font-bold tracking-tight text-white mt-3">{stats.totalTrades}</h3>
            <p className="text-[10px] text-slate-500 mt-1">Total database record transactions</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pending Feedback</span>
              <MessageSquare className="h-4 w-4 text-purple-400" />
            </div>
            <h3 className="text-3xl font-bold tracking-tight text-white mt-3">{stats.pendingFeedback}</h3>
            <p className="text-[10px] text-slate-500 mt-1">Queries currently unresolved</p>
          </div>
        </div>
      )}

      {/* TAB 2: Feedback log */}
      {activeTab === 'feedback' && (
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/30 p-6 backdrop-blur-md">
          <h3 className="text-sm font-bold text-white tracking-tight border-b border-slate-800 pb-3 uppercase mb-4">
            Pending Support Queries
          </h3>

          <div className="space-y-4">
            {feedbacks.length === 0 ? (
              <p className="text-center py-6 text-xs text-slate-500">No feedback submissions found.</p>
            ) : (
              feedbacks.map((fb) => (
                <div 
                  key={fb.id} 
                  className={`rounded-lg border p-4 transition-colors ${
                    fb.status === 'OPEN' ? 'border-amber-500/20 bg-amber-500/5' : 'border-slate-800 bg-slate-950/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-200">{fb.subject}</span>
                        <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                          fb.status === 'OPEN' ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-800 text-slate-500'
                        }`}>
                          {fb.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">From: {fb.email} • {new Date(fb.created_at).toLocaleString()}</p>
                      <p className="text-xs text-slate-300 mt-2.5 leading-relaxed bg-[#080c14] p-3 rounded border border-slate-850">
                        {fb.message}
                      </p>
                    </div>
                    {fb.status === 'OPEN' && (
                      <button
                        onClick={() => handleResolveFeedback(fb.id)}
                        className="rounded bg-emerald-600 px-3 py-1.5 text-[10px] font-semibold text-white hover:bg-emerald-700 transition-colors flex items-center gap-1 shrink-0"
                      >
                        <Check className="h-3 w-3" />
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Content editor */}
      {activeTab === 'content' && (
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/30 p-6 backdrop-blur-md space-y-6">
          
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white tracking-tight uppercase">
              Manage SEO Blogs & Templates
            </h3>
            <span className="text-[9px] bg-slate-850 px-2 py-0.5 text-slate-400 font-bold uppercase rounded">
              Local Mock Draft Mode
            </span>
          </div>

          <form onSubmit={handleCreateBlogMock} className="space-y-4 max-w-xl">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Guide / Blog Title</label>
                <input
                  type="text"
                  required
                  value={blogTitle}
                  onChange={(e) => {
                    setBlogTitle(e.target.value);
                    setBlogSlug(e.target.value.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''));
                  }}
                  placeholder="e.g. Zerodha Option Charges Explained"
                  className="w-full rounded border border-slate-800 bg-[#080c14] px-3.5 py-2 text-xs text-slate-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">SEO URL Slug</label>
                <div className="flex rounded border border-slate-850 bg-[#080c14] overflow-hidden">
                  <span className="bg-slate-950 px-2 py-2 text-[10px] text-slate-500 select-none">/guides/</span>
                  <input
                    type="text"
                    required
                    value={blogSlug}
                    onChange={(e) => setBlogSlug(e.target.value)}
                    className="flex-1 bg-transparent px-2 text-xs text-slate-200 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Markdown Content Body</label>
              <textarea
                rows={6}
                required
                value={blogMarkdown}
                onChange={(e) => setBlogMarkdown(e.target.value)}
                placeholder="# Detailed Guide Header..."
                className="w-full rounded border border-slate-800 bg-[#080c14] px-3.5 py-2 text-xs text-slate-200 focus:outline-none resize-none font-mono"
              />
            </div>

            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 shadow-md shadow-blue-500/10 flex items-center gap-1.5"
            >
              {contentSaved ? (
                <>
                  <Check className="h-4 w-4" />
                  Guide Draft Saved
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Publish Guide
                </>
              )}
            </button>
          </form>
        </div>
      )}

    </div>
  );
}
