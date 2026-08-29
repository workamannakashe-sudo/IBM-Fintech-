// QuickLogFab.tsx - Floating Rapid Add Expense Button
import React from "react";
import { Plus } from "lucide-react";

interface QuickLogFabProps {
  onClick: () => void;
}

export const QuickLogFab: React.FC<QuickLogFabProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-24 z-40 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 dark:bg-cyan-500 hover:bg-blue-700 dark:hover:bg-cyan-400 text-white dark:text-slate-950 shadow-xl shadow-blue-500/25 dark:shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:scale-105 transition-all duration-200 group cursor-pointer"
      title="Quick log transaction"
    >
      <Plus className="h-6 w-6 group-hover:rotate-90 transition-transform duration-300 stroke-[2.5]" />
    </button>
  );
};
