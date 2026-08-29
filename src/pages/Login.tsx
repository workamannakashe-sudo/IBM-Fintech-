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

  const inputCls = "w-full bg-white/10 border border-white/20 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-white/60 focus:bg-white/15 transition-all placeholder:text-white/50 font-sans backdrop-blur-md";
  const labelCls = "text-[10px] font-bold text-white/80 uppercase tracking-wider block mb-1";

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
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 border border-white/35 text-white shadow-xl backdrop-blur-lg mb-2">
            <Wallet className="h-8 w-8 text-white drop-shadow" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight font-display drop-shadow-md">
            Budget<span className="text-cyan-200">Mitra</span>
          </h1>
          <p className="text-white/80 text-xs max-w-xs mx-auto leading-relaxed drop-shadow-sm">
            🤝 Your smart financial co-pilot for college. Budget smarter, discover scholarships, and make better spending decisions with AI assistance.
          </p>
        </div>

        {/* Glassmorphism Card */}
        <div className="backdrop-blur-2xl bg-white/15 border border-white/30 rounded-3xl p-6 md:p-8 shadow-2xl shadow-black/30">

          {/* Supabase Banner */}
          {!supabaseConnected && (
            <div className="flex items-center gap-2 rounded-xl bg-amber-500/20 border border-amber-300/30 p-2.5 text-[10px] text-amber-100 mb-4 justify-center backdrop-blur-md">
              <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-amber-300 animate-pulse" />
              <span>Supabase not connected. Running in Local Mode.</span>
            </div>
          )}

          {/* Tabs */}
          <div className="flex bg-black/20 p-1 rounded-2xl border border-white/15 mb-5 gap-1 backdrop-blur-md">
            {(["register", "login", "guest"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setError(""); }}
                disabled={loading}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer capitalize ${
                  activeTab === tab 
                    ? "bg-white/30 text-white border border-white/40 shadow-lg backdrop-blur-lg" 
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                {tab === "register" ? "Sign Up" : tab === "login" ? "Sign In" : "Guest"}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-500/20 border border-rose-300/30 p-3 text-xs text-rose-100 mb-4 backdrop-blur-md">
              <ShieldAlert className="h-4 w-4 shrink-0 text-rose-300" />
              <span>{error}</span>
            </div>
          )}

          {/* ─── REGISTER TAB ─── */}
          {activeTab === "register" && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <h2 className="text-base font-bold text-white font-display mb-2 flex items-center gap-1.5 drop-shadow-sm">
                <KeyRound className="h-4 w-4 text-cyan-200" />
                Create your BudgetMitra account
              </h2>

              {/* Name + Email row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/60" />
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Rahul Sharma" required disabled={loading}
                      className="w-full bg-white/10 border border-white/20 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-white/60 focus:bg-white/15 transition-all placeholder:text-white/50 backdrop-blur-md" />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/60" />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@college.in" required disabled={loading}
                      className="w-full bg-white/10 border border-white/20 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-white/60 focus:bg-white/15 transition-all placeholder:text-white/50 backdrop-blur-md" />
                  </div>
                </div>
              </div>

              {/* Password */}
              <div>
                <label className={labelCls}>Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/60" />
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters" required disabled={loading}
                    className="w-full bg-white/10 border border-white/20 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-white/60 focus:bg-white/15 transition-all placeholder:text-white/50 backdrop-blur-md" />
                </div>
              </div>

              {/* Course + Year */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Course</label>
                  <select value={course} onChange={e => setCourse(e.target.value)} disabled={loading}
                    className={inputCls + " cursor-pointer [&>option]:text-slate-900 [&>option]:bg-white"}>
                    {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Year</label>
                  <select value={year} onChange={e => setYear(Number(e.target.value))} disabled={loading}
                    className={inputCls + " cursor-pointer [&>option]:text-slate-900 [&>option]:bg-white"}>
                    {[1, 2, 3, 4, 5].map(y => <option key={y} value={y}>Year {y}</option>)}
                  </select>
                </div>
              </div>

              {/* State */}
              <div>
                <label className={labelCls}>State</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/60" />
                  <select value={state} onChange={e => setState(e.target.value)} disabled={loading}
                    className="w-full bg-white/10 border border-white/20 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-white/60 focus:bg-white/15 transition-all cursor-pointer backdrop-blur-md [&>option]:text-slate-900 [&>option]:bg-white">
                    {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Income Bracket + Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Family Income</label>
                  <select value={incomeBracket} onChange={e => setIncomeBracket(e.target.value as any)} disabled={loading}
                    className={inputCls + " cursor-pointer [&>option]:text-slate-900 [&>option]:bg-white"}>
                    <option value="below_1L">Below ₹1 Lakh</option>
                    <option value="1-3L">₹1–3 Lakh</option>
                    <option value="3-8L">₹3–8 Lakh</option>
                    <option value="above_8L">Above ₹8 Lakh</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Category</label>
                  <select value={category} onChange={e => setCategory(e.target.value as any)} disabled={loading}
                    className={inputCls + " cursor-pointer [&>option]:text-slate-900 [&>option]:bg-white"}>
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
                className="w-full rounded-xl bg-white/30 hover:bg-white/40 border border-white/40 text-white font-bold py-3 text-xs shadow-xl backdrop-blur-md transition-all mt-2 cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 hover:shadow-cyan-400/20">
                {loading ? "Creating account..." : "🚀 Create Account & Start Budgeting"}
              </button>
            </form>
          )}

          {/* ─── LOGIN TAB ─── */}
          {activeTab === "login" && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <h2 className="text-base font-bold text-white font-display mb-2 flex items-center gap-1.5 drop-shadow-sm">
                <LogIn className="h-4 w-4 text-cyan-200" />
                Welcome back!
              </h2>

              <div>
                <label className={labelCls}>Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/60" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@college.in" required disabled={loading}
                    className="w-full bg-white/10 border border-white/20 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-white/60 focus:bg-white/15 transition-all placeholder:text-white/50 backdrop-blur-md" />
                </div>
              </div>

              <div>
                <label className={labelCls}>Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/60" />
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required disabled={loading}
                    className="w-full bg-white/10 border border-white/20 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-white/60 focus:bg-white/15 transition-all placeholder:text-white/50 backdrop-blur-md" />
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full rounded-xl bg-white/30 hover:bg-white/40 border border-white/40 text-white font-bold py-3 text-xs shadow-xl backdrop-blur-md transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 hover:shadow-cyan-400/20">
                {loading ? "Signing in..." : "Sign In"}
              </button>

              {/* Demo Button */}
              <div className="pt-3 border-t border-white/20">
                <p className="text-[10px] font-bold text-white/70 uppercase tracking-wider mb-2">Quick Demo</p>
                <button type="button" onClick={handleDemo} disabled={loading}
                  className="w-full rounded-xl border border-white/25 bg-white/10 hover:bg-white/20 py-2.5 px-3 text-xs text-white font-medium transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50 backdrop-blur-md">
                  <GraduationCap className="h-3.5 w-3.5 text-cyan-200" />
                  <span>Load Rahul Sharma — Demo Student (₹15,000 allowance)</span>
                </button>
              </div>
            </form>
          )}

          {/* ─── GUEST TAB ─── */}
          {activeTab === "guest" && (
            <form onSubmit={handleGuestSubmit} className="space-y-4">
              <h2 className="text-base font-bold text-white font-display mb-2 flex items-center gap-1.5 drop-shadow-sm">
                <Sparkles className="h-4 w-4 text-cyan-200 animate-pulse" />
                Explore as Guest
              </h2>
              <p className="text-white/80 text-xs leading-relaxed">
                Try BudgetMitra's budget tracker, <strong>"Can I Afford This?"</strong> engine, and AI financial assistant chat without creating an account. Data is kept locally only.
              </p>

              <div>
                <label className={labelCls}>Monthly Allowance / Stipend (₹)</label>
                <input type="number" value={allowance} onChange={e => setAllowance(Number(e.target.value))} required
                  className={inputCls} placeholder="e.g. 12000" />
              </div>

              <button type="submit"
                className="w-full rounded-xl bg-white/25 hover:bg-white/35 border border-white/35 text-white font-bold py-3 text-xs transition-all cursor-pointer flex items-center justify-center gap-2 backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5 text-cyan-200" /> Enter as Guest
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-white/60">
          BudgetMitra · SkillUp Hackathon × IBM SkillsBuild · Student AI Track: Financial Literacy
        </p>
      </div>
    </div>
  );
};
