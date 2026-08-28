import React, { useState } from "react";
import { useFinancial } from "../context/FinancialContext";
import { Landmark, PiggyBank, GraduationCap, Lock, User, Mail, Sparkles, LogIn, ShieldAlert, KeyRound } from "lucide-react";
import { isSupabaseConfigured } from "../utils/supabase/client";

export const Login: React.FC = () => {
  const { login, registerUser, loginAsGuest } = useFinancial();
  const [activeTab, setActiveTab] = useState<"login" | "register" | "guest">("login");
  const supabaseConnected = isSupabaseConfigured();
  
  // Shared Form Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"Student" | "Professional">("Student");
  const [currency, setCurrency] = useState<"USD" | "INR">("INR");
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setError("");
    setLoading(true);
    const res = await login(email, password, role, currency);
    setLoading(false);
    if (!res.success) {
      setError(res.error || "Login failed");
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }
    setError("");
    setLoading(true);
    const res = await registerUser(email, password, name, role, currency);
    setLoading(false);
    if (!res.success) {
      setError(res.error || "Registration failed");
    }
  };

  const handleGuestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginAsGuest(role, currency);
  };

  const handleQuickFill = async (type: "student_inr" | "pro_usd") => {
    const defaultEmail = type === "student_inr" ? "aman@finwise.com" : "sarah@finwise.com";
    const defaultName = type === "student_inr" ? "Aman Kashe" : "Sarah Jenkins";
    const defaultRole = type === "student_inr" ? "Student" : "Professional";
    const defaultCurr = type === "student_inr" ? "INR" : "USD";
    const defaultPass = "password123";

    setLoading(true);
    setError("");
    
    // Attempt sign in
    let res = await login(defaultEmail, defaultPass, defaultRole, defaultCurr);
    if (!res.success) {
      // If user doesn't exist yet in Supabase, register them automatically
      res = await registerUser(defaultEmail, defaultPass, defaultName, defaultRole, defaultCurr);
    }
    
    setLoading(false);
    if (!res.success) {
      setError(res.error || "Demo login failed");
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-slate-950 p-4 font-sans select-none">
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-600/10 rounded-full blur-[100px] animate-pulse pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10 space-y-6">
        
        {/* Logo and Tagline */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 mb-2">
            <PiggyBank className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight font-display">
            Fin<span className="text-indigo-400">Wise</span>
          </h1>
          <p className="text-slate-400 text-xs max-w-xs mx-auto">
            AI-powered financial literacy & decision-support dashboard built for students and young professionals.
          </p>
        </div>

        {/* Card */}
        <div className="backdrop-blur-xl bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-2xl shadow-black/50">
          
          {/* Supabase Status Banner */}
          {!supabaseConnected && (
            <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 p-2.5 text-[10px] text-amber-400 mb-4 justify-center font-sans">
              <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-amber-500 animate-pulse" />
              <span>Supabase unconfigured. Running in Local Offline Mode.</span>
            </div>
          )}

          {/* Tabs */}
          <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 mb-6 gap-1">
            <button
              onClick={() => { setActiveTab("login"); setError(""); }}
              disabled={loading}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === "login"
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setActiveTab("register"); setError(""); }}
              disabled={loading}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === "register"
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Register
            </button>
            <button
              onClick={() => { setActiveTab("guest"); setError(""); }}
              disabled={loading}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === "guest"
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Guest
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-400 mb-4 font-sans">
              <ShieldAlert className="h-4 w-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {activeTab === "login" && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <h2 className="text-lg font-bold text-white font-display mb-1 flex items-center gap-1.5">
                <LogIn className="h-4.5 w-4.5 text-indigo-400" />
                Sign In
              </h2>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@email.com"
                    required
                    disabled={loading}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600 font-sans"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={loading}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600 font-sans"
                  />
                </div>
              </div>

              {/* Segment & Currency (Optional for login, but initializes profile if offline) */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Segment (Offline Only)</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    disabled={loading}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer font-sans"
                  >
                    <option value="Student">Student</option>
                    <option value="Professional">Professional</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Currency (Offline Only)</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as any)}
                    disabled={loading}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer font-sans"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 text-xs shadow-lg shadow-indigo-600/25 transition-all mt-2 cursor-pointer flex items-center justify-center gap-1.5 font-sans disabled:opacity-50"
              >
                {loading ? "Signing In..." : "Sign In"}
              </button>

              {/* Demo Accounts section */}
              <div className="pt-4 border-t border-slate-800 space-y-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Quick Demo Profiles</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickFill("student_inr")}
                    disabled={loading}
                    className="rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-900 py-2 px-2 text-[10px] text-slate-300 font-medium transition-colors text-left flex flex-col justify-between h-14 cursor-pointer font-sans disabled:opacity-50"
                  >
                    <span className="font-bold text-indigo-400 flex items-center gap-0.5">
                      <GraduationCap className="h-3.5 w-3.5" /> Student
                    </span>
                    <span>Aman (INR) &rarr;</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickFill("pro_usd")}
                    disabled={loading}
                    className="rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-900 py-2 px-2 text-[10px] text-slate-300 font-medium transition-colors text-left flex flex-col justify-between h-14 cursor-pointer font-sans disabled:opacity-50"
                  >
                    <span className="font-bold text-rose-400 flex items-center gap-0.5">
                      <Landmark className="h-3.5 w-3.5" /> Professional
                    </span>
                    <span>Sarah (USD) &rarr;</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {activeTab === "register" && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <h2 className="text-lg font-bold text-white font-display mb-1 flex items-center gap-1.5">
                <KeyRound className="h-4.5 w-4.5 text-indigo-400" />
                Create Account
              </h2>

              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    required
                    disabled={loading}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600 font-sans"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@email.com"
                    required
                    disabled={loading}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600 font-sans"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="•••••••• (Min 6 characters)"
                    required
                    disabled={loading}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600 font-sans"
                  />
                </div>
              </div>

              {/* Role & Currency */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">User Segment</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    disabled={loading}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer font-sans"
                  >
                    <option value="Student">Student</option>
                    <option value="Professional">Professional</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Preferred Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as any)}
                    disabled={loading}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer font-sans"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 text-xs shadow-lg shadow-indigo-600/25 transition-all mt-2 cursor-pointer flex items-center justify-center gap-1.5 font-sans disabled:opacity-50"
              >
                {loading ? "Registering..." : "Create Account"}
              </button>
            </form>
          )}

          {activeTab === "guest" && (
            <form onSubmit={handleGuestSubmit} className="space-y-4">
              <h2 className="text-lg font-bold text-white font-display mb-1 flex items-center gap-1.5">
                <Sparkles className="h-4.5 w-4.5 text-indigo-400 animate-pulse" />
                Guest Access
              </h2>

              <p className="text-slate-400 text-xs leading-relaxed font-sans">
                Log in anonymously to test-drive FinWise metrics, loan calculators, and affordability checks. Your data will be kept locally during this session.
              </p>

              {/* Guest Role & Currency */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Role Setting</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer font-sans"
                  >
                    <option value="Student">Student Mode</option>
                    <option value="Professional">Professional Mode</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Currency Setting</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer font-sans"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 text-xs transition-all mt-4 cursor-pointer font-sans"
              >
                Enter as Guest
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
