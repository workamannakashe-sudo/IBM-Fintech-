// FinWise Quick-Log Modal Form (QuickLogModal.tsx)
import React, { useState } from "react";
import { useFinancial } from "../context/FinancialContext";
import { X, Sparkles, Coffee, Utensils, Bus, BookOpen } from "lucide-react";
import { motion } from "motion/react";

interface QuickLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickLogModal: React.FC<QuickLogModalProps> = ({ isOpen, onClose }) => {
  const { addTransaction } = useFinancial();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState("2026-08-27"); // Grounded in current context
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Preset Chips
  const presets = [
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
      // Clean form fields
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-lg overflow-hidden rounded-2xl bg-white p-6 shadow-2xl border border-slate-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
              <Sparkles className="h-4.5 w-4.5 animate-pulse" />
            </div>
            <h3 className="font-display text-lg font-bold text-slate-900">Log Campus Expense</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Quick presets list */}
        <div className="py-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
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
                  className="flex flex-col items-center justify-center rounded-xl border border-slate-200/80 bg-slate-50 hover:bg-teal-50 hover:border-brand-teal p-2.5 transition-all text-center select-none"
                >
                  <Icon className="h-4 w-4 text-slate-500 hover:text-brand-teal mb-1" />
                  <span className="text-[10px] font-bold text-slate-700 block truncate w-full">
                    {p.label}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500">${p.amount}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Manual entry form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              Description / Payee
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Campus Bookstore, Starbucks, Diner"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-200/80 bg-slate-50 px-3 py-2 text-xs focus:outline-none focus:border-brand-teal focus:ring-1 focus:ring-brand-teal transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Amount ($)
              </label>
              <input
                type="number"
                step="0.01"
                required
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl border border-slate-200/80 bg-slate-50 px-3 py-2 text-xs focus:outline-none focus:border-brand-teal focus:ring-1 focus:ring-brand-teal transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Category (Optional - AI Auto-Tag)
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-200/80 bg-slate-50 px-3 py-2 text-xs focus:outline-none focus:border-brand-teal focus:ring-1 focus:ring-brand-teal transition-all"
              >
                <option value="">✨ Let Gemini Categorize</option>
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
            <label className="block text-xs font-bold text-slate-600 mb-1">
              Date
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200/80 bg-slate-50 px-3 py-2 text-xs focus:outline-none focus:border-brand-teal focus:ring-1 focus:ring-brand-teal transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-brand-teal text-white hover:bg-brand-teal-light py-3 text-xs font-bold shadow-md shadow-teal-700/10 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
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
