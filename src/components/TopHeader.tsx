import React, { useState } from "react";
import { useFinancial } from "../context/FinancialContext";
import { useGamification } from "../context/GamificationContext";
import { useTheme } from "../context/ThemeContext";
import {
  Search,
  Bell,
  Sun,
  Moon,
  Menu,
} from "lucide-react";

interface TopHeaderProps {
  onOpenMobileMenu: () => void;
  setActiveTab: (tab: string) => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  onOpenMobileMenu,
  setActiveTab,
}) => {
  const { profile, currency, transactions } = useFinancial();
  const { streak } = useGamification();
  const { theme, toggleTheme } = useTheme();

  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);

  // Filter transactions or shortcuts if searching
  const filteredTransactions = transactions
    .filter(
      (t) =>
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .slice(0, 5);

  const notifications = [
    {
      id: "n1",
      title: "Electricity Bill Due Soon",
      desc: "Due in 3 days • ₹1,200 / $120. Don't forget to pay!",
      type: "due",
      time: "2 hours ago",
    },
    {
      id: "n2",
      title: "Streak Boost Active! 🔥",
      desc: `You're on a ${streak}-day check-in streak. Keep it up!`,
      type: "streak",
      time: "Today",
    },
    {
      id: "n3",
      title: "New Government Scheme Added",
      desc: "Pradhan Mantri Vidya Lakshmi scholarship matching your profile.",
      type: "scheme",
      time: "Yesterday",
    },
  ];

  return (
    <header className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      {/* Left side: Mobile menu toggle + Welcome text */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 shadow-xs"
          aria-label="Open Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-display tracking-tight">
            Welcome back, {profile.name ? profile.name.split(" ")[0] : "Rohan"}!
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-0.5">
            Here's your financial snapshot for this month.
          </p>
        </div>
      </div>

      {/* Right side: Search bar + Notification + Theme Switcher + Profile */}
      <div className="flex items-center gap-2.5 sm:gap-3.5 self-end sm:self-auto">
        {/* Search Bar */}
        <div className="relative w-44 sm:w-64 md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchModal(e.target.value.length > 0);
            }}
            onFocus={() => {
              if (searchQuery.length > 0) setShowSearchModal(true);
            }}
            placeholder="Search transactions, schemes..."
            className="w-full h-10 sm:h-11 pl-10 pr-3 rounded-xl bg-white dark:bg-[#121217] border border-slate-200/90 dark:border-zinc-800 focus:border-blue-500 dark:focus:border-[#ff2d78] focus:ring-2 focus:ring-blue-500/10 dark:focus:ring-[#ff2d78]/20 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 shadow-xs outline-none transition-all"
          />

          {/* Quick Search Results Dropdown */}
          {showSearchModal && searchQuery && (
            <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-white dark:bg-[#18181f] border border-slate-200 dark:border-zinc-800 p-3 shadow-xl z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800 text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                <span>Matching Transactions</span>
                <button
                  onClick={() => setShowSearchModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  Close
                </button>
              </div>

              <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto">
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      onClick={() => {
                        setActiveTab("expenses");
                        setShowSearchModal(false);
                      }}
                      className="p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800/80 cursor-pointer flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-zinc-200">{tx.description}</p>
                        <p className="text-[10px] text-slate-400">{tx.category} • {tx.date}</p>
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {currency === "INR" ? `₹${tx.amount}` : `$${tx.amount}`}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 py-3 text-center">No transactions found</p>
                )}
              </div>

              <div className="pt-2 mt-2 border-t border-slate-100 dark:border-zinc-800 flex gap-2">
                <button
                  onClick={() => {
                    setActiveTab("scholarships");
                    setShowSearchModal(false);
                  }}
                  className="flex-1 py-1.5 text-[11px] font-bold rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-center hover:bg-blue-100"
                >
                  Search Schemes →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Theme Quick Toggle */}
        <button
          onClick={toggleTheme}
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white dark:bg-[#121217] border border-slate-200/90 dark:border-zinc-800 flex items-center justify-center text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors shadow-xs cursor-pointer"
          title={`Switch to ${theme === "light" ? "Dark" : "Light"} Mode`}
        >
          {theme === "light" ? (
            <Sun className="w-4 h-4 text-amber-500" />
          ) : (
            <Moon className="w-4 h-4 text-cyan-400" />
          )}
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white dark:bg-[#121217] border border-slate-200/90 dark:border-zinc-800 flex items-center justify-center text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors relative group shadow-xs cursor-pointer"
          >
            <Bell className="w-4 h-4 group-hover:text-blue-600 dark:group-hover:text-[#ff2d78] transition-colors" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-blue-600 dark:bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(0,240,255,0.8)]" />
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white dark:bg-[#18181f] border border-slate-200 dark:border-zinc-800 p-4 shadow-xl z-50 animate-in fade-in slide-in-from-top-2 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800">
                <span className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" /> Notifications
                </span>
                <span className="text-[10px] bg-blue-50 dark:bg-cyan-950 text-blue-600 dark:text-cyan-300 font-bold px-2 py-0.5 rounded-full">
                  3 New
                </span>
              </div>

              <div className="space-y-2">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-800 text-xs space-y-1 hover:border-blue-200 dark:hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-slate-800 dark:text-zinc-200">{n.title}</p>
                      <span className="text-[10px] text-slate-400">{n.time}</span>
                    </div>
                    <p className="text-slate-500 dark:text-zinc-400 text-[11px] leading-relaxed">{n.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar with Cloud Sync */}
        <div
          onClick={() => setActiveTab("budget")}
          className="flex items-center gap-2 pl-1 cursor-pointer group"
        >
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 dark:from-[#ff2d78] dark:to-[#bd00ff] p-0.5 shadow-xs group-hover:scale-105 transition-transform">
            <div className="w-full h-full rounded-[10px] bg-white dark:bg-[#121217] flex items-center justify-center text-xs font-bold text-blue-700 dark:text-white">
              {(profile.name || "Rohan")[0]?.toUpperCase()}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
