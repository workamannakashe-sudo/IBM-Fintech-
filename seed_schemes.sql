-- ==========================================
-- BudgetMitra — Seed Schemes Data
-- Run AFTER supabase_schema.sql
-- Seeds the `schemes` table with 8 real Indian scholarship/loan schemes
-- ==========================================

-- Clear existing scheme data (safe to re-run)
DELETE FROM public.schemes;

INSERT INTO public.schemes (name, type, authority, eligibility, benefit, apply_url, description) VALUES

-- 1. Prime Minister's Scholarship Scheme (PMSS)
(
  'Prime Minister''s Scholarship Scheme (PMSS)',
  'scholarship',
  'Government of India — DESW (Dept of Ex-Servicemen Welfare)',
  '{
    "income_max": null,
    "category": ["Gen","OBC","SC","ST","EWS"],
    "state": "all",
    "course_type": ["B.Tech","B.E","MCA","MBA","BCA","MBBS","B.Sc","B.Com","B.A"]
  }'::jsonb,
  '₹2,500–₹3,000/month for up to 5 years',
  'https://scholarships.gov.in',
  'For wards and widows of ex-servicemen and ex-coastguard personnel. Apply via the National Scholarship Portal (NSP). Requires domicile certificate and ex-serviceman relationship proof.'
),

-- 2. Post Matric Scholarship for OBC Students
(
  'Post Matric Scholarship for OBC Students',
  'scholarship',
  'Ministry of Social Justice and Empowerment, GoI',
  '{
    "income_max": 100000,
    "category": ["OBC"],
    "state": "all",
    "course_type": ["B.Tech","B.E","B.Sc","B.Com","B.A","BBA","BCA","Polytechnic/Diploma","MBA","MCA"]
  }'::jsonb,
  'Full tuition fee reimbursement + ₹230–₹570/month maintenance allowance',
  'https://scholarships.gov.in',
  'Central government post-matric scholarship for OBC students pursuing higher education. Family income must be below ₹1 lakh per annum. Apply on the National Scholarship Portal with caste certificate and income proof.'
),

-- 3. Tata Scholarship for Indian Undergraduates
(
  'Tata Scholarship for Indian Undergraduates',
  'scholarship',
  'Tata Education and Development Trust',
  '{
    "income_max": 400000,
    "category": ["Gen","OBC","SC","ST","EWS"],
    "state": "all",
    "course_type": ["B.Tech","B.E","B.Sc","MBBS","B.A","B.Com"]
  }'::jsonb,
  'Up to ₹2,50,000 per year (need-based)',
  'https://www.tatascholarships.com',
  'Need-based scholarships for students at premier Indian institutions (IITs, NITs, top medical colleges). Family income below ₹4 lakh. Covers tuition, hostel, and living expenses. Apply directly on the Tata Trusts scholarship portal.'
),

-- 4. Central Sector Scheme of Scholarship (CSSS)
(
  'Central Sector Scheme of Scholarship (CSSS) for College Students',
  'scholarship',
  'Department of Higher Education, Government of India',
  '{
    "income_max": 450000,
    "category": ["Gen","OBC","SC","ST","EWS"],
    "state": "all",
    "course_type": ["B.Tech","B.E","B.Sc","B.Com","B.A","BBA","BCA","MBA","MCA"]
  }'::jsonb,
  '₹10,000/year (UG Years 1–3), ₹20,000/year (PG)',
  'https://scholarships.gov.in',
  'Merit-based scholarship for students who scored in the top 80th percentile in their Class 12 board exams. Family income must be below ₹4.5 lakh per annum. Apply on National Scholarship Portal with mark sheet and income certificate.'
),

-- 5. Vidya Lakshmi Education Loan Scheme
(
  'Vidya Lakshmi Education Loan Portal',
  'loan',
  'Department of Financial Services, Ministry of Finance, GoI',
  '{
    "income_max": null,
    "category": ["Gen","OBC","SC","ST","EWS"],
    "state": "all",
    "course_type": ["B.Tech","B.E","MBBS","MBA","MCA","B.Sc","B.Com","B.A","BCA","B.Arch","B.Pharm"]
  }'::jsonb,
  'Loans from ₹50,000 to ₹10,00,000+ at 8.5%–11% from 40+ banks; no collateral up to ₹7.5 lakh',
  'https://www.vidyalakshmi.co.in',
  'Single-window portal to apply for education loans from over 40 banks including SBI, Bank of Baroda, Canara Bank, and more. Interest subvention available for families earning under ₹4.5 lakh. No processing fees on most loans under ₹7.5 lakh.'
),

-- 6. Bihar Student Credit Card Scheme
(
  'Bihar Student Credit Card Scheme (BSCCS)',
  'loan',
  'Government of Bihar — 7 Nishchay Yuva Upmission',
  '{
    "income_max": null,
    "category": ["Gen","OBC","SC","ST","EWS"],
    "state": "Bihar",
    "course_type": ["B.Tech","B.E","B.Sc","B.Com","B.A","MBBS","BCA","MBA","MCA","Polytechnic/Diploma","B.Arch","B.Pharm"]
  }'::jsonb,
  'Up to ₹4,00,000 at 4% interest (1% for girl students and differently-abled students)',
  'https://www.7nishchay-yuvaupmission.bihar.gov.in',
  'Exclusively for Bihar domicile students for higher education expenses including tuition, hostel, stationery, and laptop. No income limit. Apply via the Bihar Student Credit Card portal with 12th mark sheet and Bihar domicile certificate.'
),

-- 7. AICTE Pragati Scholarship for Girls
(
  'AICTE Pragati Scholarship for Girl Students',
  'scholarship',
  'All India Council for Technical Education (AICTE)',
  '{
    "income_max": 800000,
    "category": ["Gen","OBC","SC","ST","EWS"],
    "state": "all",
    "course_type": ["B.Tech","B.E","B.Arch","B.Pharm","MCA","MBA","Polytechnic/Diploma"],
    "gender": "female"
  }'::jsonb,
  '₹50,000 per year for up to 4 years (total ₹2,00,000)',
  'https://www.aicte-pragati-saksham-gov.in',
  'Empowering girl students enrolled in AICTE-approved technical programs. Family income must be below ₹8 lakh per annum. One girl per family. Covers tuition, hostel, books, and laptop. Apply on the AICTE Pragati-Saksham portal annually.'
),

-- 8. MYSY Scholarship (Gujarat)
(
  'Mukhyamantri Yuva Swavalamban Yojana (MYSY) — Gujarat',
  'scholarship',
  'Government of Gujarat — Education Department',
  '{
    "income_max": 600000,
    "category": ["Gen","OBC","SC","ST","EWS"],
    "state": "Gujarat",
    "course_type": ["B.Tech","B.E","MBBS","B.D.S","B.Pharm","B.Sc","Polytechnic/Diploma","B.Arch"]
  }'::jsonb,
  'Up to ₹1,00,000/year for professional courses; ₹50,000/year for general degree courses',
  'https://mysy.guj.nic.in',
  'For meritorious Gujarat-domicile students scoring 80+ percentile in Class 12 boards. Family income below ₹6 lakh. Covers tuition and hostel fees. Apply on the MYSY scholarship portal with Gujarat domicile certificate and board mark sheet.'
);
