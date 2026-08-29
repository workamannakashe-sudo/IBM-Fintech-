// Expenses.tsx - Enhanced Expense Tracker & CSV Ingestion with Dark/Light Support
import React, { useState, useRef, useMemo } from "react";
import { useFinancial } from "../context/FinancialContext";
import type { Transaction } from "../context/FinancialContext";
import { parseBankCSV } from "../services/csvParser";
import {
  Trash2,
  AlertTriangle,
  Upload,
  FileSpreadsheet,
  Sparkles,
  Filter,
  Info,
  X,
  Coffee,
  Utensils,
  Bus,
  BookOpen
} from "lucide-react";

export const Expenses: React.FC = () => {
  const {
    transactions,
    deleteTransaction,
    addCSVTransactions,
    addTransaction,
    currency,
  } = useFinancial();

  // CSV Drag and drop states
  const [dragActive, setDragActive] = useState(false);
  const [csvStatus, setCsvStatus] = useState<string | null>(null);
  const [csvLoading, setCsvLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual fast log states
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food & Dining");
  const [logLoading, setLogLoading] = useState(false);

  // Filtering states
  const [filterCategory, setFilterCategory] = useState("All");

  // Anomaly detail overlay modal state
  const [selectedAnomaly, setSelectedAnomaly] = useState<Transaction | null>(null);

  const categoriesList = [
    "Housing & Rent",
    "Food & Dining",
    "Textbooks & Tuition",
    "Entertainment & Subscriptions",
    "Transportation",
    "Health & Wellness",
    "Shopping & Personal",
    "Miscellaneous",
  ];

  const formatAmt = (val: number) => {
    if (currency === "INR") {
      return `₹${Math.round(val).toLocaleString("en-IN")}`;
    }
    return `$${val.toFixed(2)}`;
  };

  const presets = useMemo(() => {
    if (currency === "INR") {
      return [
        { label: "Chai & Samosa", amount: "50.00", category: "Food & Dining", icon: Coffee },
        { label: "College Mess", amount: "120.00", category: "Food & Dining", icon: Utensils },
        { label: "Auto / Metro Pool", amount: "60.00", category: "Transportation", icon: Bus },
        { label: "Study Materials", amount: "450.00", category: "Textbooks & Tuition", icon: BookOpen },
      ];
    }
    return [
      { label: "Campus Coffee", amount: "5.50", category: "Food & Dining", icon: Coffee },
      { label: "Dining Hall Meal", amount: "12.00", category: "Food & Dining", icon: Utensils },
      { label: "Campus Transit", amount: "2.50", category: "Transportation", icon: Bus },
      { label: "Course Materials", amount: "45.00", category: "Textbooks & Tuition", icon: BookOpen },
    ];
  }, [currency]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processCSVFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processCSVFile(e.target.files[0]);
    }
  };

  const processCSVFile = async (file: File) => {
    setCsvLoading(true);
    setCsvStatus(null);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const text = event.target?.result as string;
        try {
          const parsed = await parseBankCSV(text);
          if (parsed.length === 0) {
            setCsvStatus("⚠️ No valid transactions found in CSV.");
          } else {
            const count = await addCSVTransactions(parsed);
            setCsvStatus(`✅ Successfully imported ${count} transactions using Gemini categorization!`);
          }
        } catch (err) {
          setCsvStatus("❌ Failed parsing CSV: " + (err as Error).message);
        } finally {
          setCsvLoading(false);
        }
      };
      reader.readAsText(file);
    } catch (err) {
      setCsvStatus("❌ Upload error: " + (err as Error).message);
      setCsvLoading(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmt = parseFloat(amount);
    if (!description.trim() || isNaN(parsedAmt) || parsedAmt <= 0) return;

    setLogLoading(true);
    try {
      await addTransaction(description, parsedAmt, new Date().toISOString().split("T")[0], category);
      setDescription("");
      setAmount("");
    } catch (error) {
      console.error(error);
    } finally {
      setLogLoading(false);
    }
  };

  const filteredTransactions = transactions.filter((t) => {
    if (filterCategory === "All") return true;
    if (filterCategory === "Anomalies") return t.isAnomaly;
    return t.category === filterCategory;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-display">
          Expenses Tracker
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1">
          Upload bank statement CSV files or log manual card purchases with automatic AI categorization.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* LEFT COLUMN: Ingestion (CSV and Manual) */}
        <div className="lg:col-span-1 space-y-6">
          {/* CSV drag drop zone */}
          <div className="rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#121217] p-5 ambient-shadow-card">
            <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <FileSpreadsheet className="h-4.5 w-4.5 text-blue-600 dark:text-cyan-400" />
              CSV Statement Upload
            </h3>

            <form
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                dragActive
                  ? "border-blue-500 bg-blue-50/50 dark:bg-cyan-950/40"
                  : "border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900/40"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />

              <Upload className="h-8 w-8 text-slate-400 dark:text-zinc-500 mb-2" />
              <p className="text-xs font-bold text-slate-700 dark:text-zinc-300">Drag & drop CSV statement here</p>
              <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">or click to browse local files</p>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={csvLoading}
                className="mt-3.5 rounded-xl border border-slate-200 dark:border-zinc-700 hover:border-slate-300 bg-white dark:bg-zinc-800 px-3.5 py-1.5 text-[11px] font-bold text-slate-700 dark:text-zinc-200 transition-colors cursor-pointer shadow-xs"
              >
                {csvLoading ? "Processing File..." : "Select File"}
              </button>
            </form>

            {csvStatus && (
              <div className="mt-3 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 p-3 text-[11px] font-medium leading-relaxed text-slate-700 dark:text-zinc-300">
                {csvStatus}
              </div>
            )}
          </div>

          {/* Quick Manual Entry log card */}
          <div className="rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#121217] p-5 ambient-shadow-card">
            <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Sparkles className="h-4.5 w-4.5 text-blue-600 dark:text-cyan-400" />
              Log Expense Item
            </h3>

            {/* Quick Presets */}
            <div className="mb-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-1.5">
                Presets
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {presets.map((p, idx) => {
                  const PresetIcon = p.icon;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setDescription(p.label);
                        setAmount(p.amount);
                        setCategory(p.category);
                      }}
                      className="flex items-center gap-1.5 border border-slate-200 dark:border-zinc-800 hover:border-blue-400 dark:hover:border-cyan-400 bg-slate-50 dark:bg-zinc-900/60 p-2 rounded-xl text-left transition-colors cursor-pointer"
                    >
                      <PresetIcon className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500 shrink-0" />
                      <div className="overflow-hidden">
                        <span className="text-[10px] font-bold text-slate-700 dark:text-zinc-300 block truncate">
                          {p.label}
                        </span>
                        <span className="text-[9px] text-blue-600 dark:text-cyan-400 font-bold">
                          {currency === "INR" ? `₹${p.amount}` : `$${p.amount}`}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
                  Description
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chai, Uber"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full h-9 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white px-3 text-xs outline-none focus:border-blue-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
                    Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full h-9 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white px-3 text-xs font-bold outline-none focus:border-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-9 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white px-2 text-xs outline-none focus:border-blue-500 transition-all cursor-pointer"
                  >
                    {categoriesList.map((cat, idx) => (
                      <option key={idx} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={logLoading || !description.trim() || !amount}
                className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-gradient-to-r dark:from-[#ff2d78] dark:to-[#bd00ff] text-white py-2.5 text-xs font-bold shadow-md shadow-blue-500/20 dark:shadow-[0_0_15px_rgba(255,45,120,0.3)] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {logLoading ? "Categorizing..." : "Log Item"}
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: Log Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-[#121217] border border-slate-200/90 dark:border-zinc-800 rounded-2xl p-4 ambient-shadow-card">
            <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="h-4.5 w-4.5 text-slate-400" />
              Transaction History
            </h3>

            <div className="flex gap-1.5 flex-wrap">
              <button
                onClick={() => setFilterCategory("All")}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer ${
                  filterCategory === "All"
                    ? "bg-blue-600 dark:bg-cyan-500 text-white dark:text-slate-950"
                    : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-200"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterCategory("Anomalies")}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer ${
                  filterCategory === "Anomalies"
                    ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300"
                    : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-200"
                }`}
              >
                Anomalies ⚠️
              </button>
              {categoriesList.slice(0, 4).map((cat, idx) => (
                <button
                  key={idx}
                  onClick={() => setFilterCategory(cat)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer ${
                    filterCategory === cat
                      ? "bg-blue-600 dark:bg-cyan-500 text-white dark:text-slate-950"
                      : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-200"
                  }`}
                >
                  {cat.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#121217] ambient-shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/60 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-400">
                    <th className="p-3.5 pl-5">Date</th>
                    <th className="p-3.5">Description</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5 text-right">Amount</th>
                    <th className="p-3.5 pr-5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-xs text-slate-400 dark:text-zinc-500">
                        No transactions match the selected filter category.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((tx) => (
                      <tr
                        key={tx.id}
                        className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/50 transition-colors text-xs text-slate-700 dark:text-zinc-300"
                      >
                        <td className="p-3.5 pl-5 font-semibold text-slate-500 dark:text-zinc-400">{tx.date}</td>
                        <td className="p-3.5 font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          {tx.description}
                          {tx.isAnomaly && (
                            <button
                              onClick={() => setSelectedAnomaly(tx)}
                              className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 cursor-pointer"
                              title="Click for AI anomaly breakdown"
                            >
                              <AlertTriangle className="h-2.5 w-2.5" />
                            </button>
                          )}
                        </td>
                        <td className="p-3.5">
                          <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-zinc-800 px-2.5 py-0.5 text-[10px] font-medium text-slate-700 dark:text-zinc-300">
                            {tx.category}
                          </span>
                        </td>
                        <td className="p-3.5 text-right font-display font-bold text-slate-900 dark:text-white">
                          {formatAmt(tx.amount)}
                        </td>
                        <td className="p-3.5 pr-5 text-center">
                          <button
                            onClick={() => deleteTransaction(tx.id)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-600 dark:hover:text-rose-400 transition-all cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Anomaly Explainer Overlay Modal Dialog */}
      {selectedAnomaly && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#18181f] p-6 shadow-2xl border border-slate-200 dark:border-zinc-800 animate-in fade-in scale-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-rose-500 dark:text-[#ff2d78]" />
                <h4 className="font-display text-sm font-bold text-slate-900 dark:text-white">
                  Spending Anomaly Flag
                </h4>
              </div>
              <button
                onClick={() => setSelectedAnomaly(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <div className="rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/50 p-4">
                <p className="text-[10px] font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider">
                  Transaction Info
                </p>
                <p className="text-xs text-slate-900 dark:text-white font-bold mt-1">
                  {selectedAnomaly.description} &bull; {formatAmt(selectedAnomaly.amount)}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5">
                  Category: {selectedAnomaly.category} ({selectedAnomaly.date})
                </p>
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Info className="h-3.5 w-3.5 text-blue-600 dark:text-cyan-400" />
                  Bob's AI Explanation
                </p>
                <p className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed font-medium">
                  {selectedAnomaly.anomalyExplanation ||
                    "This purchase exceeds typical daily expenditure models. We recommend cross-referencing your month-end budget limit envelopes."}
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedAnomaly(null)}
              className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-gradient-to-r dark:from-[#ff2d78] dark:to-[#bd00ff] text-white py-2.5 text-xs font-bold transition-all cursor-pointer"
            >
              Close Notice
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
