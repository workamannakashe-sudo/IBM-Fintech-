import React, { useState } from "react";
import { useFinancial } from "../context/FinancialContext";
import {
  Receipt,
  Share2,
  Copy,
  Plus,
  ArrowRight,
  Check,
  Upload,
  Utensils,
  Plane,
  Home,
  Film
} from "lucide-react";

interface Friend {
  id: string;
  name: string;
  avatar: string;
  selected: boolean;
  amountOwed: number;
}

const INITIAL_FRIENDS: Friend[] = [
  { id: "f1", name: "Jony L.", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80", selected: true, amountOwed: 0 },
  { id: "f2", name: "Amy J.", avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80", selected: true, amountOwed: 0 },
  { id: "f3", name: "Lisa M.", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80", selected: true, amountOwed: 0 },
  { id: "f4", name: "Drake G.", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80", selected: false, amountOwed: 0 },
  { id: "f5", name: "Sarah K.", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80", selected: false, amountOwed: 0 },
  { id: "f6", name: "Rohan S.", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80", selected: false, amountOwed: 0 },
];

const PRESET_ACTIVITIES = [
  { title: "Le Ju' Bistro Dinner", amount: 1230, category: "Food & Dining", icon: Utensils },
  { title: "Hostel Flat Electricity & Wifi", amount: 2400, category: "Housing & Rent", icon: Home },
  { title: "Weekend Goa Roadtrip Pool", amount: 6500, category: "Travel & Commute", icon: Plane },
  { title: "Cinema IMAX Group Tickets", amount: 1600, category: "Entertainment", icon: Film },
];

export const SplitBill: React.FC = () => {
  const { currency, addTransaction } = useFinancial();

  const [billTotal, setBillTotal] = useState(currency === "INR" ? "1230" : "123.00");
  const [eventName, setEventName] = useState("Le Ju' Bistro Dinner");
  const [friends, setFriends] = useState<Friend[]>(INITIAL_FRIENDS);
  const [copied, setCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const formatAmt = (val: number) => {
    if (currency === "INR") {
      return `₹${Math.round(val).toLocaleString("en-IN")}`;
    }
    return `$${val.toFixed(2)}`;
  };

  const selectedFriends = friends.filter(f => f.selected);
  const totalPeople = selectedFriends.length + 1; // user + selected friends
  const parsedTotal = parseFloat(billTotal) || 0;
  const equalPortion = parsedTotal > 0 ? parsedTotal / totalPeople : 0;

  const toggleFriend = (id: string) => {
    setFriends(prev =>
      prev.map(f => (f.id === id ? { ...f, selected: !f.selected } : f))
    );
  };

  const handleApplyPreset = (p: typeof PRESET_ACTIVITIES[0]) => {
    setEventName(p.title);
    setBillTotal(String(currency === "INR" ? p.amount : (p.amount / 10).toFixed(2)));
  };

  const handleSaveAndSplit = async () => {
    if (parsedTotal <= 0) return;
    try {
      await addTransaction(
        `${eventName} (My Share)`,
        equalPortion,
        new Date().toISOString().split("T")[0],
        "Food & Dining"
      );
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(
      `BudgetMitra Split Request for ${eventName}: ${formatAmt(equalPortion)} per person.`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-7 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-display tracking-tight flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Receipt className="w-5 h-5" />
            </div>
            Split the Bill Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Effortlessly split campus meals, flat groceries, and group trips with instant shareable links.
          </p>
        </div>

        {/* Quick presets */}
        <div className="flex items-center gap-2 flex-wrap">
          {PRESET_ACTIVITIES.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleApplyPreset(p)}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-emerald-400 text-xs font-semibold text-slate-700 dark:text-zinc-300 transition-all cursor-pointer shadow-xs"
            >
              {p.title.split(" ")[0]} ({formatAmt(currency === "INR" ? p.amount : p.amount / 10)})
            </button>
          ))}
        </div>
      </div>

      {/* Main 2-Column Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT: Bill Details & Amount Setup (7 cols) */}
        <div className="lg:col-span-7 rounded-3xl bg-white dark:bg-[#121217] border border-slate-200/90 dark:border-zinc-800 p-6 sm:p-7 ambient-shadow-card space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">
              Bill Information
            </h3>
            <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
              Equal Split
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5">
                Event / Merchant Name
              </label>
              <input
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="e.g. Campus Mess, Flat Rent, Weekend Roadtrip"
                className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 focus:border-emerald-500 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5">
                Total Bill Amount
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 font-bold text-sm">
                  {currency === "INR" ? "₹" : "$"}
                </span>
                <input
                  type="number"
                  step="any"
                  value={billTotal}
                  onChange={(e) => setBillTotal(e.target.value)}
                  placeholder="0.00"
                  className="w-full h-11 pl-8 pr-3.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 focus:border-emerald-500 text-base font-bold text-slate-900 dark:text-white outline-none font-display"
                />
              </div>
            </div>
          </div>

          {/* Action Tools: Receipt OCR, WhatsApp Share, Copy Link */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <button
              onClick={() => alert("Receipt uploaded & scanned successfully!")}
              className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 text-center transition-all cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center mx-auto mb-1 group-hover:scale-105 transition-transform">
                <Upload className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 block">Scan Receipt</span>
              <span className="text-[10px] text-slate-400">Auto OCR Extract</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 text-center transition-all cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center mx-auto mb-1 group-hover:scale-105 transition-transform">
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 block">
                {copied ? "Copied!" : "Copy Request"}
              </span>
              <span className="text-[10px] text-slate-400">UPI / Payment Link</span>
            </button>

            <button
              onClick={() => {
                const url = `https://wa.me/?text=${encodeURIComponent(
                  `Hey! Split request for ${eventName}: ${formatAmt(equalPortion)} per person via BudgetMitra.`
                )}`;
                window.open(url, "_blank");
              }}
              className="p-3 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-center transition-all cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center mx-auto mb-1 group-hover:scale-105 transition-transform">
                <Share2 className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block">WhatsApp Share</span>
              <span className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70">1-Tap Send</span>
            </button>
          </div>

          {/* Friend Multi-Select Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                Select Friends Sharing this Bill ({selectedFriends.length} selected)
              </span>
              <button
                onClick={() => {
                  const name = prompt("Friend's name:");
                  if (name) {
                    setFriends(prev => [
                      ...prev,
                      {
                        id: `f_${Date.now()}`,
                        name,
                        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80",
                        selected: true,
                        amountOwed: 0,
                      },
                    ]);
                  }
                }}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" /> Add Friend
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {friends.map((f) => (
                <div
                  key={f.id}
                  onClick={() => toggleFriend(f.id)}
                  className={`p-3 rounded-2xl border flex items-center gap-3 transition-all cursor-pointer select-none ${
                    f.selected
                      ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30"
                      : "border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/40 opacity-60"
                  }`}
                >
                  <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 border border-white dark:border-zinc-800">
                    <img src={f.avatar} alt={f.name} className="w-full h-full object-cover" />
                    {f.selected && (
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full flex items-center justify-center text-white text-[8px] font-bold">
                        ✓
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{f.name}</p>
                    <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                      {formatAmt(equalPortion)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: Live Split Summary & Settlement (5 cols) */}
        <div className="lg:col-span-5 rounded-3xl bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 text-white p-7 shadow-xl shadow-emerald-600/20 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-white/20">
              <div>
                <span className="text-emerald-100 text-xs uppercase tracking-wider font-bold block">
                  Total Bill
                </span>
                <span className="text-3xl sm:text-4xl font-extrabold font-display">
                  {formatAmt(parsedTotal)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-emerald-100 text-xs font-semibold block">Total People</span>
                <span className="text-2xl font-bold font-display">{totalPeople} Members</span>
              </div>
            </div>

            {/* Split Breakdown */}
            <div className="mt-6 space-y-3.5">
              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-between">
                <div>
                  <span className="text-xs text-emerald-100 font-medium">Your Portion to Pay</span>
                  <p className="text-2xl font-bold font-display">{formatAmt(equalPortion)}</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-white text-slate-900 text-xs font-bold">
                  Logged in Expenses
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 space-y-2">
                <span className="text-xs text-emerald-100 font-medium block">
                  Friends Collecting ({selectedFriends.length}):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedFriends.map((f) => (
                    <span
                      key={f.id}
                      className="px-2.5 py-1 rounded-lg bg-white/20 text-xs font-bold text-white flex items-center gap-1"
                    >
                      <span>{f.name}:</span>
                      <span className="text-emerald-200">{formatAmt(equalPortion)}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Action button */}
          <div>
            <button
              onClick={handleSaveAndSplit}
              className="w-full py-4 px-6 rounded-2xl bg-white hover:bg-emerald-50 text-emerald-950 font-bold text-sm shadow-lg shadow-black/10 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSaved ? (
                <>
                  <Check className="w-5 h-5 text-emerald-600" />
                  <span>Split Logged to Your Expenses!</span>
                </>
              ) : (
                <>
                  <span>Record & Split In ({formatAmt(equalPortion)})</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
