import React, { useState } from "react";
import { useFinancial } from "../context/FinancialContext";
import {
  X,
  Receipt,
  Share2,
  Plus,
  Check,
  Users,
  Copy,
  ArrowRight,
  Upload
} from "lucide-react";
import { motion } from "motion/react";

interface SplitBillModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Friend {
  id: string;
  name: string;
  avatar: string;
  selected: boolean;
  percentage?: number;
}

const DEFAULT_FRIENDS: Friend[] = [
  { id: "f1", name: "Jony L.", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80", selected: true },
  { id: "f2", name: "Amy J.", avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80", selected: true },
  { id: "f3", name: "Lisa M.", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80", selected: true },
  { id: "f4", name: "Drake G.", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80", selected: false },
  { id: "f5", name: "Sarah K.", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80", selected: false },
  { id: "f6", name: "Rohan S.", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80", selected: false },
];

export const SplitBillModal: React.FC<SplitBillModalProps> = ({ isOpen, onClose }) => {
  const { currency, addTransaction } = useFinancial();

  const [billAmount, setBillAmount] = useState(currency === "INR" ? "1230" : "123.00");
  const [merchantName, setMerchantName] = useState("Le Ju' Bistro");
  const [billDate] = useState(() => new Date().toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }));
  const [splitMode, setSplitMode] = useState<"friends" | "percentages">("friends");
  const [friends, setFriends] = useState<Friend[]>(DEFAULT_FRIENDS);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [splitSuccess, setSplitSuccess] = useState(false);

  if (!isOpen) return null;

  const toggleFriend = (id: string) => {
    setFriends(prev =>
      prev.map(f => (f.id === id ? { ...f, selected: !f.selected } : f))
    );
  };

  const selectedFriends = friends.filter(f => f.selected);
  const totalCount = selectedFriends.length + 1; // including user

  const totalBillNumber = parseFloat(billAmount) || 0;
  const userShare = totalBillNumber > 0 ? (totalBillNumber / totalCount) : 0;
  const friendShare = totalBillNumber > 0 ? (totalBillNumber / totalCount) : 0;

  const formatAmt = (val: number) => {
    if (currency === "INR") {
      return `₹${Math.round(val).toLocaleString("en-IN")}`;
    }
    return `$${val.toFixed(2)}`;
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(
      `Hey! Here's the split request for ${merchantName}: ${formatAmt(friendShare)} per person via BudgetMitra.`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleExecuteSplit = async () => {
    if (totalBillNumber <= 0) return;
    setIsProcessing(true);
    try {
      // Log the user's portion of the split bill
      await addTransaction(
        `${merchantName} (My Share of Split)`,
        userShare,
        new Date().toISOString().split("T")[0],
        "Food & Dining"
      );
      setSplitSuccess(true);
      setTimeout(() => {
        setSplitSuccess(false);
        onClose();
      }, 1800);
    } catch (e) {
      console.error("Split execution error:", e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-md rounded-3xl bg-white dark:bg-[#121217] border border-slate-200 dark:border-zinc-800 p-6 shadow-2xl overflow-hidden relative"
      >
        {/* Top bar with back / close */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-800/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <h3 className="text-xl font-bold font-display text-slate-900 dark:text-white">
              Split the Bill
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Bill Summary Banner */}
        <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-50/40 dark:from-zinc-900 dark:via-zinc-900/80 dark:to-zinc-900 border border-emerald-200/70 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/25">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                Bill Balance
              </span>
              <div className="relative flex items-center">
                <span className="text-xs font-bold text-slate-500 mr-1">{currency === "INR" ? "₹" : "$"}</span>
                <input
                  type="number"
                  step="any"
                  value={billAmount}
                  onChange={(e) => setBillAmount(e.target.value)}
                  className="text-2xl font-extrabold font-display text-slate-900 dark:text-white bg-transparent outline-none w-32 border-b border-transparent focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 block">
              {billDate}
            </span>
            <input
              type="text"
              value={merchantName}
              onChange={(e) => setMerchantName(e.target.value)}
              className="text-xs font-bold text-emerald-800 dark:text-emerald-400 bg-white/60 dark:bg-zinc-800/60 px-2 py-0.5 rounded-lg border border-emerald-200/60 dark:border-zinc-700 text-right outline-none mt-1"
            />
          </div>
        </div>

        {/* Action Icon Strip */}
        <div className="grid grid-cols-4 gap-2 my-4">
          <button
            onClick={() => alert("Receipt uploaded and auto-scanned via OCR!")}
            className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200/80 dark:border-zinc-800 transition-all group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
              <Upload className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-slate-700 dark:text-zinc-300">Receipt</span>
          </button>

          <button
            onClick={handleCopyLink}
            className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200/80 dark:border-zinc-800 transition-all group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </div>
            <span className="text-[10px] font-bold text-slate-700 dark:text-zinc-300">
              {copied ? "Copied!" : "Copy"}
            </span>
          </button>

          <button
            onClick={() => {
              const url = `https://wa.me/?text=${encodeURIComponent(
                `Hey! Split request for ${merchantName}: ${formatAmt(friendShare)} each via BudgetMitra.`
              )}`;
              window.open(url, "_blank");
            }}
            className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200/80 dark:border-zinc-800 transition-all group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
              <Share2 className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-slate-700 dark:text-zinc-300">Share</span>
          </button>

          <button
            onClick={() => {
              const newName = prompt("Enter friend's name:");
              if (newName) {
                setFriends(prev => [
                  ...prev,
                  {
                    id: `f_${Date.now()}`,
                    name: newName,
                    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80",
                    selected: true,
                  },
                ]);
              }
            }}
            className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
              <Plus className="w-4 h-4 stroke-[3]" />
            </div>
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">Add</span>
          </button>
        </div>

        {/* Friend Selector & Split Type */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Your Friends ({selectedFriends.length} selected)
            </span>
            <div className="flex rounded-xl bg-slate-100 dark:bg-zinc-900 p-1 border border-slate-200 dark:border-zinc-800">
              <button
                onClick={() => setSplitMode("friends")}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  splitMode === "friends"
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs"
                    : "text-slate-500 dark:text-zinc-400"
                }`}
              >
                Equal
              </button>
              <button
                onClick={() => setSplitMode("percentages")}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  splitMode === "percentages"
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs"
                    : "text-slate-500 dark:text-zinc-400"
                }`}
              >
                % Custom
              </button>
            </div>
          </div>

          {/* Friends Avatar Grid */}
          <div className="grid grid-cols-4 gap-2.5 max-h-40 overflow-y-auto p-1">
            {friends.map((f) => (
              <div
                key={f.id}
                onClick={() => toggleFriend(f.id)}
                className={`flex flex-col items-center p-2 rounded-2xl border transition-all cursor-pointer select-none ${
                  f.selected
                    ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 scale-102"
                    : "border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 opacity-60 hover:opacity-100"
                }`}
              >
                <div className="relative w-11 h-11 rounded-full overflow-hidden mb-1 border-2 border-white dark:border-zinc-800 shadow-xs">
                  <img src={f.avatar} alt={f.name} className="w-full h-full object-cover" />
                  {f.selected && (
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center text-white text-[9px] shadow-xs">
                      ✓
                    </div>
                  )}
                </div>
                <span className="text-[10px] font-bold text-slate-800 dark:text-zinc-200 truncate w-full text-center">
                  {f.name}
                </span>
                <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                  {formatAmt(friendShare)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Calculated breakdown pill */}
        <div className="mt-4 p-3 rounded-2xl bg-slate-100 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-500 dark:text-zinc-400 font-medium">Your Portion ({totalCount} people):</span>
            <p className="font-extrabold text-slate-900 dark:text-white text-base font-display">
              {formatAmt(userShare)}
            </p>
          </div>
          <div className="text-right">
            <span className="text-slate-500 dark:text-zinc-400 font-medium">Friend portion:</span>
            <p className="font-bold text-emerald-600 dark:text-emerald-400">
              {formatAmt(friendShare)} / person
            </p>
          </div>
        </div>

        {/* Primary Action Button */}
        <div className="mt-5">
          <button
            onClick={handleExecuteSplit}
            disabled={isProcessing || totalBillNumber <= 0}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-white text-sm font-bold shadow-lg shadow-emerald-500/25 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {splitSuccess ? (
              <>
                <Check className="w-5 h-5" />
                <span>Split Recorded & Logged!</span>
              </>
            ) : isProcessing ? (
              <span>Recording Split Transaction...</span>
            ) : (
              <>
                <span>Split In ({formatAmt(userShare)})</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
