// BudgetMitra — Onboarding & Login Page (Login.tsx)
import React, { useState } from "react";
import { useFinancial } from "../context/FinancialContext";
import {
  Wallet, ShieldAlert, KeyRound, LogIn, Mail, Lock, User, Sparkles, GraduationCap, Globe
} from "lucide-react";
import { isSupabaseConfigured } from "../utils/supabase/client";

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab",
  "Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand",
  "West Bengal","Chandigarh","Delhi","Jammu & Kashmir","Ladakh","Puducherry",
];

const COURSES = [
  "B.Tech","B.E","B.Sc","B.Com","B.A","BBA","BCA","MBBS","B.Pharm","B.Arch",
  "MBA","M.Tech","M.Sc","MCA","Polytechnic/Diploma","Other",
];

export const Login: React.FC = () => {
  const { login, registerUser, loginAsGuest } = useFinancial();
  const [activeTab, setActiveTab] = useState<"login" | "register" | "guest">("register");
  const supabaseConnected = isSupabaseConfigured();

  // Shared fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [allowance, setAllowance] = useState<number>(12000);

  // BudgetMitra Indian student fields
  const [course, setCourse] = useState("B.Tech");
  const [year, setYear] = useState<number>(2);
  const [state, setState] = useState("Maharashtra");
  const [incomeBracket, setIncomeBracket] = useState<"below_1L" | "1-3L" | "3-8L" | "above_8L">("1-3L");
  const [category, setCategory] = useState<"Gen" | "OBC" | "SC" | "ST" | "EWS">("Gen");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) { setError("Please enter a valid email address"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setError(""); setLoading(true);
    const res = await login(email, password, "Student", "INR", allowance);
    setLoading(false);
    if (!res.success) setError(res.error || "Login failed");
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Please enter your full name"); return; }
    if (!email.includes("@")) { setError("Please enter a valid email address"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setError(""); setLoading(true);
    const res = await registerUser(email, password, name, "Student", "INR", allowance, {
      course,
      year,
      state,
      income_bracket: incomeBracket,
      category,
    });
    setLoading(false);
    if (!res.success) setError(res.error || "Registration failed");
  };

  const handleGuestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginAsGuest("Student", "INR", allowance);
  };

  const handleDemo = async () => {
    setLoading(true); setError("");
    const demoEmail = "rahul@budgetmitra.in";
    let res = await login(demoEmail, "demo1234", "Student", "INR", 15000);
    if (!res.success) res = await registerUser(demoEmail, "demo1234", "Rahul Sharma (Demo)", "Student", "INR", 15000);
    setLoading(false);
    if (!res.success) setError("Demo login failed. Try Guest mode instead.");
  };

  const inputCls = "w-full bg-white/80 border border-slate-300 rounded-xl py-2.5 px-3 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all placeholder:text-slate-400 font-sans backdrop-blur-md shadow-sm";
  const labelCls = "text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1";

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-x-hidden login-gradient-bg p-4 font-sans select-none">
      {/* Animated Ocean Waves */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="wave"></div>
        <div className="wave"></div>
        <div className="wave"></div>
      </div>

      <div className="w-full max-w-md relative z-10 space-y-6 my-auto py-8">

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/25 border border-white/40 text-white shadow-2xl backdrop-blur-xl mb-2">
            <Wallet className="h-8 w-8 text-white drop-shadow" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight font-display drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
            Budget<span className="text-cyan-300">Mitra</span>
          </h1>
          <p className="text-white font-medium text-xs max-w-xs mx-auto leading-relaxed drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]">
            🤝 Your smart financial co-pilot for college. Budget smarter, discover scholarships, and make better spending decisions with AI assistance.
          </p>
        </div>

        {/* Glassmorphism Card */}
        <div className="backdrop-blur-2xl bg-white/85 border border-white/80 rounded-3xl p-6 md:p-8 shadow-2xl shadow-slate-950/30 text-slate-900">

          {/* Supabase Banner */}
          {!supabaseConnected && (
            <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-300 p-2.5 text-[10px] text-amber-900 mb-4 justify-center font-medium shadow-sm">
              <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-amber-600 animate-pulse" />
              <span>Supabase not connected. Running in Local Mode.</span>
            </div>
          )}

          {/* Tabs */}
          <div className="flex bg-slate-200/75 p-1 rounded-2xl border border-slate-300/80 mb-5 gap-1 backdrop-blur-md">
            {(["register", "login", "guest"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setError(""); }}
                disabled={loading}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer capitalize ${
                  activeTab === tab 
                    ? "bg-slate-900 text-white shadow-md" 
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                }`}
              >
                {tab === "register" ? "Sign Up" : tab === "login" ? "Sign In" : "Guest"}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-300 p-3 text-xs text-rose-800 mb-4 font-medium shadow-sm">
              <ShieldAlert className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* ─── REGISTER TAB ─── */}
          {activeTab === "register" && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <h2 className="text-base font-bold text-slate-900 font-display mb-2 flex items-center gap-1.5">
                <KeyRound className="h-4 w-4 text-indigo-600" />
                Create your BudgetMitra account
              </h2>

              {/* Name + Email row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Rahul Sharma" required disabled={loading}
                      className="w-full bg-white/80 border border-slate-300 rounded-xl py-2.5 pl-9 pr-3 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all placeholder:text-slate-400 backdrop-blur-md shadow-sm" />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@college.in" required disabled={loading}
                      className="w-full bg-white/80 border border-slate-300 rounded-xl py-2.5 pl-9 pr-3 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all placeholder:text-slate-400 backdrop-blur-md shadow-sm" />
                  </div>
                </div>
              </div>

              {/* Password */}
              <div>
                <label className={labelCls}>Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters" required disabled={loading}
                    className="w-full bg-white/80 border border-slate-300 rounded-xl py-2.5 pl-9 pr-3 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all placeholder:text-slate-400 backdrop-blur-md shadow-sm" />
                </div>
              </div>

              {/* Course + Year */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Course</label>
                  <select value={course} onChange={e => setCourse(e.target.value)} disabled={loading}
                    className={inputCls + " cursor-pointer"}>
                    {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Year</label>
                  <select value={year} onChange={e => setYear(Number(e.target.value))} disabled={loading}
                    className={inputCls + " cursor-pointer"}>
                    {[1, 2, 3, 4, 5].map(y => <option key={y} value={y}>Year {y}</option>)}
                  </select>
                </div>
              </div>

              {/* State */}
              <div>
                <label className={labelCls}>State</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                  <select value={state} onChange={e => setState(e.target.value)} disabled={loading}
                    className="w-full bg-white/80 border border-slate-300 rounded-xl py-2.5 pl-9 pr-3 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all cursor-pointer backdrop-blur-md shadow-sm">
                    {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Income Bracket + Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Family Income</label>
                  <select value={incomeBracket} onChange={e => setIncomeBracket(e.target.value as any)} disabled={loading}
                    className={inputCls + " cursor-pointer"}>
                    <option value="below_1L">Below ₹1 Lakh</option>
                    <option value="1-3L">₹1–3 Lakh</option>
                    <option value="3-8L">₹3–8 Lakh</option>
                    <option value="above_8L">Above ₹8 Lakh</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Category</label>
                  <select value={category} onChange={e => setCategory(e.target.value as any)} disabled={loading}
                    className={inputCls + " cursor-pointer"}>
                    {(["Gen", "OBC", "SC", "ST", "EWS"] as const).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Monthly Allowance */}
              <div>
                <label className={labelCls}>Monthly Allowance / Stipend (₹)</label>
                <input type="number" value={allowance} onChange={e => setAllowance(Number(e.target.value))} required disabled={loading}
                  className={inputCls} placeholder="e.g. 12000" />
              </div>

              <button type="submit" disabled={loading}
                className="w-full rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 text-xs shadow-lg shadow-slate-900/25 transition-all mt-2 cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50">
                {loading ? "Creating account..." : "🚀 Create Account & Start Budgeting"}
              </button>
            </form>
          )}

          {/* ─── LOGIN TAB ─── */}
          {activeTab === "login" && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <h2 className="text-base font-bold text-slate-900 font-display mb-2 flex items-center gap-1.5">
                <LogIn className="h-4 w-4 text-indigo-600" />
                Welcome back!
              </h2>

              <div>
                <label className={labelCls}>Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@college.in" required disabled={loading}
                    className="w-full bg-white/80 border border-slate-300 rounded-xl py-2.5 pl-9 pr-3 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all placeholder:text-slate-400 backdrop-blur-md shadow-sm" />
                </div>
              </div>

              <div>
                <label className={labelCls}>Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required disabled={loading}
                    className="w-full bg-white/80 border border-slate-300 rounded-xl py-2.5 pl-9 pr-3 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all placeholder:text-slate-400 backdrop-blur-md shadow-sm" />
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 text-xs shadow-lg shadow-slate-900/25 transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50">
                {loading ? "Signing in..." : "Sign In"}
              </button>

              {/* Demo Button */}
              <div className="pt-3 border-t border-slate-200">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Quick Demo</p>
                <button type="button" onClick={handleDemo} disabled={loading}
                  className="w-full rounded-xl border border-slate-300 bg-white/80 hover:bg-white py-2.5 px-3 text-xs text-slate-800 font-medium transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50 shadow-sm">
                  <GraduationCap className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Load Rahul Sharma — Demo Student (₹15,000 allowance)</span>
                </button>
              </div>
            </form>
          )}

          {/* ─── GUEST TAB ─── */}
          {activeTab === "guest" && (
            <form onSubmit={handleGuestSubmit} className="space-y-4">
              <h2 className="text-base font-bold text-slate-900 font-display mb-2 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-indigo-600 animate-pulse" />
                Explore as Guest
              </h2>
              <p className="text-slate-600 text-xs leading-relaxed font-normal">
                Try BudgetMitra's budget tracker, <strong>"Can I Afford This?"</strong> engine, and AI financial assistant chat without creating an account. Data is kept locally only.
              </p>

              <div>
                <label className={labelCls}>Monthly Allowance / Stipend (₹)</label>
                <input type="number" value={allowance} onChange={e => setAllowance(Number(e.target.value))} required
                  className={inputCls} placeholder="e.g. 12000" />
              </div>

              <button type="submit"
                className="w-full rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 text-xs transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-slate-900/25">
                <Sparkles className="h-3.5 w-3.5 text-cyan-300" /> Enter as Guest
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-white/90 font-medium drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
          BudgetMitra · SkillUp Hackathon × IBM SkillsBuild · Student AI Track: Financial Literacy
        </p>
      </div>
    </div>
  );
};
