// QuickLogModal.tsx - Fast Expense Logger with Dark/Light Support
import React, { useState } from "react";
import { useFinancial } from "../context/FinancialContext";
import { X, Sparkles, Coffee, Utensils, Bus, BookOpen } from "lucide-react";
import { motion } from "motion/react";

interface QuickLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickLogModal: React.FC<QuickLogModalProps> = ({ isOpen, onClose }) => {
  const { addTransaction, currency } = useFinancial();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Preset Chips based on Currency
  const presets = currency === "INR" ? [
    { label: "Chai & Samosa", amount: "50", category: "Food & Dining", icon: Coffee },
    { label: "Campus Mess Meal", amount: "120", category: "Food & Dining", icon: Utensils },
    { label: "Auto / Metro Fare", amount: "60", category: "Transportation", icon: Bus },
    { label: "Study Materials", amount: "350", category: "Textbooks & Tuition", icon: BookOpen },
  ] : [
    { label: "Campus Coffee", amount: "5.50", category: "Food & Dining", icon: Coffee },
    { label: "Dining Hall Meal", amount: "12.00", category: "Food & Dining", icon: Utensils },
    { label: "Campus Transit", amount: "2.50", category: "Transportation", icon: Bus },
    { label: "Course Materials", amount: "45.00", category: "Textbooks & Tuition", icon: BookOpen },
  ];

  const handleApplyPreset = (p: typeof presets[0]) => {
    setDescription(p.label);
    setAmount(p.amount);
    setCategory(p.category);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmt = parseFloat(amount);
    if (!description.trim() || isNaN(parsedAmt) || parsedAmt <= 0) {
      alert("Please enter a valid description and positive amount.");
      return;
    }

    setIsSubmitting(true);
    try {
      await addTransaction(description, parsedAmt, date, category || undefined);
      setDescription("");
      setAmount("");
      setCategory("");
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-lg overflow-hidden rounded-2xl bg-white dark:bg-[#18181f] p-6 shadow-2xl border border-slate-200 dark:border-zinc-800"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-[#ff2d78]/20 text-blue-600 dark:text-[#ff2d78]">
              <Sparkles className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                Log Campus Expense
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Instant tracking with AI category tagging
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Quick presets list */}
        <div className="py-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-2">
            Frequent Purchases
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {presets.map((p, idx) => {
              const Icon = p.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className="flex flex-col items-center justify-center rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/60 hover:bg-blue-50 dark:hover:bg-cyan-950/40 hover:border-blue-300 dark:hover:border-cyan-500/40 p-2.5 transition-all text-center cursor-pointer"
                >
                  <Icon className="h-4 w-4 text-slate-500 dark:text-zinc-400 mb-1" />
                  <span className="text-[10px] font-bold text-slate-700 dark:text-zinc-300 block truncate w-full">
                    {p.label}
                  </span>
                  <span className="text-[11px] font-bold text-blue-600 dark:text-cyan-400">
                    {currency === "INR" ? `₹${p.amount}` : `$${p.amount}`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Manual entry form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1">
              Description / Payee
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Campus Bookstore, Starbucks, Dinner"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white text-xs sm:text-sm focus:border-blue-500 dark:focus:border-[#ff2d78] outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1">
                Amount ({currency === "INR" ? "₹" : "$"})
              </label>
              <input
                type="number"
                step="any"
                required
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white text-xs sm:text-sm font-bold focus:border-blue-500 dark:focus:border-[#ff2d78] outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white text-xs focus:border-blue-500 dark:focus:border-[#ff2d78] outline-none transition-all cursor-pointer"
              >
                <option value="">✨ Let Gemini Auto-Categorize</option>
                <option value="Housing & Rent">Housing & Rent</option>
                <option value="Food & Dining">Food & Dining</option>
                <option value="Textbooks & Tuition">Textbooks & Tuition</option>
                <option value="Entertainment & Subscriptions">Entertainment & Subscriptions</option>
                <option value="Transportation">Transportation</option>
                <option value="Health & Wellness">Health & Wellness</option>
                <option value="Shopping & Personal">Shopping & Personal</option>
                <option value="Miscellaneous">Miscellaneous</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1">
              Date
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white text-xs focus:border-blue-500 dark:focus:border-[#ff2d78] outline-none transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-gradient-to-r dark:from-[#ff2d78] dark:to-[#bd00ff] text-white py-3 text-xs font-bold shadow-md shadow-blue-500/20 dark:shadow-[0_0_15px_rgba(255,45,120,0.4)] disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {isSubmitting ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <span>Add Transaction</span>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};
