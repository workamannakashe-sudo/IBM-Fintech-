// FinWise Badge Celebration Confetti Modal (BadgeCelebrationModal.tsx)
import React, { useEffect } from "react";
import { useGamification } from "../context/GamificationContext";
import { Trophy, Flame, Coins, Calendar, Zap, Crown, Award } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";

export const BadgeCelebrationModal: React.FC = () => {
  const { unlockedBadge, clearUnlockedBadge } = useGamification();

  useEffect(() => {
    if (unlockedBadge) {
      // Fire double confetti bursts for extra satisfaction!
      const duration = 2 * 1000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ["#4F46E5", "#EC4899", "#10B981"]
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ["#4F46E5", "#EC4899", "#10B981"]
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      
      frame();
    }
  }, [unlockedBadge]);

  if (!unlockedBadge) return null;

  // Icon mapping
  const getBadgeIcon = (iconName: string) => {
    switch (iconName) {
      case "Coins": return <Coins className="h-10 w-10 text-amber-500" />;
      case "Flame": return <Flame className="h-10 w-10 text-orange-500" />;
      case "Calendar": return <Calendar className="h-10 w-10 text-blue-500" />;
      case "Trophy": return <Trophy className="h-10 w-10 text-emerald-500" />;
      case "Zap": return <Zap className="h-10 w-10 text-purple-500" />;
      case "Crown": return <Crown className="h-10 w-10 text-yellow-500" />;
      default: return <Award className="h-10 w-10 text-slate-500" />;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="relative w-full max-w-sm rounded-3xl border border-amber-200 bg-white p-8 text-center shadow-2xl"
        >
          {/* Sparkles / Aura behind badge */}
          <div className="absolute inset-x-0 -top-12 flex justify-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-amber-50 shadow-lg border-4 border-white">
              {getBadgeIcon(unlockedBadge.iconName)}
            </div>
          </div>

          <div className="mt-12 space-y-3">
            <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-200 px-3 py-0.5 text-xs font-bold text-amber-700">
              🏆 Achievement Unlocked
            </span>
            
            <h3 className="font-display text-xl font-bold text-slate-900">
              {unlockedBadge.name}
            </h3>
            
            <p className="text-xs text-slate-500 max-w-[85%] mx-auto leading-normal">
              {unlockedBadge.description}
            </p>

            <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3 mt-4 text-[10px] text-slate-400 font-medium">
              You earned <span className="text-emerald-600 font-bold">+150 XP</span> towards your financial progression. Keep it up!
            </div>

            <button
              onClick={clearUnlockedBadge}
              className="mt-6 w-full rounded-xl bg-brand-teal text-white hover:bg-brand-teal-light py-2.5 text-xs font-bold shadow-md shadow-teal-700/10 transition-colors"
            >
              Awesome!
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
