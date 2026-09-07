-- ==============================================================================
-- BUDGETMITRA — SUPABASE PRODUCTION DATABASE SCHEMA & RLS POLICIES
-- ==============================================================================
-- Database: PostgreSQL 15+ (Supabase)
-- Security: Row Level Security (RLS) enabled on all tables
-- Auth: Supabase Auth integration via auth.uid()
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. Profiles Table
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL DEFAULT 'Student',
    monthly_allowance NUMERIC(12, 2) NOT NULL DEFAULT 15000.00,
    academic_year TEXT NOT NULL DEFAULT '2nd Year',
    course TEXT NOT NULL DEFAULT 'B.Tech Computer Science',
    college TEXT NOT NULL DEFAULT 'Engineering College',
    state TEXT NOT NULL DEFAULT 'Maharashtra',
    category TEXT NOT NULL DEFAULT 'General',
    family_income NUMERIC(12, 2) NOT NULL DEFAULT 450000.00,
    currency TEXT NOT NULL DEFAULT 'INR',
    theme_preference TEXT NOT NULL DEFAULT 'dark',
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

-- ==============================================================================
-- 3. Transactions Table
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    category TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    type TEXT NOT NULL DEFAULT 'debit' CHECK (type IN ('debit', 'credit')),
    source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'sms_parsed', 'csv_import', 'split_bill')),
    masked_account TEXT,
    reference_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Indexing for fast dashboard & habit calculations
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON public.transactions(user_id, category);

-- ==============================================================================
-- 4. Budgets Table
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    allocated NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    period TEXT NOT NULL DEFAULT 'monthly' CHECK (period IN ('weekly', 'monthly', 'semester')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
    UNIQUE (user_id, category, period)
);

-- ==============================================================================
-- 5. Savings Goals Table
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.savings_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    target_amount NUMERIC(12, 2) NOT NULL,
    current_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    deadline DATE,
    icon TEXT DEFAULT 'Target',
    category TEXT DEFAULT 'Personal',
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

-- ==============================================================================
-- 6. Student Loans Table
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.student_loans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    principal NUMERIC(14, 2) NOT NULL,
    interest_rate NUMERIC(5, 2) NOT NULL,
    term_months INTEGER NOT NULL,
    extra_payment NUMERIC(12, 2) DEFAULT 0.00,
    loan_type TEXT DEFAULT 'Subsidized' CHECK (loan_type IN ('Subsidized', 'Unsubsidized', 'Private', 'NBFC')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

-- ==============================================================================
-- 7. Gamification & Streaks Table
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.gamification (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    streak_count INTEGER NOT NULL DEFAULT 0,
    last_active_date DATE,
    total_xp INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    unlocked_badges TEXT[] DEFAULT ARRAY[]::TEXT[],
    history JSONB DEFAULT '[]'::JSONB,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

-- ==============================================================================
-- 8. Government & Private Schemes Repository (Public Read)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.schemes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    provider TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Scholarship', 'Loan', 'Grant', 'Fellowship')),
    amount_max NUMERIC(12, 2) NOT NULL,
    deadline DATE,
    category TEXT[] NOT NULL DEFAULT ARRAY['All'],
    eligible_states TEXT[] NOT NULL DEFAULT ARRAY['All India'],
    eligible_courses TEXT[] NOT NULL DEFAULT ARRAY['All'],
    max_income NUMERIC(12, 2) DEFAULT NULL,
    min_cgpa NUMERIC(3, 2) DEFAULT NULL,
    gender_preference TEXT DEFAULT 'All',
    portal_url TEXT NOT NULL,
    official_description TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

-- ==============================================================================
-- 9. Automatic Timestamp Trigger
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profiles_updated ON public.profiles;
CREATE TRIGGER on_profiles_updated
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS on_budgets_updated ON public.budgets;
CREATE TRIGGER on_budgets_updated
    BEFORE UPDATE ON public.budgets
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS on_savings_goals_updated ON public.savings_goals;
CREATE TRIGGER on_savings_goals_updated
    BEFORE UPDATE ON public.savings_goals
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gamification ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schemes ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can only read/update their own profile
CREATE POLICY "Users can manage own profile"
    ON public.profiles FOR ALL
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Transactions: Users can only manage their own transactions
CREATE POLICY "Users can manage own transactions"
    ON public.transactions FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Budgets: Users can only manage their own budgets
CREATE POLICY "Users can manage own budgets"
    ON public.budgets FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Savings Goals: Users can only manage their own goals
CREATE POLICY "Users can manage own savings goals"
    ON public.savings_goals FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Student Loans: Users can only manage their own loans
CREATE POLICY "Users can manage own loans"
    ON public.student_loans FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Gamification: Users can only manage their own gamification data
CREATE POLICY "Users can manage own gamification"
    ON public.gamification FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Schemes: Authenticated and anonymous users can read verified schemes
CREATE POLICY "Public schemes read access"
    ON public.schemes FOR SELECT
    USING (is_active = true);
