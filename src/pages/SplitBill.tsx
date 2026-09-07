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
  Film,
  QrCode,
  Smartphone,
  Sparkles,
} from "lucide-react";

interface Friend {
  id: string;
  name: string;
  avatar: string;
  selected: boolean;
  amountOwed: number;
  upiId?: string;
}

const INITIAL_FRIENDS: Friend[] = [
  { id: "f1", name: "Rohan S.", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80", selected: true, amountOwed: 0, upiId: "rohan@okhdfcbank" },
  { id: "f2", name: "Sneha P.", avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80", selected: true, amountOwed: 0, upiId: "sneha@okaxis" },
  { id: "f3", name: "Priyansh K.", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80", selected: true, amountOwed: 0, upiId: "priyansh@paytm" },
  { id: "f4", name: "Neha M.", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80", selected: false, amountOwed: 0, upiId: "neha@ybl" },
  { id: "f5", name: "Aman N.", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80", selected: false, amountOwed: 0, upiId: "aman@upi" },
  { id: "f6", name: "Tanvi D.", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80", selected: false, amountOwed: 0, upiId: "tanvi@okicici" },
];

const PRESET_ACTIVITIES = [
  { title: "Hostel Biryani & Chai Night", amount: 1250, category: "Food & Dining", icon: Utensils },
  { title: "Flat Electricity & Wifi Bill", amount: 2400, category: "Housing & Rent", icon: Home },
  { title: "Lonavala Weekend Roadtrip", amount: 5800, category: "Travel & Commute", icon: Plane },
  { title: "IMAX Movie Group Booking", amount: 1800, category: "Entertainment", icon: Film },
];

export const SplitBill: React.FC = () => {
  const { currency, addTransaction } = useFinancial();

  const [billTotal, setBillTotal] = useState(currency === "INR" ? "1230" : "123.00");
  const [eventName, setEventName] = useState("Hostel Biryani & Chai Night");
  const [friends, setFriends] = useState<Friend[]>(INITIAL_FRIENDS);
  const [copied, setCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [payeeUpi, setPayeeUpi] = useState("rohan@okhdfcbank");
  const [showQrModal, setShowQrModal] = useState(false);

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

  const upiPayUri = `upi://pay?pa=${encodeURIComponent(payeeUpi)}&pn=${encodeURIComponent(
    eventName
  )}&am=${Math.round(equalPortion)}&cu=INR&tn=${encodeURIComponent(
    `BudgetMitra: ${eventName}`
  )}`;

  const upiQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
    upiPayUri
  )}`;

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
            Split the Bill & UPI Pay
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Split campus meals, flat bills & trip pools with instant 1-tap UPI links and QR codes.
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
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300 block mb-1.5">
                Activity / Expense Title
              </label>
              <input
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="e.g. Swiggy Hostel Party"
                className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 focus:border-emerald-500 text-sm font-semibold text-slate-900 dark:text-white outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300 block mb-1.5">
                Total Amount ({currency})
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                  {currency === "INR" ? "₹" : "$"}
                </span>
                <input
                  type="number"
                  value={billTotal}
                  onChange={(e) => setBillTotal(e.target.value)}
                  className="w-full h-11 pl-8 pr-3.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 focus:border-emerald-500 text-base font-bold text-slate-900 dark:text-white outline-none font-display"
                />
              </div>
            </div>
          </div>

          {/* Payee UPI ID configuration */}
          <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5" /> Receive Payments at UPI ID:
              </label>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">GPay / PhonePe / Paytm</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={payeeUpi}
                onChange={(e) => setPayeeUpi(e.target.value)}
                placeholder="yourname@okaxis"
                className="flex-1 h-9 px-3 rounded-lg bg-white dark:bg-zinc-900 border border-emerald-300 dark:border-emerald-700 text-xs font-bold text-slate-900 dark:text-white outline-none"
              />
              <button
                onClick={() => setShowQrModal(true)}
                className="px-3 h-9 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <QrCode className="w-3.5 h-3.5" /> Show QR
              </button>
            </div>
          </div>

          {/* Action Tools: Receipt OCR, WhatsApp Share, Copy Link */}
          <div className="grid grid-cols-3 gap-3 pt-1">
            <button
              onClick={() => alert("Receipt OCR initialized: Upload bill photo to auto-extract items!")}
              className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 text-center transition-all cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center mx-auto mb-1 group-hover:scale-105 transition-transform">
                <Upload className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 block">Scan Bill</span>
              <span className="text-[10px] text-slate-400">OCR Extract</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 text-center transition-all cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center mx-auto mb-1 group-hover:scale-105 transition-transform">
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 block">
                {copied ? "Copied!" : "Copy Link"}
              </span>
              <span className="text-[10px] text-slate-400">UPI Payment Link</span>
            </button>

            <button
              onClick={() => {
                const url = `https://wa.me/?text=${encodeURIComponent(
                  `Hey! Please pay your share for *${eventName}*: ${formatAmt(
                    equalPortion
                  )} via UPI to ${payeeUpi}.\nPay Link: ${upiPayUri}`
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
                        upiId: `${name.toLowerCase().replace(/\s+/g, "")}@upi`,
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

        {/* RIGHT: Live Split Summary & UPI Settlement (5 cols) */}
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

              {/* UPI Quick Action Card */}
              <div className="p-4 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-emerald-100 font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" /> UPI 1-Tap Settle
                  </span>
                  <button
                    onClick={() => setShowQrModal(true)}
                    className="text-[11px] font-bold text-white underline hover:text-emerald-200 cursor-pointer"
                  >
                    View QR Code
                  </button>
                </div>

                <div className="flex gap-2">
                  <a
                    href={upiPayUri}
                    className="flex-1 py-2 px-3 rounded-xl bg-white text-emerald-900 text-xs font-bold text-center flex items-center justify-center gap-1 hover:bg-emerald-50 transition-colors cursor-pointer shadow-sm"
                  >
                    <Smartphone className="w-3.5 h-3.5" /> Pay with UPI App
                  </a>
                  <button
                    onClick={handleCopyLink}
                    className="py-2 px-3 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    {copied ? "Copied!" : "Copy UPI Link"}
                  </button>
                </div>
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

      {/* UPI QR Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#18181f] border border-slate-200 dark:border-zinc-800 p-6 shadow-2xl text-center space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <QrCode className="w-4 h-4 text-emerald-500" /> Scan & Pay via UPI
              </h3>
              <button
                onClick={() => setShowQrModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs font-bold"
              >
                ✕ Close
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 flex flex-col items-center justify-center">
              <img
                src={upiQrUrl}
                alt="UPI Payment QR Code"
                className="w-40 h-40 rounded-xl bg-white p-2 border border-slate-200 shadow-sm"
              />
              <p className="text-xs font-bold text-slate-800 dark:text-white mt-3">{eventName}</p>
              <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 font-display">
                {formatAmt(equalPortion)} / person
              </p>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">UPI ID: {payeeUpi}</p>
            </div>

            <div className="flex gap-2">
              <a
                href={upiPayUri}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                <Smartphone className="w-3.5 h-3.5" /> Open in UPI App
              </a>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(payeeUpi);
                  alert("UPI ID copied!");
                }}
                className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-zinc-800"
              >
                Copy UPI ID
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
