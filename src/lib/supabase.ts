import { createClient } from '@supabase/supabase-js';
import * as mockDb from './mockDb';
import { Journal, Trade, Strategy, RuleBook, RuleViolation, DailyReview, FeedbackSubmission, Profile } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// True if Supabase credentials are configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Helper to calculate P&L and Segment transaction taxes on the client side
function calculateTradePnLAndCharges(trade: any) {
  let gross_pnl = 0;
  if (trade.exit_price !== null && trade.exit_price !== undefined) {
    gross_pnl = trade.direction === 'LONG'
      ? (trade.exit_price - trade.entry_price) * trade.quantity
      : (trade.entry_price - trade.exit_price) * trade.quantity;
  }
  
  let brokerage = Number(trade.brokerage) || 0;
  let stt = Number(trade.stt) || 0;
  let gst = Number(trade.gst) || 0;
  let exchange_charges = Number(trade.exchange_charges) || 0;
  let stamp_duty = Number(trade.stamp_duty) || 0;
  let sebi_charges = Number(trade.sebi_charges) || 0;
  
  const isZeroCharges = (brokerage + stt + gst + exchange_charges + stamp_duty + sebi_charges) === 0;
  
  if (isZeroCharges && trade.exit_price) {
    const volume = (trade.entry_price + trade.exit_price) * trade.quantity;
    if (trade.exchange === 'NSE' || trade.exchange === 'BSE') {
      if (trade.segment === 'Options') {
        brokerage = 40.00;
        stt = Number((trade.exit_price * trade.quantity * 0.00125).toFixed(2));
        exchange_charges = Number((volume * 0.0005).toFixed(2));
        gst = Number(((brokerage + exchange_charges) * 0.18).toFixed(2));
        stamp_duty = trade.direction === 'LONG' ? Number((trade.entry_price * trade.quantity * 0.00003).toFixed(2)) : 0;
        sebi_charges = Number((volume * 0.000001).toFixed(2));
      } else if (trade.segment === 'Equity') {
        brokerage = 0.00;
        stt = Number((volume * 0.001).toFixed(2));
        exchange_charges = Number((volume * 0.0000345).toFixed(2));
        gst = Number(((brokerage + exchange_charges) * 0.18).toFixed(2));
        stamp_duty = trade.direction === 'LONG' ? Number((trade.entry_price * trade.quantity * 0.00015).toFixed(2)) : 0;
        sebi_charges = Number((volume * 0.000001).toFixed(2));
      } else { // Futures
        brokerage = 40.00;
        stt = Number((trade.exit_price * trade.quantity * 0.000125).toFixed(2));
        exchange_charges = Number((volume * 0.0002).toFixed(2));
        gst = Number(((brokerage + exchange_charges) * 0.18).toFixed(2));
        stamp_duty = trade.direction === 'LONG' ? Number((trade.entry_price * trade.quantity * 0.00002).toFixed(2)) : 0;
        sebi_charges = Number((volume * 0.000001).toFixed(2));
      }
    } else { // Global Forex/Crypto
      brokerage = Number((volume * 0.0004).toFixed(2));
    }
  }

  const total_charges = Number((brokerage + stt + gst + exchange_charges + stamp_duty + sebi_charges).toFixed(2));
  const net_pnl = Number((gross_pnl - total_charges).toFixed(2));

  return {
    gross_pnl: Number(gross_pnl.toFixed(2)),
    brokerage,
    stt,
    gst,
    exchange_charges,
    stamp_duty,
    sebi_charges,
    total_charges,
    net_pnl
  };
}

/**
 * Unified DB Client Layer.
 * Intercepts all calls and redirects to mockDb if Supabase env vars are missing.
 * This guarantees the application works out-of-the-box locally.
 */
export const db = {
  auth: {
    getCurrentUser: async (): Promise<Profile | null> => {
      if (!isSupabaseConfigured) {
        return mockDb.mockAuth.getCurrentUser();
      }
      
      const { data: { user } } = await supabase!.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase!
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (error || !data) return null;
      return data as Profile;
    },

    login: async (email: string, adminMode = false): Promise<Profile> => {
      if (!isSupabaseConfigured) {
        return mockDb.mockAuth.login(email, adminMode);
      }
      throw new Error("Supabase auth login must be handled via db.auth.signIn or db.auth.signUp when connected.");
    },

    signUp: async (email: string, password: string): Promise<Profile> => {
      if (!isSupabaseConfigured) {
        return mockDb.mockAuth.login(email, false);
      }
      const { data, error } = await supabase!.auth.signUp({ email, password });
      if (error) throw error;
      if (!data.user) throw new Error("Sign up returned no user data");

      // Wait a moment for trigger profile hydration
      let profile: Profile | null = null;
      for (let i = 0; i < 6; i++) {
        const { data: p } = await supabase!
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
        if (p) {
          profile = p as Profile;
          break;
        }
        await new Promise(r => setTimeout(r, 400));
      }
      if (!profile) throw new Error("Verification profile not ready. Please reload page.");
      return profile;
    },

    signIn: async (email: string, password: string): Promise<Profile> => {
      if (!isSupabaseConfigured) {
        return mockDb.mockAuth.login(email, false);
      }
      const { data, error } = await supabase!.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (!data.user) throw new Error("Invalid sign in session");

      const { data: profile, error: pError } = await supabase!
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (pError || !profile) throw new Error("Hydration failed. Check schema.sql triggers.");
      return profile as Profile;
    },

    signInWithGoogle: async (): Promise<void> => {
      if (!isSupabaseConfigured) {
        mockDb.mockAuth.login('google-trader@gullytrader.in', false);
        return;
      }
      const { error } = await supabase!.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/dashboard` : undefined
        }
      });
      if (error) throw error;
    },

    logout: async (): Promise<void> => {
      if (!isSupabaseConfigured) {
        return mockDb.mockAuth.logout();
      }
      await supabase!.auth.signOut();
    }
  },

  journals: {
    list: async (userId: string, includeDeleted = false): Promise<Journal[]> => {
      if (!isSupabaseConfigured) {
        return mockDb.mockJournals.list(userId, includeDeleted);
      }
      
      let query = supabase!
        .from('journals')
        .select('*')
        .eq('user_id', userId);
        
      if (!includeDeleted) {
        query = query.is('deleted_at', null);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Journal[];
    },

    listDeleted: async (userId: string): Promise<Journal[]> => {
      if (!isSupabaseConfigured) {
        return mockDb.mockJournals.listDeleted(userId);
      }
      
      // Get journals deleted in last 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase!
        .from('journals')
        .select('*')
        .eq('user_id', userId)
        .not('deleted_at', 'is', null)
        .gte('deleted_at', thirtyDaysAgo);
        
      if (error) throw error;
      return (data || []) as Journal[];
    },

    create: async (journal: Omit<Journal, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>): Promise<Journal> => {
      if (!isSupabaseConfigured) {
        return mockDb.mockJournals.create(journal);
      }
      
      const { data, error } = await supabase!
        .from('journals')
        .insert([journal])
        .select()
        .single();
        
      if (error) throw error;
      return data as Journal;
    },

    update: async (id: string, updates: Partial<Journal>): Promise<Journal> => {
      if (!isSupabaseConfigured) {
        return mockDb.mockJournals.update(id, updates);
      }
      
      const { data, error } = await supabase!
        .from('journals')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      return data as Journal;
    },

    softDelete: async (id: string): Promise<Journal> => {
      if (!isSupabaseConfigured) {
        return mockDb.mockJournals.softDelete(id);
      }
      return db.journals.update(id, { deleted_at: new Date().toISOString() });
    },

    recover: async (id: string): Promise<Journal> => {
      if (!isSupabaseConfigured) {
        return mockDb.mockJournals.recover(id);
      }
      return db.journals.update(id, { deleted_at: null });
    },

    hardDelete: async (id: string): Promise<void> => {
      if (!isSupabaseConfigured) {
        return mockDb.mockJournals.hardDelete(id);
      }
      const { error } = await supabase!
        .from('journals')
        .delete()
        .eq('id', id);
      if (error) throw error;
    }
  },

  trades: {
    list: async (userId: string, journalId?: string): Promise<Trade[]> => {
      if (!isSupabaseConfigured) {
        return mockDb.mockTrades.list(userId, journalId);
      }

      let query = supabase!
        .from('trades')
        .select(`
          *,
          strategies(name),
          trade_tags(tag)
        `)
        .eq('user_id', userId);

      if (journalId) {
        query = query.eq('journal_id', journalId);
      }

      const { data, error } = await query.order('trade_date', { ascending: false });
      if (error) throw error;
      
      // Expose tags and map strategy names
      const listData = (data || []).map((t: any) => ({
        ...t,
        strategy_name: t.strategies?.name || undefined,
        tags: t.trade_tags?.map((tt: any) => tt.tag) || []
      }));

      return listData as Trade[];
    },

    create: async (trade: Omit<Trade, 'id' | 'created_at' | 'updated_at' | 'gross_pnl' | 'net_pnl' | 'total_charges'> & { tags?: string[] }): Promise<Trade> => {
      if (!isSupabaseConfigured) {
        return mockDb.mockTrades.create(trade);
      }

      const { tags, ...tradeDetails } = trade;

      // Automatically calculate P&L and Charges
      const calculated = calculateTradePnLAndCharges(tradeDetails);
      const fullTradePayload = { ...tradeDetails, ...calculated };

      // Real Supabase insert
      const { data, error } = await supabase!
        .from('trades')
        .insert([fullTradePayload])
        .select()
        .single();

      if (error) throw error;
      const createdTrade = data as Trade;

      // Add tags if provided
      if (tags && tags.length > 0) {
        const tagInserts = tags.map(tag => ({ trade_id: createdTrade.id, tag }));
        await supabase!.from('trade_tags').insert(tagInserts);
        createdTrade.tags = tags;
      }

      return createdTrade;
    },

    update: async (id: string, updates: Partial<Trade> & { tags?: string[] }): Promise<Trade> => {
      if (!isSupabaseConfigured) {
        return mockDb.mockTrades.update(id, updates);
      }

      const { tags, ...tradeUpdates } = updates;

      // Fetch existing trade to execute full P&L calculation accurately
      const { data: existing, error: getErr } = await supabase!
        .from('trades')
        .select('*')
        .eq('id', id)
        .single();

      if (getErr || !existing) throw new Error("Could not find trade to update");

      const merged = { ...existing, ...tradeUpdates };
      const calculated = calculateTradePnLAndCharges(merged);
      const fullUpdatePayload = { ...tradeUpdates, ...calculated };

      const { data, error } = await supabase!
        .from('trades')
        .update({ ...fullUpdatePayload, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      const updatedTrade = data as Trade;

      if (tags !== undefined) {
        // Clear existing tags and insert new
        await supabase!.from('trade_tags').delete().eq('trade_id', id);
        if (tags.length > 0) {
          const tagInserts = tags.map(tag => ({ trade_id: id, tag }));
          await supabase!.from('trade_tags').insert(tagInserts);
        }
        updatedTrade.tags = tags;
      }

      return updatedTrade;
    },

    delete: async (id: string): Promise<void> => {
      if (!isSupabaseConfigured) {
        return mockDb.mockTrades.delete(id);
      }
      const { error } = await supabase!
        .from('trades')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },

    checkDuplicate: async (trade: { journal_id: string; trade_date: string; symbol: string; entry_price: number; quantity: number; direction: 'LONG' | 'SHORT' }): Promise<boolean> => {
      if (!isSupabaseConfigured) {
        return mockDb.mockTrades.checkDuplicate(trade);
      }
      const { data, error } = await supabase!
        .from('trades')
        .select('id')
        .match({
          journal_id: trade.journal_id,
          trade_date: trade.trade_date,
          symbol: trade.symbol,
          entry_price: trade.entry_price,
          quantity: trade.quantity,
          direction: trade.direction
        });
      if (error) throw error;
      return (data || []).length > 0;
    }
  },

  strategies: {
    list: async (userId: string): Promise<Strategy[]> => {
      if (!isSupabaseConfigured) {
        return mockDb.mockStrategies.list(userId);
      }
      const { data, error } = await supabase!
        .from('strategies')
        .select('*')
        .eq('user_id', userId);
      if (error) throw error;
      return (data || []) as Strategy[];
    },

    create: async (strategy: Omit<Strategy, 'id' | 'created_at'>): Promise<Strategy> => {
      if (!isSupabaseConfigured) {
        return mockDb.mockStrategies.create(strategy);
      }
      const { data, error } = await supabase!
        .from('strategies')
        .insert([strategy])
        .select()
        .single();
      if (error) throw error;
      return data as Strategy;
    }
  },

  psychology: {
    listRules: async (userId: string): Promise<RuleBook[]> => {
      if (!isSupabaseConfigured) {
        return mockDb.mockPsychology.listRules(userId);
      }
      const { data, error } = await supabase!
        .from('rule_books')
        .select('*')
        .eq('user_id', userId);
      if (error) throw error;
      return (data || []) as RuleBook[];
    },

    createRule: async (rule: Omit<RuleBook, 'id' | 'created_at'>): Promise<RuleBook> => {
      if (!isSupabaseConfigured) {
        return mockDb.mockPsychology.createRule(rule);
      }
      const { data, error } = await supabase!
        .from('rule_books')
        .insert([rule])
        .select()
        .single();
      if (error) throw error;
      return data as RuleBook;
    },

    updateRule: async (id: string, updates: Partial<RuleBook>): Promise<RuleBook> => {
      if (!isSupabaseConfigured) {
        return mockDb.mockPsychology.updateRule(id, updates);
      }
      const { data, error } = await supabase!
        .from('rule_books')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as RuleBook;
    },

    deleteRule: async (id: string): Promise<void> => {
      if (!isSupabaseConfigured) {
        return mockDb.mockPsychology.deleteRule(id);
      }
      const { error } = await supabase!
        .from('rule_books')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },

    listViolationsForTrade: async (tradeId: string): Promise<RuleViolation[]> => {
      if (!isSupabaseConfigured) {
        return mockDb.mockPsychology.listViolationsForTrade(tradeId);
      }
      const { data, error } = await supabase!
        .from('rule_violations')
        .select(`
          *,
          rule_books(rule_name)
        `)
        .eq('trade_id', tradeId);
      if (error) throw error;
      return (data || []).map((v: any) => ({
        ...v,
        rule_name: v.rule_books?.rule_name || 'Unknown Rule'
      })) as RuleViolation[];
    },

    logViolation: async (violation: Omit<RuleViolation, 'id' | 'violated_at'>): Promise<RuleViolation> => {
      if (!isSupabaseConfigured) {
        return mockDb.mockPsychology.logViolation(violation);
      }
      const { data, error } = await supabase!
        .from('rule_violations')
        .insert([violation])
        .select()
        .single();
      if (error) throw error;
      return data as RuleViolation;
    },

    removeViolation: async (tradeId: string, ruleId: string): Promise<void> => {
      if (!isSupabaseConfigured) {
        return mockDb.mockPsychology.removeViolation(tradeId, ruleId);
      }
      const { error } = await supabase!
        .from('rule_violations')
        .delete()
        .match({ trade_id: tradeId, rule_id: ruleId });
      if (error) throw error;
    },

    listDailyReviews: async (userId: string): Promise<DailyReview[]> => {
      if (!isSupabaseConfigured) {
        return mockDb.mockPsychology.listDailyReviews(userId);
      }
      const { data, error } = await supabase!
        .from('daily_reviews')
        .select('*')
        .eq('user_id', userId);
      if (error) throw error;
      return (data || []) as DailyReview[];
    },

    saveDailyReview: async (review: Omit<DailyReview, 'id' | 'created_at'>): Promise<DailyReview> => {
      if (!isSupabaseConfigured) {
        return mockDb.mockPsychology.saveDailyReview(review);
      }
      
      const { data, error } = await supabase!
        .from('daily_reviews')
        .upsert(review, { onConflict: 'user_id, review_date' })
        .select()
        .single();
        
      if (error) throw error;
      return data as DailyReview;
    }
  },

  admin: {
    listFeedback: async (): Promise<FeedbackSubmission[]> => {
      if (!isSupabaseConfigured) {
        return mockDb.mockAdmin.listFeedback();
      }
      const { data, error } = await supabase!
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as FeedbackSubmission[];
    },

    createFeedback: async (email: string, subject: string, message: string, userId?: string | null): Promise<FeedbackSubmission> => {
      if (!isSupabaseConfigured) {
        return mockDb.mockAdmin.createFeedback(email, subject, message, userId);
      }
      const { data, error } = await supabase!
        .from('feedback')
        .insert([{ email, subject, message, user_id: userId || null }])
        .select()
        .single();
      if (error) throw error;
      return data as FeedbackSubmission;
    },

    updateFeedbackStatus: async (id: string, status: 'OPEN' | 'RESOLVED' | 'CLOSED'): Promise<void> => {
      if (!isSupabaseConfigured) {
        return mockDb.mockAdmin.updateFeedbackStatus(id, status);
      }
      const { error } = await supabase!
        .from('feedback')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },

    getStats: async () => {
      if (!isSupabaseConfigured) {
        return mockDb.mockAdmin.getStats();
      }
      
      // Aggregate stats from supabase tables
      const { count: userCount } = await supabase!.from('profiles').select('*', { count: 'exact', head: true }).eq('is_admin', false);
      const { count: journalCount } = await supabase!.from('journals').select('*', { count: 'exact', head: true }).is('deleted_at', null);
      const { count: tradeCount } = await supabase!.from('trades').select('*', { count: 'exact', head: true });
      const { count: fbCount } = await supabase!.from('feedback').select('*', { count: 'exact', head: true }).eq('status', 'OPEN');
      
      return {
        totalUsers: userCount || 0,
        totalJournals: journalCount || 0,
        totalTrades: tradeCount || 0,
        pendingFeedback: fbCount || 0
      };
    }
  }
};
export type DBClient = typeof db;
