// BudgetMitra Universal Sticky Top Navigation (Navbar.tsx)
import React, { useState } from "react";
import { useFinancial } from "../context/FinancialContext";
import { useGamification } from "../context/GamificationContext";
import { 
  Wallet, LayoutDashboard, ReceiptText, ShieldQuestion, 
  Percent, GraduationCap, CalendarHeart, 
  RotateCcw, ChevronDown, Sliders, Settings2, LogOut, Sparkles 
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
    setCurrency,
    isGuest,
    logout,
    supabaseStatus,
  } = useFinancial();

  const { level, resetGamification } = useGamification();
  const [profileOpen, setProfileOpen] = useState(false);

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "expenses", label: "Expenses", icon: ReceiptText },
    { id: "affordability", label: "Can I Afford?", icon: ShieldQuestion },
    { id: "scholarships", label: "Schemes", icon: GraduationCap },
    { id: "advisor", label: "IBM Bob AI", icon: Sparkles },
    { id: "loans", label: "Loan & EMI", icon: Percent },
    { id: "budget", label: "Budget & Goals", icon: Sliders },
    { id: "habits", label: "Habits", icon: CalendarHeart },
  ];

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset all demo data back to the default profile?")) {
      resetDemoData();
      resetGamification();
      setProfileOpen(false);
      window.location.reload();
    }
  };

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-2.5 cursor-pointer shrink-0" onClick={() => setActiveTab("dashboard")}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 text-white shadow-md shadow-orange-500/20">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <span className="font-display text-xl font-extrabold tracking-tight text-slate-900">
                Budget<span className="text-orange-500">Mitra</span>
              </span>
              <span className="block text-[9px] font-bold text-orange-600 tracking-wider uppercase -mt-1">
                AI Financial Co-Pilot
              </span>
            </div>
          </div>

          {/* Segmented Tab Bar */}
          <div className="flex-1 overflow-x-auto no-scrollbar scroll-smooth">
            <div className="flex space-x-1 py-1 min-w-max justify-center md:justify-start">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all duration-200 select-none ${
                      isActive
                        ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/25"
                        : "text-slate-600 hover:bg-orange-50/60 hover:text-orange-700"
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
              className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-1.5 pr-3 hover:border-orange-300 hover:bg-orange-50/40 transition-all shadow-xs"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 text-white font-bold text-xs shadow-xs">
                {(profile.name || "U")[0]?.toUpperCase()}
              </div>
              <div className="hidden text-left md:block">
                <p className="text-xs font-bold leading-tight text-slate-800 flex items-center gap-1.5">
                  {isGuest ? "Guest User" : profile.name || "Student"}
                  <span className={`inline-block h-2 w-2 rounded-full ${
                    supabaseStatus === "connected" ? "bg-emerald-500 shadow-xs shadow-emerald-400" :
                    supabaseStatus === "syncing" ? "bg-amber-500 animate-pulse" :
                    supabaseStatus === "error" ? "bg-rose-500" : "bg-slate-400"
                  }`} title={`Supabase sync: ${supabaseStatus}`} />
                </p>
                <p className="text-[10px] text-slate-500 font-medium">{profile.course || userType} &bull; Lvl {level}</p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-72 max-h-[500px] overflow-y-auto no-scrollbar rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xl ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2 duration-200 space-y-4">
                
                {/* Profile info header */}
                <div className="border-b border-slate-100 pb-3 text-center md:text-left">
                  <p className="text-sm font-bold text-slate-900">{profile.name || "Student"}</p>
                  <p className="text-xs text-slate-500 font-medium">{profile.course || "B.Tech"} &bull; Year {profile.year || 1}</p>
                  <div className="mt-2 flex items-center gap-1.5 justify-center md:justify-start flex-wrap">
                    <span className="inline-flex items-center rounded-full bg-orange-50 border border-orange-200 px-2 py-0.5 text-[10px] font-semibold text-orange-700">
                      {profile.category || "General"}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                      {profile.state || "India"}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                      Lvl {level}
                    </span>
                  </div>
                </div>

                {/* Preferences */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Settings2 className="h-3.5 w-3.5 text-orange-500" />
                    Preferences
                  </h4>

                  {/* Currency selector */}
                  <div className="grid grid-cols-2 gap-2 items-center">
                    <label className="text-xs text-slate-600 font-semibold">Currency</label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value as "USD" | "INR")}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs focus:outline-none focus:border-orange-400 font-bold"
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                    </select>
                  </div>
                </div>

                {/* Cloud & Realtime Status */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${
                        supabaseStatus === "connected" ? "bg-emerald-500" :
                        supabaseStatus === "syncing" ? "bg-amber-500 animate-pulse" :
                        supabaseStatus === "error" ? "bg-rose-500" : "bg-slate-400"
                      }`} />
                      {supabaseStatus === "connected" && "Cloud Synced"}
                      {supabaseStatus === "syncing" && "Syncing..."}
                      {supabaseStatus === "error" && "Offline Mode"}
                      {supabaseStatus === "local" && "Local Session"}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 capitalize">
                      {supabaseStatus}
                    </span>
                  </div>
                </div>

                {/* Reset button */}
                <button
                  onClick={handleReset}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-600 hover:text-rose-700 py-2 text-xs font-bold transition-all cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset Demo Data
                </button>

                {/* Sign Out button */}
                <button
                  onClick={() => {
                    logout();
                    setProfileOpen(false);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 py-2 text-xs font-bold transition-all cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
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
