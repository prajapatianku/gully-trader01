-- Gully Trader Database Schema
-- Built for PostgreSQL / Supabase with Row Level Security (RLS)

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    is_admin BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. JOURNALS (supports Soft Delete)
CREATE TABLE IF NOT EXISTS public.journals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    base_currency TEXT DEFAULT 'INR' NOT NULL CHECK (base_currency IN ('INR', 'USD')),
    market_type TEXT NOT NULL, -- e.g. Equity, Futures, Options, Forex, Crypto
    trading_style TEXT NOT NULL, -- e.g. Scalping, Day Trading, Swing, Positional
    starting_capital NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
    default_broker TEXT DEFAULT 'Zerodha' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE -- NULL means active, otherwise soft deleted
);

-- Index for journals
CREATE INDEX IF NOT EXISTS idx_journals_user_id ON public.journals(user_id) WHERE deleted_at IS NULL;

-- 3. STRATEGIES
CREATE TABLE IF NOT EXISTS public.strategies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, name)
);

-- 4. TRADES
CREATE TABLE IF NOT EXISTS public.trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    journal_id UUID NOT NULL REFERENCES public.journals(id) ON DELETE CASCADE,
    
    -- Basic Information
    trade_date DATE NOT NULL,
    exchange TEXT DEFAULT 'NSE' NOT NULL, -- e.g. NSE, BSE, MCX, FOREX, BINANCE
    segment TEXT DEFAULT 'Options' NOT NULL, -- e.g. Equity, Futures, Options, Spot
    symbol TEXT NOT NULL, -- e.g. BANKNIFTY, RELIANCE, EURUSD, BTCUSDT
    direction TEXT NOT NULL CHECK (direction IN ('LONG', 'SHORT')),
    
    -- Trade Details
    entry_price NUMERIC(15, 4) NOT NULL CHECK (entry_price > 0),
    exit_price NUMERIC(15, 4) CHECK (exit_price >= 0),
    quantity NUMERIC(15, 4) NOT NULL CHECK (quantity > 0),
    entry_time TIMESTAMP WITH TIME ZONE,
    exit_time TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'OPEN' NOT NULL CHECK (status IN ('OPEN', 'CLOSED', 'CANCELLED')),
    
    -- Calculated P&L (gross_pnl = (exit_price - entry_price) * quantity for LONG)
    gross_pnl NUMERIC(15, 4) DEFAULT 0.0000 NOT NULL,
    net_pnl NUMERIC(15, 4) DEFAULT 0.0000 NOT NULL,
    
    -- Risk Information
    stop_loss NUMERIC(15, 4),
    target NUMERIC(15, 4),
    risk_amount NUMERIC(15, 2), -- Amount trader is willing to lose (e.g. starting risk)
    
    -- Charges
    brokerage NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    stt NUMERIC(10, 2) DEFAULT 0.00 NOT NULL, -- Securities Transaction Tax
    gst NUMERIC(10, 2) DEFAULT 0.00 NOT NULL, -- Goods and Services Tax
    exchange_charges NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    stamp_duty NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    sebi_charges NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    total_charges NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    
    -- Notes
    strategy_id UUID REFERENCES public.strategies(id) ON DELETE SET NULL,
    notes TEXT,
    exit_reason TEXT,
    lessons_learned TEXT,
    
    -- Attachments
    screenshot_url TEXT,
    tv_link TEXT, -- TradingView link
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for trades
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON public.trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_journal_id ON public.trades(journal_id);
CREATE INDEX IF NOT EXISTS idx_trades_date ON public.trades(trade_date);

-- 5. TRADE TAGS
CREATE TABLE IF NOT EXISTS public.trade_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trade_id UUID NOT NULL REFERENCES public.trades(id) ON DELETE CASCADE,
    tag TEXT NOT NULL,
    UNIQUE(trade_id, tag)
);

-- 6. RULE BOOKS (Psychology Module)
CREATE TABLE IF NOT EXISTS public.rule_books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    rule_name TEXT NOT NULL,
    description TEXT,
    penalty_score INTEGER DEFAULT 5 NOT NULL, -- Score subtracted for violating (1-10)
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, rule_name)
);

-- 7. RULE VIOLATIONS
CREATE TABLE IF NOT EXISTS public.rule_violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trade_id UUID NOT NULL REFERENCES public.trades(id) ON DELETE CASCADE,
    rule_id UUID NOT NULL REFERENCES public.rule_books(id) ON DELETE CASCADE,
    violated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    notes TEXT,
    UNIQUE(trade_id, rule_id)
);

-- 8. DAILY REVIEWS (Psychology & Discipline Module)
CREATE TABLE IF NOT EXISTS public.daily_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    review_date DATE NOT NULL,
    discipline_score INTEGER DEFAULT 100 NOT NULL CHECK (discipline_score BETWEEN 0 AND 100),
    mood TEXT, -- e.g. Calm, Anxious, Greedy, Fearful, Patient
    notes TEXT,
    mistakes TEXT,
    market_conditions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, review_date)
);

-- 9. IMPORTS & IMPORT LOGS
CREATE TABLE IF NOT EXISTS public.imports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    journal_id UUID NOT NULL REFERENCES public.journals(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    broker TEXT NOT NULL, -- Zerodha, Groww, Fyers, Generic
    trades_imported INTEGER DEFAULT 0 NOT NULL,
    status TEXT DEFAULT 'COMPLETED' NOT NULL CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.import_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    import_id UUID NOT NULL REFERENCES public.imports(id) ON DELETE CASCADE,
    row_number INTEGER,
    status TEXT NOT NULL, -- SUCCESS, SKIPPED_DUPLICATE, FAILED
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. PLATFORM FEEDBACK
CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'OPEN' NOT NULL CHECK (status IN ('OPEN', 'RESOLVED', 'CLOSED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. SEO MODULE: PAGES, BLOGS & TEMPLATES
CREATE TABLE IF NOT EXISTS public.seo_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    meta_description TEXT,
    h1_title TEXT,
    content_html TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rule_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rule_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_pages ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- 2. Journals Policies
DROP POLICY IF EXISTS "Users can manage their own journals" ON public.journals;
CREATE POLICY "Users can manage their own journals" ON public.journals
    FOR ALL USING (auth.uid() = user_id);

-- 3. Strategies Policies
DROP POLICY IF EXISTS "Users can manage their own strategies" ON public.strategies;
CREATE POLICY "Users can manage their own strategies" ON public.strategies
    FOR ALL USING (auth.uid() = user_id);

-- 4. Trades Policies
DROP POLICY IF EXISTS "Users can manage their own trades" ON public.trades;
CREATE POLICY "Users can manage their own trades" ON public.trades
    FOR ALL USING (auth.uid() = user_id);

-- 5. Trade Tags Policies
DROP POLICY IF EXISTS "Users can manage tags on their own trades" ON public.trade_tags;
CREATE POLICY "Users can manage tags on their own trades" ON public.trade_tags
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.trades 
            WHERE public.trades.id = public.trade_tags.trade_id 
            AND public.trades.user_id = auth.uid()
        )
    );

-- 6. Rule Books Policies
DROP POLICY IF EXISTS "Users can manage their own rules" ON public.rule_books;
CREATE POLICY "Users can manage their own rules" ON public.rule_books
    FOR ALL USING (auth.uid() = user_id);

-- 7. Rule Violations Policies
DROP POLICY IF EXISTS "Users can manage violations on their own trades" ON public.rule_violations;
CREATE POLICY "Users can manage violations on their own trades" ON public.rule_violations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.trades
            WHERE public.trades.id = public.rule_violations.trade_id
            AND public.trades.user_id = auth.uid()
        )
    );

-- 8. Daily Reviews Policies
DROP POLICY IF EXISTS "Users can manage their own daily reviews" ON public.daily_reviews;
CREATE POLICY "Users can manage their own daily reviews" ON public.daily_reviews
    FOR ALL USING (auth.uid() = user_id);

-- 9. Imports Policies
DROP POLICY IF EXISTS "Users can manage their own imports" ON public.imports;
CREATE POLICY "Users can manage their own imports" ON public.imports
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view logs of their own imports" ON public.import_logs;
CREATE POLICY "Users can view logs of their own imports" ON public.import_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.imports
            WHERE public.imports.id = public.import_logs.import_id
            AND public.imports.user_id = auth.uid()
        )
    );

-- 10. Feedback Policies
DROP POLICY IF EXISTS "Users can create feedback" ON public.feedback;
CREATE POLICY "Users can create feedback" ON public.feedback
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Only admins can view feedback" ON public.feedback;
CREATE POLICY "Only admins can view feedback" ON public.feedback
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE public.profiles.id = auth.uid()
            AND public.profiles.is_admin = true
        )
    );

-- 11. SEO Pages Policies (Public view, Admin write)
DROP POLICY IF EXISTS "Anyone can view SEO pages" ON public.seo_pages;
CREATE POLICY "Anyone can view SEO pages" ON public.seo_pages FOR SELECT USING (true);

DROP POLICY IF EXISTS "Only admins can manage SEO pages" ON public.seo_pages;
CREATE POLICY "Only admins can manage SEO pages" ON public.seo_pages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE public.profiles.id = auth.uid()
            AND public.profiles.is_admin = true
        )
    );

-- ==========================================
-- SYSTEM TRIGGERS & FUNCTIONS
-- ==========================================

-- Trigger to create a profile automatically when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url, is_admin)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        new.raw_user_meta_data->>'avatar_url',
        CASE WHEN new.email = 'admin@gullytrader.in' THEN true ELSE false END
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to update updated_at on change
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    new.updated_at = now();
    RETURN new;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_journals_updated_at ON public.journals;
CREATE TRIGGER update_journals_updated_at
    BEFORE UPDATE ON public.journals
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_trades_updated_at ON public.trades;
CREATE TRIGGER update_trades_updated_at
    BEFORE UPDATE ON public.trades
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
