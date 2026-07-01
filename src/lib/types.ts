// TypeScript Type Definitions for Gully Trader

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface Journal {
  id: string;
  user_id: string;
  name: string;
  base_currency: 'INR' | 'USD';
  market_type: string; // Equity, Futures, Options, Forex, Crypto
  trading_style: string; // Scalping, Day Trading, Swing, Positional
  starting_capital: number;
  default_broker: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Strategy {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Trade {
  id: string;
  user_id: string;
  journal_id: string;
  
  // Basic Information
  trade_date: string; // YYYY-MM-DD
  exchange: string;
  segment: string;
  symbol: string;
  direction: 'LONG' | 'SHORT';
  
  // Details
  entry_price: number;
  exit_price: number | null;
  quantity: number;
  entry_time: string | null;
  exit_time: string | null;
  status: 'OPEN' | 'CLOSED' | 'CANCELLED';
  
  // P&L
  gross_pnl: number;
  net_pnl: number;
  
  // Risk
  stop_loss: number | null;
  target: number | null;
  risk_amount: number | null;
  
  // Charges
  brokerage: number;
  stt: number;
  gst: number;
  exchange_charges: number;
  stamp_duty: number;
  sebi_charges: number;
  total_charges: number;
  
  // Notes & Psychology
  strategy_id: string | null;
  strategy_name?: string; // Hydrated on client
  notes: string | null;
  exit_reason: string | null;
  lessons_learned: string | null;
  
  // Attachments
  screenshot_url: string | null;
  tv_link: string | null;
  
  tags?: string[]; // Hydrated tags
  created_at: string;
  updated_at: string;
}

export interface RuleBook {
  id: string;
  user_id: string;
  rule_name: string;
  description: string | null;
  penalty_score: number;
  is_active: boolean;
  created_at: string;
}

export interface RuleViolation {
  id: string;
  trade_id: string;
  rule_id: string;
  violated_at: string;
  notes: string | null;
  rule_name?: string; // Hydrated
}

export interface DailyReview {
  id: string;
  user_id: string;
  review_date: string; // YYYY-MM-DD
  discipline_score: number;
  mood: string | null;
  notes: string | null;
  mistakes: string | null;
  market_conditions: string | null;
  created_at: string;
}

export interface TradeImport {
  id: string;
  user_id: string;
  journal_id: string;
  filename: string;
  broker: string;
  trades_imported: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  created_at: string;
}

export interface FeedbackSubmission {
  id: string;
  user_id: string | null;
  email: string;
  subject: string;
  message: string;
  status: 'OPEN' | 'RESOLVED' | 'CLOSED';
  created_at: string;
}

export interface SEOPage {
  id: string;
  slug: string;
  title: string;
  meta_description: string | null;
  h1_title: string | null;
  content_html: string;
  created_at: string;
  updated_at: string;
}
