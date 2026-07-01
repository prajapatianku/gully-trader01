'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  TrendingUp, 
  LayoutDashboard, 
  BookOpen, 
  History, 
  Brain, 
  ShieldAlert, 
  Share2, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  User, 
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { db, isSupabaseConfigured } from '../../lib/supabase';
import { Profile } from '../../lib/types';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<Profile | null>(null);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  
  // Feedback Form State
  const [fbSubject, setFbSubject] = useState('');
  const [fbMessage, setFbMessage] = useState('');
  const [fbEmail, setFbEmail] = useState('');
  const [fbSuccess, setFbSuccess] = useState(false);

  useEffect(() => {
    async function loadUser() {
      const u = await db.auth.getCurrentUser();
      setUser(u);
      if (u) {
        setFbEmail(u.email);
      }
    }
    loadUser();
  }, [pathname]);

  const handleMockLogin = async (email: string, isAdmin: boolean) => {
    const profile = await db.auth.login(email, isAdmin);
    setUser(profile);
    setShowRoleMenu(false);
    // Refresh page/route
    window.location.reload();
  };

  const handleLogout = async () => {
    await db.auth.logout();
    setUser(null);
    router.push('/');
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fbSubject || !fbMessage || !fbEmail) return;
    
    await db.admin.createFeedback(fbEmail, fbSubject, fbMessage, user?.id);
    setFbSuccess(true);
    setFbSubject('');
    setFbMessage('');
    setTimeout(() => {
      setFeedbackOpen(false);
      setFbSuccess(false);
    }, 2000);
  };

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Journals', href: '/journals', icon: BookOpen },
    { name: 'Trades', href: '/trades', icon: History },
    { name: 'Psychology', href: '/psychology', icon: Brain },
    { name: 'Risk Tools', href: '/risk', icon: ShieldAlert },
    { name: 'Share Cards', href: '/share', icon: Share2 },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-[#080c14]/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-600 to-teal-400 font-bold text-white shadow-md shadow-blue-500/20">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-xl font-bold tracking-tight text-transparent">
                  Gully<span className="from-blue-400 to-teal-400 text-blue-400">Trader</span>
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-1">
              {navItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive 
                        ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' 
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
              {user?.is_admin && (
                <Link
                  href="/admin"
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    pathname.startsWith('/admin')
                      ? 'bg-purple-600/10 text-purple-400 border border-purple-500/20'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'
                  }`}
                >
                  <Settings className="h-4 w-4" />
                  Admin Panel
                </Link>
              )}
            </nav>

            {/* Right Buttons / Auth */}
            <div className="hidden md:flex items-center gap-3">
              {/* Support/Feedback Trigger */}
              <button
                onClick={() => setFeedbackOpen(true)}
                className="flex items-center gap-1.5 rounded-lg border border-slate-800 px-3 py-1.5 text-xs text-slate-400 transition-colors hover:bg-slate-800/50 hover:text-slate-200"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Feedback
              </button>

              {/* Mock Switcher Dropdown (only when Supabase is offline) */}
              {!isSupabaseConfigured && (
                <div className="relative">
                  <button
                    onClick={() => setShowRoleMenu(!showRoleMenu)}
                    className="flex items-center gap-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 px-3 py-1.5 text-xs text-teal-400 font-medium transition-colors hover:bg-slate-800"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-teal-400 pulse-glow-dot" />
                    Role: {user?.is_admin ? 'Admin' : 'Trader'}
                  </button>

                  {showRoleMenu && (
                    <div className="absolute right-0 mt-2 w-48 rounded-lg border border-slate-800 bg-[#0f172a] p-1.5 shadow-xl glow-primary">
                      <div className="px-2 py-1.5 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                        Switch Identity (Mock)
                      </div>
                      <button
                        onClick={() => handleMockLogin('trader@gullytrader.in', false)}
                        className="w-full text-left rounded px-2 py-1.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-white"
                      >
                        Trader Account
                      </button>
                      <button
                        onClick={() => handleMockLogin('admin@gullytrader.in', true)}
                        className="w-full text-left rounded px-2 py-1.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-white font-semibold"
                      >
                        Admin Account
                      </button>
                    </div>
                  )}
                </div>
              )}

              {user ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 border-l border-slate-800 pl-3">
                    {user.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={user.avatar_url} 
                        alt="Avatar" 
                        className="h-8 w-8 rounded-full border border-slate-700"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 border border-slate-700 text-xs">
                        <User className="h-4 w-4" />
                      </div>
                    )}
                    <div className="text-left leading-none">
                      <p className="text-xs font-semibold text-slate-200">{user.full_name || 'Trader'}</p>
                      <span className="text-[10px] text-slate-500">{user.email}</span>
                    </div>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800/40 transition-colors"
                    title="Log Out"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <Link
                  href="/auth"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-700 shadow-md shadow-blue-600/10"
                >
                  Log In
                </Link>
              )}
            </div>

            {/* Mobile menu trigger */}
            <div className="flex items-center md:hidden gap-2">
              {!isSupabaseConfigured && (
                <button
                  onClick={() => handleMockLogin(user?.is_admin ? 'trader@gullytrader.in' : 'admin@gullytrader.in', !user?.is_admin)}
                  className="rounded bg-slate-800 px-2.5 py-1 text-[10px] text-teal-400 border border-slate-700"
                >
                  Role: {user?.is_admin ? 'Admin' : 'Trader'}
                </button>
              )}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu panel */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800 bg-[#080c14] px-4 py-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-base font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            ))}
            {user?.is_admin && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-base font-medium text-purple-400 hover:bg-slate-800 hover:text-white"
              >
                <Settings className="h-5 w-5" />
                Admin Panel
              </Link>
            )}
            
            <div className="pt-4 border-t border-slate-800 mt-2 space-y-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setFeedbackOpen(true);
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-base font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                <MessageSquare className="h-5 w-5" />
                Platform Feedback
              </button>

              {user ? (
                <div className="flex items-center justify-between px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-xs">
                      <User className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-200">{user.full_name}</p>
                      <p className="text-[10px] text-slate-500">{user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1 text-xs text-red-400"
                  >
                    <LogOut className="h-4 w-4" /> Log Out
                  </button>
                </div>
              ) : (
                <Link
                  href="/auth"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Log In
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Support / Feedback Modal */}
      {feedbackOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-[#0f172a] p-6 shadow-2xl glow-primary">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-500" />
                Submit Platform Feedback
              </h3>
              <button 
                onClick={() => setFeedbackOpen(false)}
                className="text-slate-500 hover:text-slate-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {fbSuccess ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                  ✓
                </div>
                <h4 className="text-sm font-semibold text-slate-200">Thank you for your feedback!</h4>
                <p className="text-xs text-slate-500 mt-1">Our team has received your submission.</p>
              </div>
            ) : (
              <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Your Email</label>
                  <input
                    type="email"
                    required
                    value={fbEmail}
                    onChange={(e) => setFbEmail(e.target.value)}
                    placeholder="trader@gmail.com"
                    className="w-full rounded-lg border border-slate-800 bg-[#080c14] px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Subject</label>
                  <input
                    type="text"
                    required
                    value={fbSubject}
                    onChange={(e) => setFbSubject(e.target.value)}
                    placeholder="e.g. Feature Request, Bug Report"
                    className="w-full rounded-lg border border-slate-800 bg-[#080c14] px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Message</label>
                  <textarea
                    required
                    rows={4}
                    value={fbMessage}
                    onChange={(e) => setFbMessage(e.target.value)}
                    placeholder="Tell us what we can improve..."
                    className="w-full rounded-lg border border-slate-800 bg-[#080c14] px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-md shadow-blue-600/10"
                >
                  Send Feedback
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
