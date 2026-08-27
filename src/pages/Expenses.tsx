// FinWise Expense Analyzer & CSV statement uploader (Expenses.tsx)
import React, { useState, useRef, useMemo } from "react";
import { useFinancial } from "../context/FinancialContext";
import type { Transaction } from "../context/FinancialContext";
import { parseBankCSV } from "../services/csvParser";
import { 
  Trash2, AlertTriangle, Upload, 
  FileSpreadsheet, Sparkles, Filter, Info, X,
  Coffee, Utensils, Bus, BookOpen 
} from "lucide-react";

export const Expenses: React.FC = () => {
  const { 
    transactions, 
    deleteTransaction, 
    addCSVTransactions,
    addTransaction,
    currency,
    userType
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

  // Preset categories
  const categoriesList = [
    "Housing & Rent", "Food & Dining", "Textbooks & Tuition", 
    "Entertainment & Subscriptions", "Transportation", 
    "Health & Wellness", "Shopping & Personal", "Miscellaneous"
  ];

  // Dynamic currency formatting helper
  const formatAmt = (val: number) => {
    if (currency === "INR") {
      return `₹${Math.round(val).toLocaleString("en-IN")}`;
    }
    return `$${val.toFixed(2)}`;
  };

  // Dynamic presets based on currency and userType
  const presets = useMemo(() => {
    if (currency === "INR") {
      if (userType === "Student") {
        return [
          { label: "Chai & Samosa", amount: "30.00", category: "Food & Dining", icon: Coffee },
          { label: "College Mess", amount: "120.00", category: "Food & Dining", icon: Utensils },
          { label: "Rickshaw Pool", amount: "40.00", category: "Transportation", icon: Bus },
          { label: "Course Materials", amount: "650.00", category: "Textbooks & Tuition", icon: BookOpen },
        ];
      } else {
        return [
          { label: "Starbucks Café", amount: "280.00", category: "Food & Dining", icon: Coffee },
          { label: "Café Lunch", amount: "450.00", category: "Food & Dining", icon: Utensils },
          { label: "Uber Commute", amount: "350.00", category: "Transportation", icon: Bus },
          { label: "Wifi Internet", amount: "900.00", category: "Entertainment & Subscriptions", icon: BookOpen },
        ];
      }
    } else {
      if (userType === "Student") {
        return [
          { label: "Campus Coffee", amount: "5.50", category: "Food & Dining", icon: Coffee },
          { label: "Dining Hall Meal", amount: "12.00", category: "Food & Dining", icon: Utensils },
          { label: "Campus Transit", amount: "2.50", category: "Transportation", icon: Bus },
          { label: "Course Materials", amount: "45.00", category: "Textbooks & Tuition", icon: BookOpen },
        ];
      } else {
        return [
          { label: "Starbucks Coffee", amount: "6.50", category: "Food & Dining", icon: Coffee },
          { label: "Diner Lunch", amount: "18.00", category: "Food & Dining", icon: Utensils },
          { label: "Uber Ride", amount: "25.00", category: "Transportation", icon: Bus },
          { label: "Wifi Bill", amount: "70.00", category: "Entertainment & Subscriptions", icon: BookOpen },
        ];
      }
    }
  }, [currency, userType]);

  // Drag and Drop handler functions
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
            setCsvStatus("⚠️ No valid transactions found in CSV. Ensure date, description, and amount columns exist.");
          } else {
            const count = await addCSVTransactions(parsed);
            setCsvStatus(`✅ Successfully imported ${count} transactions using Gemini categorization!`);
          }
        } catch (err) {
          setCsvStatus("❌ Failed parsing CSV layout: " + (err as Error).message);
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

  // Manual Log Submission
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmt = parseFloat(amount);
    if (!description.trim() || isNaN(parsedAmt) || parsedAmt <= 0) return;

    setLogLoading(true);
    try {
      await addTransaction(description, parsedAmt, "2026-08-27", category);
      setDescription("");
      setAmount("");
    } catch (error) {
      console.error(error);
    } finally {
      setLogLoading(false);
    }
  };

  // Filter transaction items
  const filteredTransactions = transactions.filter((t) => {
    if (filterCategory === "All") return true;
    if (filterCategory === "Anomalies") return t.isAnomaly;
    return t.category === filterCategory;
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Expenses Tracker</h1>
        <p className="text-sm text-slate-500">
          Upload bank statement CSV files or log manual card purchases to evaluate budget health metrics.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* LEFT COLUMN: Ingestions (CSV and Manual) */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* CSV drag drop zone */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <h3 className="font-display text-sm font-bold text-slate-800 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <FileSpreadsheet className="h-4.5 w-4.5 text-brand-teal" />
              CSV Statement Upload
            </h3>
            
            <form 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                dragActive ? "border-brand-teal bg-teal-50" : "border-slate-200 hover:bg-slate-50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <Upload className="h-8 w-8 text-slate-400 mb-2" />
              <p className="text-xs font-bold text-slate-700">Drag & drop CSV statement here</p>
              <p className="text-[10px] text-slate-400 mt-1">or click to browse local files</p>
              
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={csvLoading}
                className="mt-3.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 px-3 py-1.5 text-[10px] font-bold text-slate-600 transition-colors"
              >
                {csvLoading ? "Processing File..." : "Select File"}
              </button>
            </form>

            {csvStatus && (
              <div className="mt-3 rounded-lg bg-slate-50 border border-slate-100 p-3 text-[10px] font-medium leading-relaxed">
                {csvStatus}
              </div>
            )}
          </div>

          {/* Quick Manual Entry log card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <h3 className="font-display text-sm font-bold text-slate-800 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <Sparkles className="h-4.5 w-4.5 text-amber-500" />
              Log Expense Item
            </h3>

            {/* Quick Presets row inside panel */}
            <div className="mb-4">
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Presets</p>
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
                      className="flex items-center gap-1 border border-slate-200 hover:border-brand-teal hover:bg-teal-50 px-2 py-1 rounded-lg text-left transition-colors"
                    >
                      <PresetIcon className="h-3 w-3 text-slate-400 shrink-0" />
                      <div className="overflow-hidden">
                        <span className="text-[9px] font-bold text-slate-700 block truncate">{p.label}</span>
                        <span className="text-[8px] text-slate-500 font-semibold">{currency === "INR" ? "₹" : "$"}{p.amount}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chai, Uber"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:outline-none focus:border-brand-teal transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:outline-none focus:border-brand-teal transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:outline-none focus:border-brand-teal transition-all"
                  >
                    {categoriesList.map((cat, idx) => (
                      <option key={idx} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={logLoading || !description.trim() || !amount}
                className="w-full rounded-xl bg-brand-teal hover:bg-brand-teal-light text-white py-2.5 text-xs font-bold shadow-md shadow-teal-700/10 transition-all flex items-center justify-center gap-1.5"
              >
                {logLoading ? "Categorizing..." : "Log Item"}
              </button>
            </form>
          </div>

        </div>

        {/* RIGHT COLUMN: Log Table */}
        <div className="lg:col-span-2 space-y-4">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
            <h3 className="font-display text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              <Filter className="h-4.5 w-4.5 text-slate-400" />
              Transaction History
            </h3>
            
            <div className="flex gap-1.5 flex-wrap">
              <button
                onClick={() => setFilterCategory("All")}
                className={`rounded-lg px-2.5 py-1 text-[10px] font-bold transition-all ${
                  filterCategory === "All" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterCategory("Anomalies")}
                className={`rounded-lg px-2.5 py-1 text-[10px] font-bold transition-all ${
                  filterCategory === "Anomalies" ? "bg-orange-100 text-orange-800 border border-orange-200" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Anomalies ⚠️
              </button>
              {categoriesList.map((cat, idx) => (
                <button
                  key={idx}
                  onClick={() => setFilterCategory(cat)}
                  className={`rounded-lg px-2.5 py-1 text-[10px] font-bold transition-all ${
                    filterCategory === cat ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {cat.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="p-3.5 pl-5">Date</th>
                    <th className="p-3.5">Description</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5 text-right">Amount</th>
                    <th className="p-3.5 pr-5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-xs text-slate-400">
                        No transactions match the selected filter category.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors text-xs text-slate-700">
                        <td className="p-3.5 pl-5 font-semibold text-slate-500">{tx.date}</td>
                        <td className="p-3.5 font-bold text-slate-900 flex items-center gap-1.5">
                          {tx.description}
                          {tx.isAnomaly && (
                            <button
                              onClick={() => setSelectedAnomaly(tx)}
                              className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-orange-100 hover:bg-orange-200 text-orange-700 border border-orange-200 cursor-pointer"
                              title="Click for AI anomaly breakdown"
                            >
                              <AlertTriangle className="h-2.5 w-2.5" />
                            </button>
                          )}
                        </td>
                        <td className="p-3.5">
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                            {tx.category}
                          </span>
                        </td>
                        <td className="p-3.5 text-right font-display font-bold text-slate-900">
                          {formatAmt(tx.amount)}
                        </td>
                        <td className="p-3.5 pr-5 text-center">
                          <button
                            onClick={() => deleteTransaction(tx.id)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 animate-in fade-in scale-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <h4 className="font-display text-sm font-bold text-slate-950">Spending Anomaly Flag</h4>
              </div>
              <button
                onClick={() => setSelectedAnomaly(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-colors"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
            
            <div className="py-4 space-y-3">
              <div className="rounded-xl bg-orange-50 border border-orange-100 p-4">
                <p className="text-[10px] font-bold text-orange-800 uppercase tracking-wider">Transaction Info</p>
                <p className="text-xs text-slate-800 font-bold mt-1">
                  {selectedAnomaly.description} &bull; {formatAmt(selectedAnomaly.amount)}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">Category: {selectedAnomaly.category} ({selectedAnomaly.date})</p>
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Info className="h-3.5 w-3.5 text-brand-teal" />
                  Bob's AI Explanation
                </p>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {selectedAnomaly.anomalyExplanation || "This purchase exceeds typical daily expenditure models. We recommend cross-referencing your month-end budget limit envelopes."}
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedAnomaly(null)}
              className="w-full rounded-xl bg-slate-800 text-white hover:bg-slate-900 py-2.5 text-xs font-bold transition-all"
            >
              Close Advisory Notice
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
