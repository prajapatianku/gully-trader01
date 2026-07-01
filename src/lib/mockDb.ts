import { Journal, Trade, Strategy, RuleBook, RuleViolation, DailyReview, FeedbackSubmission, SEOPage, Profile } from './types';

// Mock DB Utility using LocalStorage
const MOCK_DB_PREFIX = 'gully_trader_';

// Initial Seed Data Definitions
const SEED_USER_ID = 'user-12345';
const ADMIN_USER_ID = 'admin-67890';

const DEFAULT_PROFILE: Profile = {
  id: SEED_USER_ID,
  email: 'trader@gullytrader.in',
  full_name: 'Ankit Sharma',
  avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
  is_admin: false,
  created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  updated_at: new Date().toISOString()
};

const DEFAULT_ADMIN_PROFILE: Profile = {
  id: ADMIN_USER_ID,
  email: 'admin@gullytrader.in',
  full_name: 'Gully Trader Admin',
  avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
  is_admin: true,
  created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
  updated_at: new Date().toISOString()
};

const SEED_JOURNALS: Journal[] = [
  {
    id: 'journal-1',
    user_id: SEED_USER_ID,
    name: 'Bank Nifty Scalping',
    base_currency: 'INR',
    market_type: 'Options',
    trading_style: 'Scalping',
    starting_capital: 100000.00,
    default_broker: 'Zerodha',
    created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null
  },
  {
    id: 'journal-2',
    user_id: SEED_USER_ID,
    name: 'Equity Swing Portfolio',
    base_currency: 'INR',
    market_type: 'Equity',
    trading_style: 'Swing',
    starting_capital: 500000.00,
    default_broker: 'Groww',
    created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null
  },
  {
    id: 'journal-3',
    user_id: SEED_USER_ID,
    name: 'Crypto Futures',
    base_currency: 'USD',
    market_type: 'Crypto',
    trading_style: 'Day Trading',
    starting_capital: 2000.00,
    default_broker: 'Binance',
    created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null
  },
  {
    id: 'journal-deleted',
    user_id: SEED_USER_ID,
    name: 'Old Forex Test Journal',
    base_currency: 'USD',
    market_type: 'Forex',
    trading_style: 'Swing',
    starting_capital: 1000.00,
    default_broker: 'OANDA',
    created_at: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // Soft deleted 5 days ago
  }
];

const SEED_STRATEGIES: Strategy[] = [
  { id: 'strat-1', user_id: SEED_USER_ID, name: 'ORB (Opening Range Breakout)', description: 'Buying or selling on first 15min high/low breakout', created_at: new Date().toISOString() },
  { id: 'strat-2', user_id: SEED_USER_ID, name: 'EMA Pullback', description: 'Trend continuation entry at 9/15 EMA pullbacks', created_at: new Date().toISOString() },
  { id: 'strat-3', user_id: SEED_USER_ID, name: 'Support/Resistance Bounce', description: 'Rejection trades at key daily horizontal levels', created_at: new Date().toISOString() }
];

const SEED_RULES: RuleBook[] = [
  { id: 'rule-1', user_id: SEED_USER_ID, rule_name: 'No Overtrading', description: 'Maximum 3 trades per day allowed.', penalty_score: 15, is_active: true, created_at: new Date().toISOString() },
  { id: 'rule-2', user_id: SEED_USER_ID, rule_name: 'Strict Stop Loss', description: 'Always place a stop-loss order in the terminal.', penalty_score: 20, is_active: true, created_at: new Date().toISOString() },
  { id: 'rule-3', user_id: SEED_USER_ID, rule_name: 'No Revenge Trading', description: 'Stop trading for the day after 2 consecutive losses.', penalty_score: 25, is_active: true, created_at: new Date().toISOString() }
];

// Helper to generate trades over the last 20 days
const generateSeedTrades = (): Trade[] => {
  const trades: Trade[] = [];
  const now = new Date();
  
  // Trades for Journal 1 (Bank Nifty Options)
  const symbols = ['BANKNIFTY 48000 CE', 'BANKNIFTY 48200 PE', 'BANKNIFTY 47800 CE'];
  
  // 12 trades spanning 18 days
  for (let i = 0; i < 12; i++) {
    const tradeDate = new Date();
    tradeDate.setDate(now.getDate() - (18 - i));
    
    // Win or loss
    const isWin = i % 3 !== 0;
    const direction = i % 2 === 0 ? 'LONG' : 'SHORT';
    const quantity = 15 * (1 + (i % 3)); // 15, 30, 45 quantity (Lot size 15 for Bank Nifty)
    const entryPrice = 250 + (i * 10);
    const exitPrice = isWin 
      ? entryPrice + 45 + (i * 2) 
      : Math.max(10, entryPrice - 30 - (i % 2 * 10));
      
    const grossPnl = direction === 'LONG' 
      ? (exitPrice - entryPrice) * quantity 
      : (entryPrice - exitPrice) * quantity;
      
    // Est Indian Charges
    const brokerage = 40.00; // buy + sell
    const stt = Number((exitPrice * quantity * 0.00125).toFixed(2));
    const gst = Number(((brokerage + (exitPrice * quantity * 0.0005)) * 0.18).toFixed(2));
    const exchangeCharges = Number((exitPrice * quantity * 0.0005).toFixed(2));
    const stampDuty = direction === 'LONG' ? Number((entryPrice * quantity * 0.00003).toFixed(2)) : 0;
    const sebiCharges = Number((exitPrice * quantity * 0.000001).toFixed(2));
    const totalCharges = Number((brokerage + stt + gst + exchangeCharges + stampDuty + sebiCharges).toFixed(2));
    const netPnl = grossPnl - totalCharges;

    trades.push({
      id: `trade-j1-${i}`,
      user_id: SEED_USER_ID,
      journal_id: 'journal-1',
      trade_date: tradeDate.toISOString().split('T')[0],
      exchange: 'NSE',
      segment: 'Options',
      symbol: symbols[i % symbols.length],
      direction,
      entry_price: entryPrice,
      exit_price: exitPrice,
      quantity,
      entry_time: new Date(tradeDate.setHours(9, 30, 0)).toISOString(),
      exit_time: new Date(tradeDate.setHours(11, 45, 0)).toISOString(),
      status: 'CLOSED',
      gross_pnl: Number(grossPnl.toFixed(2)),
      net_pnl: Number(netPnl.toFixed(2)),
      stop_loss: entryPrice - 30,
      target: entryPrice + 60,
      risk_amount: 1000,
      brokerage,
      stt,
      gst,
      exchange_charges: exchangeCharges,
      stamp_duty: stampDuty,
      sebi_charges: sebiCharges,
      total_charges: totalCharges,
      strategy_id: i % 2 === 0 ? 'strat-1' : 'strat-2',
      notes: isWin ? 'Perfect breakout capture.' : 'Exited because trade did not move and hit SL.',
      exit_reason: isWin ? 'Hit target' : 'Hit Stop Loss',
      lessons_learned: isWin ? 'Hold onto winners.' : 'Cut loss early. Do not average.',
      screenshot_url: null,
      tv_link: null,
      tags: i % 3 === 0 ? ['FOMO', 'Late Entry'] : ['Disciplined'],
      created_at: tradeDate.toISOString(),
      updated_at: tradeDate.toISOString()
    });
  }

  // 6 Equity Swing trades for Journal 2
  const eqSymbols = ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK'];
  for (let i = 0; i < 6; i++) {
    const tradeDate = new Date();
    tradeDate.setDate(now.getDate() - (20 - (i * 3)));
    
    const isWin = i % 2 === 0;
    const quantity = 50 + (i * 10);
    const entryPrice = 1200 + (i * 100);
    const exitPrice = isWin ? entryPrice * 1.05 : entryPrice * 0.98;
    const grossPnl = (exitPrice - entryPrice) * quantity;
    
    const brokerage = 0.00; // Zero brokerage swing
    const stt = Number(((entryPrice + exitPrice) * quantity * 0.001).toFixed(2)); // Swing STT
    const gst = Number((stt * 0.18).toFixed(2));
    const exchangeCharges = Number(((entryPrice + exitPrice) * quantity * 0.00003).toFixed(2));
    const stampDuty = Number((entryPrice * quantity * 0.00015).toFixed(2));
    const sebiCharges = Number(((entryPrice + exitPrice) * quantity * 0.000001).toFixed(2));
    const totalCharges = Number((stt + gst + exchangeCharges + stampDuty + sebiCharges).toFixed(2));
    const netPnl = grossPnl - totalCharges;

    trades.push({
      id: `trade-j2-${i}`,
      user_id: SEED_USER_ID,
      journal_id: 'journal-2',
      trade_date: tradeDate.toISOString().split('T')[0],
      exchange: 'NSE',
      segment: 'Equity',
      symbol: eqSymbols[i % eqSymbols.length],
      direction: 'LONG',
      entry_price: entryPrice,
      exit_price: exitPrice,
      quantity,
      entry_time: new Date(tradeDate.setHours(10, 0, 0)).toISOString(),
      exit_time: new Date(tradeDate.setHours(15, 0, 0)).toISOString(),
      status: 'CLOSED',
      gross_pnl: Number(grossPnl.toFixed(2)),
      net_pnl: Number(netPnl.toFixed(2)),
      stop_loss: entryPrice * 0.97,
      target: entryPrice * 1.08,
      risk_amount: 3000,
      brokerage,
      stt,
      gst,
      exchange_charges: exchangeCharges,
      stamp_duty: stampDuty,
      sebi_charges: sebiCharges,
      total_charges: totalCharges,
      strategy_id: 'strat-3',
      notes: 'Weekly resistance breakout',
      exit_reason: isWin ? 'Target Hit' : 'SL Triggered',
      lessons_learned: 'Position sizing was appropriate.',
      screenshot_url: null,
      tv_link: null,
      tags: ['SwingTrade'],
      created_at: tradeDate.toISOString(),
      updated_at: tradeDate.toISOString()
    });
  }

  // 4 Crypto Trades for Journal 3 (USD currency)
  const crySymbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'];
  for (let i = 0; i < 4; i++) {
    const tradeDate = new Date();
    tradeDate.setDate(now.getDate() - (15 - i * 3));
    
    const isWin = i % 2 === 0;
    const direction = i % 2 === 0 ? 'LONG' : 'SHORT';
    const quantity = 0.05 * (i + 1);
    const entryPrice = 60000 + (i * 2000);
    const exitPrice = direction === 'LONG'
      ? (isWin ? entryPrice * 1.02 : entryPrice * 0.99)
      : (isWin ? entryPrice * 0.98 : entryPrice * 1.01);
      
    const grossPnl = direction === 'LONG' 
      ? (exitPrice - entryPrice) * quantity 
      : (entryPrice - exitPrice) * quantity;
      
    const totalCharges = Number((entryPrice * quantity * 0.0004 + exitPrice * quantity * 0.0004).toFixed(2)); // Binance maker/taker
    const netPnl = grossPnl - totalCharges;

    trades.push({
      id: `trade-j3-${i}`,
      user_id: SEED_USER_ID,
      journal_id: 'journal-3',
      trade_date: tradeDate.toISOString().split('T')[0],
      exchange: 'BINANCE',
      segment: 'Spot',
      symbol: crySymbols[i % crySymbols.length],
      direction,
      entry_price: entryPrice,
      exit_price: exitPrice,
      quantity,
      entry_time: new Date(tradeDate.setHours(18, 0, 0)).toISOString(),
      exit_time: new Date(tradeDate.setHours(21, 30, 0)).toISOString(),
      status: 'CLOSED',
      gross_pnl: Number(grossPnl.toFixed(2)),
      net_pnl: Number(netPnl.toFixed(2)),
      stop_loss: direction === 'LONG' ? entryPrice * 0.985 : entryPrice * 1.015,
      target: direction === 'LONG' ? entryPrice * 1.04 : entryPrice * 0.96,
      risk_amount: 50,
      brokerage: totalCharges,
      stt: 0,
      gst: 0,
      exchange_charges: 0,
      stamp_duty: 0,
      sebi_charges: 0,
      total_charges: totalCharges,
      strategy_id: 'strat-2',
      notes: 'Crypto momentum trade',
      exit_reason: isWin ? 'Target Hit' : 'SL Hit',
      lessons_learned: 'Leverage management is key.',
      screenshot_url: null,
      tv_link: null,
      tags: ['Crypto'],
      created_at: tradeDate.toISOString(),
      updated_at: tradeDate.toISOString()
    });
  }

  return trades;
};

// Seed Daily reviews for the last 15 days
const generateSeedDailyReviews = (): DailyReview[] => {
  const reviews: DailyReview[] = [];
  const now = new Date();
  const moods = ['Calm', 'Disciplined', 'Greedy', 'Anxious', 'Patient'];
  for (let i = 0; i < 15; i++) {
    const reviewDate = new Date();
    reviewDate.setDate(now.getDate() - (15 - i));
    const score = i % 4 === 0 ? 80 : (i % 5 === 0 ? 70 : 100);
    reviews.push({
      id: `review-${i}`,
      user_id: SEED_USER_ID,
      review_date: reviewDate.toISOString().split('T')[0],
      discipline_score: score,
      mood: moods[i % moods.length],
      notes: score === 100 ? 'Followed all rules today.' : 'Took an extra trade outside of ORB setup.',
      mistakes: score < 100 ? 'Overtrading' : null,
      market_conditions: i % 2 === 0 ? 'Trending' : 'Sideways/Range-bound',
      created_at: reviewDate.toISOString()
    });
  }
  return reviews;
};

// Initialize LocalStorage Data if not present
export const initMockDb = () => {
  if (typeof window === 'undefined') return;

  const check = localStorage.getItem(`${MOCK_DB_PREFIX}initialized`);
  if (check) return;

  localStorage.setItem(`${MOCK_DB_PREFIX}initialized`, 'true');
  localStorage.setItem(`${MOCK_DB_PREFIX}profiles`, JSON.stringify([DEFAULT_PROFILE, DEFAULT_ADMIN_PROFILE]));
  localStorage.setItem(`${MOCK_DB_PREFIX}journals`, JSON.stringify(SEED_JOURNALS));
  localStorage.setItem(`${MOCK_DB_PREFIX}strategies`, JSON.stringify(SEED_STRATEGIES));
  localStorage.setItem(`${MOCK_DB_PREFIX}rule_books`, JSON.stringify(SEED_RULES));
  localStorage.setItem(`${MOCK_DB_PREFIX}trades`, JSON.stringify(generateSeedTrades()));
  localStorage.setItem(`${MOCK_DB_PREFIX}daily_reviews`, JSON.stringify(generateSeedDailyReviews()));
  
  // Seed violations
  const ruleViolations: RuleViolation[] = [
    {
      id: 'violation-1',
      trade_id: 'trade-j1-0', // First trade (i % 3 === 0) has tag FOMO
      rule_id: 'rule-1',
      violated_at: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
      notes: 'Broke ORB rule by trading CE before candle close'
    }
  ];
  localStorage.setItem(`${MOCK_DB_PREFIX}rule_violations`, JSON.stringify(ruleViolations));
  
  // Seed blogs & SEO pages
  const seoPages: SEOPage[] = [
    {
      id: 'seo-1',
      slug: 'position-size-calculator',
      title: 'Free Trading Position Size Calculator | Gully Trader',
      meta_description: 'Calculate your ideal trading lot size and position sizing based on account balance and risk parameters. Supports Nifty, Bank Nifty, Stock Options, Crypto, and Forex.',
      h1_title: 'Position Size Calculator',
      content_html: '<p>Calculate your optimal size...</p>',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];
  localStorage.setItem(`${MOCK_DB_PREFIX}seo_pages`, JSON.stringify(seoPages));

  // Seed feedback
  const feedback: FeedbackSubmission[] = [
    {
      id: 'fb-1',
      user_id: SEED_USER_ID,
      email: 'trader@gullytrader.in',
      subject: 'Add Zerodha CSV import support',
      message: 'Can you add support for direct drag and drop of Zerodha tax CSV exports? It would make trade logging so easy!',
      status: 'OPEN',
      created_at: new Date().toISOString()
    }
  ];
  localStorage.setItem(`${MOCK_DB_PREFIX}feedback`, JSON.stringify(feedback));

  // Set current user session as seed user
  localStorage.setItem(`${MOCK_DB_PREFIX}current_user`, JSON.stringify(DEFAULT_PROFILE));
};

// Generic Mock DB Store Functions
function getStore<T>(table: string): T[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(`${MOCK_DB_PREFIX}${table}`);
  return data ? JSON.parse(data) : [];
}

function saveStore<T>(table: string, data: T[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`${MOCK_DB_PREFIX}${table}`, JSON.stringify(data));
}

// User Profile Actions
export const mockAuth = {
  getCurrentUser: (): Profile | null => {
    initMockDb();
    if (typeof window === 'undefined') return null;
    const user = localStorage.getItem(`${MOCK_DB_PREFIX}current_user`);
    return user ? JSON.parse(user) : null;
  },
  login: (email: string, adminMode = false): Profile => {
    initMockDb();
    const profiles = getStore<Profile>('profiles');
    let user = profiles.find(p => p.email === email);
    if (!user) {
      user = {
        id: adminMode ? ADMIN_USER_ID : `user-${Math.random().toString(36).substr(2, 9)}`,
        email,
        full_name: email.split('@')[0].toUpperCase(),
        avatar_url: null,
        is_admin: adminMode,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      profiles.push(user);
      saveStore('profiles', profiles);
    }
    localStorage.setItem(`${MOCK_DB_PREFIX}current_user`, JSON.stringify(user));
    return user;
  },
  logout: () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(`${MOCK_DB_PREFIX}current_user`);
  }
};

// Journal Actions (Soft deletes are kept, but excluded from default selector)
export const mockJournals = {
  list: (userId: string, includeDeleted = false): Journal[] => {
    initMockDb();
    const journals = getStore<Journal>('journals').filter(j => j.user_id === userId);
    if (includeDeleted) return journals;
    
    // Exclude soft deleted ones OR check if deleted within 30 days
    const now = Date.now();
    return journals.filter(j => {
      if (!j.deleted_at) return true;
      // If deleted_at is older than 30 days, it is completely hard-deleted logically
      const delTime = new Date(j.deleted_at).getTime();
      return now - delTime < 30 * 24 * 60 * 60 * 1000;
    }).filter(j => !j.deleted_at);
  },
  
  listDeleted: (userId: string): Journal[] => {
    initMockDb();
    const journals = getStore<Journal>('journals').filter(j => j.user_id === userId);
    const now = Date.now();
    return journals.filter(j => {
      if (!j.deleted_at) return false;
      const delTime = new Date(j.deleted_at).getTime();
      // Keep only recoverable journals (< 30 days old)
      return now - delTime < 30 * 24 * 60 * 60 * 1000;
    });
  },

  create: (journal: Omit<Journal, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>): Journal => {
    const list = getStore<Journal>('journals');
    const newJ: Journal = {
      ...journal,
      id: `journal-${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null
    };
    list.push(newJ);
    saveStore('journals', list);
    return newJ;
  },

  update: (id: string, updates: Partial<Journal>): Journal => {
    const list = getStore<Journal>('journals');
    const index = list.findIndex(j => j.id === id);
    if (index === -1) throw new Error('Journal not found');
    const updated = { ...list[index], ...updates, updated_at: new Date().toISOString() };
    list[index] = updated;
    saveStore('journals', list);
    return updated;
  },

  softDelete: (id: string): Journal => {
    return mockJournals.update(id, { deleted_at: new Date().toISOString() });
  },

  recover: (id: string): Journal => {
    return mockJournals.update(id, { deleted_at: null });
  },

  hardDelete: (id: string) => {
    const list = getStore<Journal>('journals');
    const filtered = list.filter(j => j.id !== id);
    saveStore('journals', filtered);
    // Hard delete all trades belonging to this journal as well
    const trades = getStore<Trade>('trades').filter(t => t.journal_id !== id);
    saveStore('trades', trades);
  }
};

// Strategy Actions
export const mockStrategies = {
  list: (userId: string): Strategy[] => {
    initMockDb();
    return getStore<Strategy>('strategies').filter(s => s.user_id === userId);
  },
  create: (strategy: Omit<Strategy, 'id' | 'created_at'>): Strategy => {
    const list = getStore<Strategy>('strategies');
    const exists = list.find(s => s.user_id === strategy.user_id && s.name.toLowerCase() === strategy.name.toLowerCase());
    if (exists) return exists;
    
    const newS: Strategy = {
      ...strategy,
      id: `strat-${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString()
    };
    list.push(newS);
    saveStore('strategies', list);
    return newS;
  }
};

// Trade Actions
export const mockTrades = {
  list: (userId: string, journalId?: string): Trade[] => {
    initMockDb();
    let trades = getStore<Trade>('trades').filter(t => t.user_id === userId);
    
    // Filter active journals only
    const activeJournals = mockJournals.list(userId).map(j => j.id);
    trades = trades.filter(t => activeJournals.includes(t.journal_id));

    if (journalId) {
      trades = trades.filter(t => t.journal_id === journalId);
    }
    
    // Hydrate strategies
    const strategies = getStore<Strategy>('strategies');
    return trades.map(t => ({
      ...t,
      strategy_name: strategies.find(s => s.id === t.strategy_id)?.name || undefined
    })).sort((a, b) => new Date(b.trade_date).getTime() - new Date(a.trade_date).getTime());
  },

  create: (trade: Omit<Trade, 'id' | 'created_at' | 'updated_at' | 'gross_pnl' | 'net_pnl' | 'total_charges'>): Trade => {
    const list = getStore<Trade>('trades');
    
    // Check duplication
    const duplicate = list.find(t => 
      t.journal_id === trade.journal_id &&
      t.trade_date === trade.trade_date &&
      t.symbol === trade.symbol &&
      t.entry_price === trade.entry_price &&
      t.quantity === trade.quantity &&
      t.direction === trade.direction
    );
    
    if (duplicate) {
      // Return existing or flag duplicate error
    }

    // Auto calculate Gross P&L
    let gross_pnl = 0;
    if (trade.exit_price !== null) {
      gross_pnl = trade.direction === 'LONG'
        ? (trade.exit_price - trade.entry_price) * trade.quantity
        : (trade.entry_price - trade.exit_price) * trade.quantity;
    }
    
    // Auto calculate Indian stock taxes if empty & broker selected
    let { brokerage, stt, gst, exchange_charges, stamp_duty, sebi_charges } = trade;
    
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
          brokerage = 0.00; // standard broker free equity
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
        brokerage = Number((volume * 0.0004).toFixed(2)); // flat taker fee
      }
    }

    const total_charges = Number((brokerage + stt + gst + exchange_charges + stamp_duty + sebi_charges).toFixed(2));
    const net_pnl = Number((gross_pnl - total_charges).toFixed(2));

    const newT: Trade = {
      ...trade,
      id: `trade-${Math.random().toString(36).substr(2, 9)}`,
      gross_pnl: Number(gross_pnl.toFixed(2)),
      brokerage,
      stt,
      gst,
      exchange_charges,
      stamp_duty,
      sebi_charges,
      total_charges,
      net_pnl,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    list.push(newT);
    saveStore('trades', list);
    return newT;
  },

  update: (id: string, updates: Partial<Trade>): Trade => {
    const list = getStore<Trade>('trades');
    const index = list.findIndex(t => t.id === id);
    if (index === -1) throw new Error('Trade not found');

    const merged = { ...list[index], ...updates };
    
    // Recalculate P&L if entry/exit/qty/charges changed
    let gross_pnl = merged.gross_pnl;
    if (updates.entry_price !== undefined || updates.exit_price !== undefined || updates.quantity !== undefined || updates.direction !== undefined) {
      if (merged.exit_price !== null) {
        gross_pnl = merged.direction === 'LONG'
          ? (merged.exit_price - merged.entry_price) * merged.quantity
          : (merged.entry_price - merged.exit_price) * merged.quantity;
      }
    }

    // Update total charges
    const total_charges = Number((merged.brokerage + merged.stt + merged.gst + merged.exchange_charges + merged.stamp_duty + merged.sebi_charges).toFixed(2));
    const net_pnl = Number((gross_pnl - total_charges).toFixed(2));

    const updated = {
      ...merged,
      gross_pnl: Number(gross_pnl.toFixed(2)),
      total_charges,
      net_pnl,
      updated_at: new Date().toISOString()
    };
    
    list[index] = updated;
    saveStore('trades', list);
    return updated;
  },

  delete: (id: string) => {
    const list = getStore<Trade>('trades');
    const filtered = list.filter(t => t.id !== id);
    saveStore('trades', filtered);
    // Clean up associated rule violations
    const violations = getStore<RuleViolation>('rule_violations').filter(rv => rv.trade_id !== id);
    saveStore('rule_violations', violations);
  },

  checkDuplicate: (trade: { journal_id: string; trade_date: string; symbol: string; entry_price: number; quantity: number; direction: 'LONG' | 'SHORT' }): boolean => {
    const list = getStore<Trade>('trades');
    return list.some(t => 
      t.journal_id === trade.journal_id &&
      t.trade_date === trade.trade_date &&
      t.symbol.toLowerCase() === trade.symbol.toLowerCase() &&
      t.entry_price === trade.entry_price &&
      t.quantity === trade.quantity &&
      t.direction === trade.direction
    );
  }
};

// Psychology Module Actions (Rules, Violations, Reviews)
export const mockPsychology = {
  // Rules List
  listRules: (userId: string): RuleBook[] => {
    initMockDb();
    return getStore<RuleBook>('rule_books').filter(r => r.user_id === userId);
  },
  
  createRule: (rule: Omit<RuleBook, 'id' | 'created_at'>): RuleBook => {
    const list = getStore<RuleBook>('rule_books');
    const newR: RuleBook = {
      ...rule,
      id: `rule-${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString()
    };
    list.push(newR);
    saveStore('rule_books', list);
    return newR;
  },

  updateRule: (id: string, updates: Partial<RuleBook>): RuleBook => {
    const list = getStore<RuleBook>('rule_books');
    const index = list.findIndex(r => r.id === id);
    if (index === -1) throw new Error('Rule not found');
    const updated = { ...list[index], ...updates };
    list[index] = updated;
    saveStore('rule_books', list);
    return updated;
  },

  deleteRule: (id: string) => {
    const list = getStore<RuleBook>('rule_books');
    const filtered = list.filter(r => r.id !== id);
    saveStore('rule_books', filtered);
    // Delete any logged violations of this rule
    const violations = getStore<RuleViolation>('rule_violations').filter(rv => rv.rule_id !== id);
    saveStore('rule_violations', violations);
  },

  // Violations List
  listViolationsForTrade: (tradeId: string): RuleViolation[] => {
    initMockDb();
    const rules = getStore<RuleBook>('rule_books');
    return getStore<RuleViolation>('rule_violations')
      .filter(v => v.trade_id === tradeId)
      .map(v => ({
        ...v,
        rule_name: rules.find(r => r.id === v.rule_id)?.rule_name || 'Unknown Rule'
      }));
  },

  logViolation: (violation: Omit<RuleViolation, 'id' | 'violated_at'>): RuleViolation => {
    const list = getStore<RuleViolation>('rule_violations');
    const exists = list.find(v => v.trade_id === violation.trade_id && v.rule_id === violation.rule_id);
    if (exists) return exists;

    const newV: RuleViolation = {
      ...violation,
      id: `violation-${Math.random().toString(36).substr(2, 9)}`,
      violated_at: new Date().toISOString()
    };
    list.push(newV);
    saveStore('rule_violations', list);
    
    // Recalculate daily review score for the day of this trade
    const trades = getStore<Trade>('trades');
    const targetTrade = trades.find(t => t.id === violation.trade_id);
    if (targetTrade) {
      mockPsychology.recomputeDailyDisciplineScore(targetTrade.user_id, targetTrade.trade_date);
    }

    return newV;
  },

  removeViolation: (tradeId: string, ruleId: string) => {
    const list = getStore<RuleViolation>('rule_violations');
    const filtered = list.filter(v => !(v.trade_id === tradeId && v.rule_id === ruleId));
    saveStore('rule_violations', filtered);

    // Recalculate daily review score
    const trades = getStore<Trade>('trades');
    const targetTrade = trades.find(t => t.id === tradeId);
    if (targetTrade) {
      mockPsychology.recomputeDailyDisciplineScore(targetTrade.user_id, targetTrade.trade_date);
    }
  },

  // Daily Reviews
  listDailyReviews: (userId: string): DailyReview[] => {
    initMockDb();
    return getStore<DailyReview>('daily_reviews').filter(r => r.user_id === userId);
  },

  saveDailyReview: (review: Omit<DailyReview, 'id' | 'created_at'>): DailyReview => {
    const list = getStore<DailyReview>('daily_reviews');
    const index = list.findIndex(r => r.user_id === review.user_id && r.review_date === review.review_date);
    
    if (index !== -1) {
      // Merge
      const updated = { ...list[index], ...review };
      list[index] = updated;
      saveStore('daily_reviews', list);
      return updated;
    } else {
      const newD: DailyReview = {
        ...review,
        id: `review-${Math.random().toString(36).substr(2, 9)}`,
        created_at: new Date().toISOString()
      };
      list.push(newD);
      saveStore('daily_reviews', list);
      return newD;
    }
  },

  recomputeDailyDisciplineScore: (userId: string, dateStr: string) => {
    // Collect all trades on this day
    const trades = getStore<Trade>('trades').filter(t => t.user_id === userId && t.trade_date === dateStr);
    const violations = getStore<RuleViolation>('rule_violations');
    const rules = getStore<RuleBook>('rule_books');

    let penaltySum = 0;
    trades.forEach(t => {
      const tradeViolations = violations.filter(v => v.trade_id === t.id);
      tradeViolations.forEach(v => {
        const penalty = rules.find(r => r.id === v.rule_id)?.penalty_score || 5;
        penaltySum += penalty;
      });
    });

    const finalScore = Math.max(0, 100 - penaltySum);
    
    // Find or create daily review to record score
    const reviews = getStore<DailyReview>('daily_reviews');
    const existingIndex = reviews.findIndex(r => r.user_id === userId && r.review_date === dateStr);
    
    if (existingIndex !== -1) {
      reviews[existingIndex].discipline_score = finalScore;
    } else {
      reviews.push({
        id: `review-${Math.random().toString(36).substr(2, 9)}`,
        user_id: userId,
        review_date: dateStr,
        discipline_score: finalScore,
        mood: 'Neutral',
        notes: 'Score auto-recalculated.',
        mistakes: null,
        market_conditions: null,
        created_at: new Date().toISOString()
      });
    }
    saveStore('daily_reviews', reviews);
  }
};

// Platform Feedback & Admin Actions
export const mockAdmin = {
  listFeedback: (): FeedbackSubmission[] => {
    initMockDb();
    return getStore<FeedbackSubmission>('feedback');
  },
  createFeedback: (email: string, subject: string, message: string, userId?: string | null): FeedbackSubmission => {
    const list = getStore<FeedbackSubmission>('feedback');
    const newFb: FeedbackSubmission = {
      id: `fb-${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId || null,
      email,
      subject,
      message,
      status: 'OPEN',
      created_at: new Date().toISOString()
    };
    list.push(newFb);
    saveStore('feedback', list);
    return newFb;
  },
  updateFeedbackStatus: (id: string, status: 'OPEN' | 'RESOLVED' | 'CLOSED') => {
    const list = getStore<FeedbackSubmission>('feedback');
    const index = list.findIndex(fb => fb.id === id);
    if (index !== -1) {
      list[index].status = status;
      saveStore('feedback', list);
    }
  },
  getStats: () => {
    initMockDb();
    const profiles = getStore<Profile>('profiles');
    const journals = getStore<Journal>('journals').filter(j => !j.deleted_at);
    const trades = getStore<Trade>('trades');
    const feedback = getStore<FeedbackSubmission>('feedback');
    
    return {
      totalUsers: profiles.filter(p => !p.is_admin).length,
      totalJournals: journals.length,
      totalTrades: trades.length,
      pendingFeedback: feedback.filter(f => f.status === 'OPEN').length
    };
  }
};
