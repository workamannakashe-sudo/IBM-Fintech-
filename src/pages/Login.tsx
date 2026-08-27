import React, { useState } from "react";
import { useFinancial } from "../context/FinancialContext";
import { Landmark, PiggyBank, GraduationCap, Lock, User, Sparkles, LogIn, ShieldAlert } from "lucide-react";

export const Login: React.FC = () => {
  const { login, loginAsGuest } = useFinancial();
  const [activeTab, setActiveTab] = useState<"member" | "guest">("member");
  
  // Member fields
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"Student" | "Professional">("Student");
  const [currency, setCurrency] = useState<"USD" | "INR">("INR");
  const [error, setError] = useState("");

  // Guest fields
  const [guestRole, setGuestRole] = useState<"Student" | "Professional">("Student");
  const [guestCurrency, setGuestCurrency] = useState<"USD" | "INR">("INR");

  const handleMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError("Please enter a username");
      return;
    }
    if (!password) {
      setError("Please enter a password");
      return;
    }
    setError("");
    login(username, role, currency);
  };

  const handleGuestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginAsGuest(guestRole, guestCurrency);
  };

  const handleQuickFill = (type: "student_inr" | "pro_usd") => {
    if (type === "student_inr") {
      login("Aman Kashe", "Student", "INR");
    } else {
      login("Sarah Jenkins", "Professional", "USD");
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
          
          {/* Tabs */}
          <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 mb-6">
            <button
              onClick={() => setActiveTab("member")}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === "member"
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Member Sign In
            </button>
            <button
              onClick={() => setActiveTab("guest")}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === "guest"
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Guest Access
            </button>
          </div>

          {activeTab === "member" ? (
            <form onSubmit={handleMemberSubmit} className="space-y-4">
              <h2 className="text-lg font-bold text-white font-display mb-1 flex items-center gap-1.5">
                <LogIn className="h-4.5 w-4.5 text-indigo-400" />
                Sign In
              </h2>

              {error && (
                <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-400">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Username */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Username / Account Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your name"
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
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600 font-sans"
                  />
                </div>
              </div>

              {/* Role & Currency Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">User Segment</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer font-sans"
                  >
                    <option value="Student">Student</option>
                    <option value="Professional">Professional</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Currency</label>
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
                className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 text-xs shadow-lg shadow-indigo-600/25 transition-all mt-2 cursor-pointer flex items-center justify-center gap-1.5 font-sans"
              >
                Sign In
              </button>

              {/* Demo Accounts section */}
              <div className="pt-4 border-t border-slate-800 space-y-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Quick Demo Profiles</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickFill("student_inr")}
                    className="rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-900 py-2 px-2 text-[10px] text-slate-300 font-medium transition-colors text-left flex flex-col justify-between h-14 cursor-pointer font-sans"
                  >
                    <span className="font-bold text-indigo-400 flex items-center gap-0.5">
                      <GraduationCap className="h-3.5 w-3.5" /> Student
                    </span>
                    <span>Aman (INR) &rarr;</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickFill("pro_usd")}
                    className="rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-900 py-2 px-2 text-[10px] text-slate-300 font-medium transition-colors text-left flex flex-col justify-between h-14 cursor-pointer font-sans"
                  >
                    <span className="font-bold text-rose-400 flex items-center gap-0.5">
                      <Landmark className="h-3.5 w-3.5" /> Professional
                    </span>
                    <span>Sarah (USD) &rarr;</span>
                  </button>
                </div>
              </div>
            </form>
          ) : (
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
                    value={guestRole}
                    onChange={(e) => setGuestRole(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer font-sans"
                  >
                    <option value="Student">Student Mode</option>
                    <option value="Professional">Professional Mode</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Currency Setting</label>
                  <select
                    value={guestCurrency}
                    onChange={(e) => setGuestCurrency(e.target.value as any)}
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
