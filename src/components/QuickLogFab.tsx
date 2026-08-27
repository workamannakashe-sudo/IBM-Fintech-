// FinWise Floating Quick-Log Expense Button (QuickLogFab.tsx)
import React from "react";
import { Plus } from "lucide-react";

interface QuickLogFabProps {
  onClick: () => void;
}

export const QuickLogFab: React.FC<QuickLogFabProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-24 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20 hover:scale-105 transition-all duration-200 group border border-white/20"
      title="Quick log transaction"
    >
      <Plus className="h-6 w-6 group-hover:rotate-90 transition-transform duration-300" />
    </button>
  );
};
