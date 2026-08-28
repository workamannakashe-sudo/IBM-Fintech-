-- ==========================================
-- FinWise Supabase Database Schema
-- Run this script in your Supabase SQL Editor
-- ==========================================

-- 1. Create Profiles Table (linked to Supabase Auth users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    user_type TEXT DEFAULT 'Student' CHECK (user_type IN ('Student', 'Professional')),
    currency TEXT DEFAULT 'INR' CHECK (currency IN ('USD', 'INR')),
    major TEXT,
    gpa NUMERIC,
    academic_year TEXT,
    income_tier TEXT,
    first_gen BOOLEAN DEFAULT FALSE,
    interests TEXT[] DEFAULT '{}',
    monthly_allowance NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Create Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    category TEXT NOT NULL,
    is_anomaly BOOLEAN DEFAULT FALSE,
    anomaly_explanation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Create Savings Goals Table
CREATE TABLE IF NOT EXISTS public.savings_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    target NUMERIC NOT NULL,
    current NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Create Loans Table
CREATE TABLE IF NOT EXISTS public.loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    principal NUMERIC NOT NULL,
    interest_rate NUMERIC NOT NULL,
    term_months INTEGER NOT NULL,
    extra_payment NUMERIC DEFAULT 0,
    type TEXT NOT NULL CHECK (type IN ('Subsidized', 'Unsubsidized', 'Personal', 'Home')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. Create Budgets Table
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    limit_amount NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE (profile_id, category)
);

-- ==========================================
-- Enable Row Level Security (RLS) on all tables
-- ==========================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- Security Policies (Ensure users can only access their own records)
-- ==========================================

-- Profiles
CREATE POLICY "Allow select for profile owner" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Allow insert for profile owner" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Allow update for profile owner" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Transactions
CREATE POLICY "Allow select for transaction owner" ON public.transactions FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Allow insert for transaction owner" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Allow update for transaction owner" ON public.transactions FOR UPDATE USING (auth.uid() = profile_id);
CREATE POLICY "Allow delete for transaction owner" ON public.transactions FOR DELETE USING (auth.uid() = profile_id);

-- Savings Goals
CREATE POLICY "Allow select for goal owner" ON public.savings_goals FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Allow insert for goal owner" ON public.savings_goals FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Allow update for goal owner" ON public.savings_goals FOR UPDATE USING (auth.uid() = profile_id);
CREATE POLICY "Allow delete for goal owner" ON public.savings_goals FOR DELETE USING (auth.uid() = profile_id);

-- Loans
CREATE POLICY "Allow select for loan owner" ON public.loans FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Allow insert for loan owner" ON public.loans FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Allow update for loan owner" ON public.loans FOR UPDATE USING (auth.uid() = profile_id);
CREATE POLICY "Allow delete for loan owner" ON public.loans FOR DELETE USING (auth.uid() = profile_id);

-- Budgets
CREATE POLICY "Allow select for budget owner" ON public.budgets FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Allow insert for budget owner" ON public.budgets FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Allow update for budget owner" ON public.budgets FOR UPDATE USING (auth.uid() = profile_id);
CREATE POLICY "Allow delete for budget owner" ON public.budgets FOR DELETE USING (auth.uid() = profile_id);
