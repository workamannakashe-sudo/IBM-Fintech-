import React, { useState } from "react";
import { useFinancial } from "../context/FinancialContext";
import { useGamification } from "../context/GamificationContext";
import { useTheme } from "../context/ThemeContext";
import {
  LayoutDashboard,
  Wallet,
  FileText,
  MessageSquare,
  Receipt,
  Sliders,
  Percent,
  Flame,
  Plus,
  HelpCircle,
  LogOut,
  Sun,
  Moon,
  Settings,
  X,
  RefreshCw,
  Users
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenQuickLog: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenQuickLog,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const { currency, setCurrency, resetDemoData, logout, supabaseStatus } = useFinancial();
  const { streak } = useGamification();
  const { theme, toggleTheme } = useTheme();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "affordability", label: "Afford-Check", icon: Wallet },
    { id: "split", label: "Split Bill", icon: Users },
    { id: "scholarships", label: "Schemes", icon: FileText },
    { id: "advisor", label: "Chat & AI", icon: MessageSquare },
    { id: "expenses", label: "Expenses", icon: Receipt },
    { id: "budget", label: "Budget & Goals", icon: Sliders },
    { id: "loans", label: "Loan & EMI", icon: Percent },
    { id: "habits", label: "Habits", icon: Flame, badge: streak > 0 ? `${streak}d` : undefined },
  ];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    if (onCloseMobile) onCloseMobile();
  };

  const handleReset = () => {
    if (window.confirm("Reset demo data to default student profile?")) {
      resetDemoData();
      window.location.reload();
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-white dark:bg-[#0d0d12] border-r border-slate-200/80 dark:border-zinc-800/80 flex flex-col p-5 z-50 transition-all duration-300 ${
          isOpenMobile ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between mb-6">
          <div
            onClick={() => handleNavClick("dashboard")}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600 dark:bg-[#ff2d78] flex items-center justify-center shrink-0 shadow-md shadow-blue-500/25 dark:shadow-[0_0_15px_rgba(255,45,120,0.5)] group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-white filled-icon text-[22px]">
                account_balance
              </span>
            </div>
            <div>
              <h1 className="font-display font-bold text-lg text-slate-900 dark:text-white dark:drop-shadow-[0_0_8px_rgba(255,45,120,0.4)] tracking-tight">
                Budget<span className="text-blue-600 dark:text-[#ff2d78]">Mitra</span>
              </h1>
              <p className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 -mt-0.5">
                College Finance Hub
              </p>
            </div>
          </div>

          {/* Close Button on Mobile */}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Theme Switcher Toggle Pill */}
        <div className="mb-5">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-200/60 dark:hover:bg-zinc-800/80 transition-all cursor-pointer"
            title={`Switch to ${theme === "light" ? "Dark" : "Light"} Mode`}
          >
            <span className="flex items-center gap-2">
              {theme === "light" ? (
                <Sun className="w-4 h-4 text-amber-500" />
              ) : (
                <Moon className="w-4 h-4 text-cyan-400" />
              )}
              <span>{theme === "light" ? "Light Mode" : "Dark Mode"}</span>
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 shadow-xs">
              Toggle
            </span>
          </button>
        </div>

        {/* Main Navigation Links */}
        <nav className="flex flex-col gap-1.5 flex-grow overflow-y-auto no-scrollbar pr-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-blue-600 text-white font-bold shadow-md shadow-blue-500/25 dark:bg-gradient-to-r dark:from-[#ff2d78]/20 dark:to-[#bd00ff]/20 dark:text-[#ff2d78] dark:border dark:border-[#ff2d78]/40 dark:shadow-[0_0_15px_rgba(255,45,120,0.15)]"
                    : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-900/80 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive
                        ? "text-white dark:text-[#ff2d78]"
                        : "text-slate-400 dark:text-zinc-400"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Primary CTA Action */}
        <div className="mt-4 mb-4">
          <button
            onClick={onOpenQuickLog}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white dark:bg-gradient-to-r dark:from-[#ff2d78] dark:to-[#bd00ff] dark:hover:opacity-95 rounded-xl py-3 px-4 text-xs font-bold shadow-md shadow-blue-500/20 dark:shadow-[0_0_20px_rgba(255,45,120,0.35)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Expense</span>
          </button>
        </div>

        {/* Footer Settings & Quick Utilities */}
        <div className="flex flex-col gap-1 pt-3 border-t border-slate-200/80 dark:border-zinc-800/80">
          <button
            onClick={() => setSettingsOpen(!settingsOpen)}
            className="flex items-center justify-between text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-900 rounded-xl px-3 py-2 text-xs font-medium transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Settings className="w-4 h-4 text-slate-400" />
              <span>Settings & Currency</span>
            </div>
            <span className="text-[10px] font-bold text-blue-600 dark:text-cyan-400">
              {currency === "INR" ? "₹ INR" : "$ USD"}
            </span>
          </button>

          {/* Quick inline settings tray */}
          {settingsOpen && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-2.5 animate-in fade-in slide-in-from-bottom-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-zinc-400 font-semibold">Currency</span>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as "INR" | "USD")}
                  className="px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-800 dark:text-white font-bold"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60 dark:border-zinc-800">
                <span className="text-slate-500 dark:text-zinc-400 font-semibold">Cloud Sync</span>
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {supabaseStatus}
                </span>
              </div>

              <button
                onClick={handleReset}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 text-[11px] font-bold border border-rose-200/80 dark:border-rose-900/50 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" /> Reset Demo Data
              </button>
            </div>
          )}

          <button
            onClick={() => setHelpOpen(!helpOpen)}
            className="flex items-center gap-2.5 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-900 rounded-xl px-3 py-2 text-xs font-medium transition-all cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-slate-400" />
            <span>Help Center</span>
          </button>

          {helpOpen && (
            <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/40 text-[11px] text-slate-600 dark:text-zinc-300 space-y-1">
              <p className="font-bold text-blue-900 dark:text-blue-300">💡 Quick Guide:</p>
              <p>• Use <b>Afford-Check</b> before large buys.</p>
              <p>• Check <b>Schemes</b> for scholarships.</p>
              <p>• Ask <b>Bob AI</b> in the chat widget anytime.</p>
            </div>
          )}

          <button
            onClick={logout}
            className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl px-3 py-2 text-xs font-semibold transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
