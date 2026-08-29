-- ==========================================
-- BudgetMitra Supabase Database Schema
-- Run this entire script in your Supabase SQL Editor
-- ==========================================

-- 1. Profiles Table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    course TEXT,          -- e.g. 'B.Tech', 'B.Sc', 'B.Com', 'MBA'
    year INTEGER,         -- 1 to 4+
    state TEXT,           -- Indian state name e.g. 'Maharashtra'
    income_bracket TEXT CHECK (income_bracket IN ('below_1L','1-3L','3-8L','above_8L')),
    category TEXT CHECK (category IN ('Gen','OBC','SC','ST','EWS')),
    monthly_allowance NUMERIC DEFAULT 0,
    preferred_language TEXT DEFAULT 'en' CHECK (preferred_language IN ('en','hi','mr')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('food','rent','books','travel','entertainment','other')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Monthly Budgets Table
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    month DATE NOT NULL,   -- first day of the month e.g. 2026-08-01
    category TEXT NOT NULL CHECK (category IN ('food','rent','books','travel','entertainment','other')),
    limit_amount NUMERIC NOT NULL DEFAULT 0,
    UNIQUE (user_id, month, category)
);

-- 4. Scholarship / Loan Schemes Table (public read, admin-only write)
CREATE TABLE IF NOT EXISTS public.schemes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('scholarship', 'loan')),
    authority TEXT,        -- e.g. 'Government of India', 'AICTE', 'State Govt - Maharashtra'
    eligibility JSONB,     -- { "income_max": 300000, "category": ["SC","ST","OBC"], "state": "all", "course_type": ["B.Tech","B.Sc"] }
    benefit TEXT,
    apply_url TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. Chat Messages Table (Bob conversation history)
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'bob')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==========================================
-- Enable Row Level Security (RLS)
-- ==========================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- Drop existing policies to allow re-running
-- ==========================================
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
DROP POLICY IF EXISTS "transactions_select" ON public.transactions;
DROP POLICY IF EXISTS "transactions_insert" ON public.transactions;
DROP POLICY IF EXISTS "transactions_update" ON public.transactions;
DROP POLICY IF EXISTS "transactions_delete" ON public.transactions;
DROP POLICY IF EXISTS "budgets_select" ON public.budgets;
DROP POLICY IF EXISTS "budgets_insert" ON public.budgets;
DROP POLICY IF EXISTS "budgets_update" ON public.budgets;
DROP POLICY IF EXISTS "budgets_delete" ON public.budgets;
DROP POLICY IF EXISTS "schemes_select" ON public.schemes;
DROP POLICY IF EXISTS "chat_messages_select" ON public.chat_messages;
DROP POLICY IF EXISTS "chat_messages_insert" ON public.chat_messages;
DROP POLICY IF EXISTS "chat_messages_delete" ON public.chat_messages;

-- ==========================================
-- Profiles Policies
-- ==========================================
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- ==========================================
-- Transactions Policies
-- ==========================================
CREATE POLICY "transactions_select" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "transactions_insert" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "transactions_update" ON public.transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "transactions_delete" ON public.transactions FOR DELETE USING (auth.uid() = user_id);

-- ==========================================
-- Budgets Policies
-- ==========================================
CREATE POLICY "budgets_select" ON public.budgets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "budgets_insert" ON public.budgets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "budgets_update" ON public.budgets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "budgets_delete" ON public.budgets FOR DELETE USING (auth.uid() = user_id);

-- ==========================================
-- Schemes Policy (Public Read — any authenticated user can view schemes)
-- ==========================================
CREATE POLICY "schemes_select" ON public.schemes FOR SELECT USING (auth.role() = 'authenticated');

-- ==========================================
-- Chat Messages Policies
-- ==========================================
CREATE POLICY "chat_messages_select" ON public.chat_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "chat_messages_insert" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "chat_messages_delete" ON public.chat_messages FOR DELETE USING (auth.uid() = user_id);

-- ==========================================
-- 6. Initial Seed Data for Schemes
-- ==========================================
-- TODO: verify against official source (https://scholarships.gov.in)
INSERT INTO public.schemes (name, type, authority, eligibility, benefit, apply_url, description)
VALUES 
(
    'Prime Minister Scholarship Scheme (PMSS)',
    'scholarship',
    'Government of India (DESW)',
    '{"income_max": null, "category": ["Gen", "OBC", "SC", "ST", "EWS"], "state": "all", "course_type": ["B.Tech", "B.E", "MCA", "MBA", "BCA"]}',
    '₹2,500–₹3,000/month',
    'https://scholarships.gov.in',
    'For wards/widows of ex-servicemen. Apply via the National Scholarship Portal.'
),
-- TODO: verify against official source (https://scholarships.gov.in)
(
    'Post Matric Scholarship for OBC Students',
    'scholarship',
    'Ministry of Social Justice and Empowerment, GoI',
    '{"income_max": 100000, "category": ["OBC"], "state": "all", "course_type": ["B.Tech", "B.Sc", "B.Com", "B.A", "BBA", "BCA", "Diploma"]}',
    'Full tuition fee + ₹230–₹570/month maintenance',
    'https://scholarships.gov.in',
    'Central government post-matric scholarship for OBC students with family income below ₹1 lakh.'
),
-- TODO: verify against official source (https://www.vidyalakshmi.co.in)
(
    'Vidya Lakshmi Education Loan Scheme',
    'loan',
    'Department of Financial Services, GoI',
    '{"income_max": null, "category": ["Gen", "OBC", "SC", "ST", "EWS"], "state": "all", "course_type": ["B.Tech", "B.E", "MBBS", "MBA", "B.Sc", "B.Com", "B.A"]}',
    'Loans ₹50,000–₹10,00,000+ at 8.5%–11% from 40+ banks',
    'https://www.vidyalakshmi.co.in',
    'Single portal to apply for education loans. No collateral for loans up to ₹7.5 lakhs.'
),
-- TODO: verify against official source (https://www.aicte-pragati-saksham-gov.in)
(
    'AICTE Pragati Scholarship for Girls',
    'scholarship',
    'AICTE',
    '{"income_max": 800000, "category": ["Gen", "OBC", "SC", "ST", "EWS"], "state": "all", "course_type": ["B.Tech", "B.E", "B.Arch", "B.Pharm", "MCA", "MBA", "Diploma"], "gender": "female"}',
    '₹50,000 per year for up to 4 years',
    'https://www.aicte-pragati-saksham-gov.in',
    'Empowering girl students in AICTE-approved technical institutions.'
)
ON CONFLICT DO NOTHING;

