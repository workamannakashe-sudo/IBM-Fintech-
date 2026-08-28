// FinWise Universal Sticky Top Navigation (Navbar.tsx)
import React, { useState } from "react";
import { useFinancial } from "../context/FinancialContext";
import { useGamification } from "../context/GamificationContext";
import { APPS_SCRIPT_TEMPLATE } from "../services/sheetsSync";
import { 
  Coins, LayoutDashboard, ReceiptText, ShieldQuestion, 
  Percent, GraduationCap, CalendarHeart, 
  RotateCcw, ChevronDown, Sliders, Settings2, FileCode, Check, PiggyBank, LogOut, Bot 
} from "lucide-react";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { 
    profile, 
    resetDemoData,
    currency,
    userType,
    syncUrl,
    setCurrency,
    setUserType,
    setSyncUrl,
    isGuest,
    logout,
    supabaseStatus
  } = useFinancial();

  const { level, resetGamification } = useGamification();
  const [profileOpen, setProfileOpen] = useState(false);
  const [showScriptCode, setShowScriptCode] = useState(false);
  const [copied, setCopied] = useState(false);

  const [dbUrl, setDbUrl] = useState(() => localStorage.getItem("fw_supabase_url") || "");
  const [dbKey, setDbKey] = useState(() => localStorage.getItem("fw_supabase_anon_key") || "");
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem("fw_gemini_api_key") || "");

  const handleDbUrlChange = (val: string) => {
    setDbUrl(val);
    localStorage.setItem("fw_supabase_url", val);
  };

  const handleDbKeyChange = (val: string) => {
    setDbKey(val);
    localStorage.setItem("fw_supabase_anon_key", val);
  };

  const handleGeminiKeyChange = (val: string) => {
    setGeminiKey(val);
    localStorage.setItem("fw_gemini_api_key", val);
  };

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "expenses", label: "Expenses", icon: ReceiptText },
    { id: "affordability", label: "Affordability Check", icon: ShieldQuestion },
    { id: "loans", label: "Loan & EMI", icon: Percent },
    { id: "scholarships", label: userType === "Student" ? "Scholarships" : "Savings Advisor", icon: userType === "Student" ? GraduationCap : PiggyBank },
    { id: "advisor", label: "AI Advisor", icon: Bot },
    { id: "budget", label: "Budget & Goals", icon: Sliders },
    { id: "habits", label: "Habits/Gamification", icon: CalendarHeart },
  ];

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset all data back to the default profile configuration?")) {
      resetDemoData();
      resetGamification();
      setProfileOpen(false);
      window.location.reload();
    }
  };

  const copyScriptCode = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_TEMPLATE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          
          {/* Logo Brand Identity */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab("dashboard")}>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-teal text-white shadow-sm">
              <Coins className="h-5 w-5" />
            </div>
            <span className="font-display text-xl font-bold tracking-tight text-slate-900">
              FinWise
            </span>
          </div>

          {/* Segmented Tab Bar (Horizontal scrolling container on mobile viewports) */}
          <div className="flex-1 overflow-x-auto no-scrollbar scroll-smooth">
            <div className="flex space-x-1 py-1 min-w-max justify-center md:justify-start">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all duration-200 select-none ${
                      isActive
                        ? "bg-brand-teal text-white shadow-[0_2px_8px_-2px_rgba(15,118,110,0.35)]"
                        : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <IconComponent className="h-4 w-4 shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* User Profile & Config Menu */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50 p-1.5 pr-3 hover:bg-slate-100 transition-colors"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-600 text-white font-bold text-xs">
                {profile.name[0]}
              </div>
              <div className="hidden text-left md:block">
                <p className="text-xs font-bold leading-tight text-slate-800 flex items-center gap-1">
                  {isGuest ? "Guest User" : profile.name}
                  <span className={`inline-block h-1.5 w-1.5 rounded-full ${
                    supabaseStatus === "connected" ? "bg-emerald-500" :
                    supabaseStatus === "syncing" ? "bg-amber-500 animate-pulse" :
                    supabaseStatus === "error" ? "bg-rose-500" : "bg-slate-400"
                  }`} title={`Supabase sync: ${supabaseStatus}`} />
                </p>
                <p className="text-[10px] text-slate-500">{isGuest ? "Guest" : userType} &bull; Lvl {level}</p>
              </div>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-80 max-h-[500px] overflow-y-auto no-scrollbar rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xl ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2 duration-200 space-y-4">
                
                {/* Profile info header */}
                <div className="border-b border-slate-100 pb-3 text-center md:text-left">
                  <p className="text-sm font-bold text-slate-900">{profile.name}</p>
                  <p className="text-xs text-slate-500">{profile.major}</p>
                  <div className="mt-1 flex items-center gap-1.5 justify-center md:justify-start">
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                      {userType === "Student" ? `CGPA: ${profile.gpa}` : "Professional Mode"}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-medium text-teal-700 border border-teal-100">
                      Level {level}
                    </span>
                  </div>
                </div>

                {/* Settings Configuration panel */}
                <div className="space-y-3 pt-1">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Settings2 className="h-3.5 w-3.5 text-brand-teal" />
                    Localization Preferences
                  </h4>

                  {/* Currency selector */}
                  <div className="grid grid-cols-2 gap-3 items-center">
                    <label className="text-xs text-slate-600 font-semibold">Currency Type</label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value as "USD" | "INR")}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs focus:outline-none focus:border-brand-teal font-bold"
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                    </select>
                  </div>

                  {/* Profile type selector */}
                  <div className="grid grid-cols-2 gap-3 items-center">
                    <label className="text-xs text-slate-600 font-semibold">User Segment</label>
                    <select
                      value={userType}
                      onChange={(e) => setUserType(e.target.value as "Student" | "Professional")}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs focus:outline-none focus:border-brand-teal font-bold"
                    >
                      <option value="Student">Student Mode</option>
                      <option value="Professional">Young Pro Mode</option>
                    </select>
                  </div>
                </div>

                {/* Supabase Status Integration */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Supabase Integration
                  </h4>
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-200/60 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${
                        supabaseStatus === "connected" ? "bg-emerald-500" :
                        supabaseStatus === "syncing" ? "bg-amber-500 animate-pulse" :
                        supabaseStatus === "error" ? "bg-rose-500" : "bg-slate-400"
                      }`} />
                      {supabaseStatus === "connected" && "Realtime Synced"}
                      {supabaseStatus === "syncing" && "Syncing Data..."}
                      {supabaseStatus === "error" && "Syncing Offline"}
                      {supabaseStatus === "local" && "Offline Local Mode"}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 capitalize">
                      {supabaseStatus}
                    </span>
                  </div>

                  {/* Supabase Project URL & Anon Key */}
                  <div className="space-y-1.5 pt-1">
                    <label className="block text-[9px] text-slate-500 font-bold uppercase tracking-wider">Supabase URL</label>
                    <input
                      type="text"
                      placeholder="https://your-project.supabase.co"
                      value={dbUrl}
                      onChange={(e) => handleDbUrlChange(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs focus:outline-none focus:border-brand-teal bg-slate-50 font-sans"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[9px] text-slate-500 font-bold uppercase tracking-wider">Supabase Public Anon Key</label>
                    <input
                      type="password"
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5c..."
                      value={dbKey}
                      onChange={(e) => handleDbKeyChange(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs focus:outline-none focus:border-brand-teal bg-slate-50 font-sans"
                    />
                  </div>
                </div>

                {/* Gemini AI Integration */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Gemini AI Integration
                  </h4>
                  <div className="space-y-1.5">
                    <label className="block text-[9px] text-slate-500 font-bold uppercase tracking-wider">Gemini API Key</label>
                    <input
                      type="password"
                      placeholder="AIzaSy..."
                      value={geminiKey}
                      onChange={(e) => handleGeminiKeyChange(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs focus:outline-none focus:border-brand-teal bg-slate-50 font-sans"
                    />
                  </div>
                </div>

                {/* Google sheet/drive sync credentials */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Google Sync Integration
                  </h4>
                  <div className="space-y-1">
                    <label className="block text-[10px] text-slate-600 font-semibold">Apps Script Web App URL</label>
                    <input
                      type="text"
                      placeholder="Paste https://script.google.com/..."
                      value={syncUrl}
                      onChange={(e) => setSyncUrl(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs focus:outline-none focus:border-brand-teal bg-slate-50"
                    />
                  </div>

                  {/* Copy code guide */}
                  <button
                    onClick={() => setShowScriptCode(!showScriptCode)}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 py-1.5 text-[10px] font-bold text-slate-600 transition-colors"
                  >
                    <FileCode className="h-3.5 w-3.5" />
                    {showScriptCode ? "Hide Sync Script Guide" : "Get Sync Script Guide"}
                  </button>

                  {showScriptCode && (
                    <div className="rounded-lg border border-slate-100 bg-slate-50 p-2 text-[10px] space-y-1.5 leading-relaxed text-slate-600">
                      <p>
                        Paste this code inside Google Apps Script, deploy as Web App to "Anyone", and paste URL here to enable Sheets/Drive backups!
                      </p>
                      <button
                        onClick={copyScriptCode}
                        className="w-full rounded bg-brand-teal hover:bg-brand-teal-light text-white font-bold py-1 text-[9px] flex items-center justify-center gap-1"
                      >
                        {copied ? <Check className="h-3 w-3" /> : null}
                        {copied ? "Copied Script!" : "Copy Apps Script Code"}
                      </button>
                    </div>
                  )}
                </div>

                {/* Reset button */}
                <button
                  onClick={handleReset}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-700 py-2 text-xs font-bold transition-all"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Apply Changes & Reset
                </button>

                {/* Sign Out button */}
                <button
                  onClick={() => {
                    logout();
                    setProfileOpen(false);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 py-2 text-xs font-bold transition-all mt-2 cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5 text-slate-500" />
                  Sign Out
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
};
