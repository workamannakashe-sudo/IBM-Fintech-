// FinWise Scholarship & Grant Matcher (Scholarships.tsx)
import React, { useState, useMemo } from "react";
import { useFinancial } from "../context/FinancialContext";
import { useGamification } from "../context/GamificationContext";
import { 
  GraduationCap, CalendarClock, Bookmark, 
  BookmarkCheck, Sparkles, Check, PiggyBank 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface MatchOpportunity {
  id: string;
  title: string;
  sponsor: string;
  amount: number;
  deadlineDate: string;
  daysRemaining: number;
  matchProbability: "Very High" | "High" | "Medium";
  criteriaSummary: string;
  essayTips: string;
  keywords: string[];
}

export const Scholarships: React.FC = () => {
  const { profile, currency, userType } = useFinancial();
  const { gainXp } = useGamification();

  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Dynamic currency formatting helper
  const formatAmt = (val: number) => {
    if (currency === "INR") {
      return `₹${Math.round(val).toLocaleString("en-IN")}`;
    }
    return `$${val.toFixed(2)}`;
  };

  // Match opportunities based on currency and userType
  const opportunities = useMemo<MatchOpportunity[]>(() => {
    // Mode 1: Student Opportunities
    if (userType === "Student") {
      if (currency === "INR") {
        return [
          {
            id: "s1",
            title: "Prime Minister Scholarship Scheme (PMSS)",
            sponsor: "Government of India",
            amount: 36000,
            deadlineDate: "2026-09-30",
            daysRemaining: 34,
            matchProbability: profile.gpa >= 7.5 ? "Very High" : "High",
            criteriaSummary: "Open to professional degree courses (B.Tech/BE/MCA) for student wards.",
            essayTips: "Emphasize your technical contributions in college and outline how this grant helps you focus entirely on campus research instead of part-time jobs.",
            keywords: ["PMSS", "technical education", "merit scholarship", "B.Tech", "academic record"],
          },
          {
            id: "s2",
            title: "Tata Scholarship Scheme (Cornell & Premier Colleges)",
            sponsor: "Tata Education and Development Trust",
            amount: 250000,
            deadlineDate: "2026-09-15",
            daysRemaining: 19,
            matchProbability: profile.firstGen ? "Very High" : "Medium",
            criteriaSummary: "Need-based scholarships for Indian undergraduates enrolled in premier local/global institutions.",
            essayTips: "Discuss your first-generation family struggle, your college admission journey, and how you plan to return to India to engineer rural tech solutions.",
            keywords: ["Tata trust", "need-based", "premier colleges", "community impact", "rural tech"],
          },
          {
            id: "s3",
            title: "Aditya Birla Scholars Program",
            sponsor: "Aditya Birla Group",
            amount: 150000,
            deadlineDate: "2026-10-15",
            daysRemaining: 49,
            matchProbability: profile.gpa >= 8.5 ? "Very High" : "High",
            criteriaSummary: "Awarded to top performers at IITs, BITS, and premier law/management institutes.",
            essayTips: "Highlight your leadership roles in student chapters, hackathon achievements, and academic excellence scores.",
            keywords: ["Aditya Birla", "IIT BITS", "leadership index", "academic topper", "excellence"],
          },
          {
            id: "s4",
            title: "Post-Matric Financial Aid Scheme",
            sponsor: "State Welfare Department",
            amount: 18000,
            deadlineDate: "2026-10-30",
            daysRemaining: 64,
            matchProbability: profile.incomeTier.includes("Tier-2") || profile.incomeTier.includes("Low-Income") ? "High" : "Medium",
            criteriaSummary: "Open to students with family household incomes below ₹2.5 Lakhs per year.",
            essayTips: "Focus on explaining how college hostel mess fees impact family budgets. Detail your plans to save and invest in local peer learning societies.",
            keywords: ["welfare aid", "household income", "fee reimbursement", "disadvantage bracket", "social focus"],
          },
        ];
      } else {
        // Student USD Opportunities
        return [
          {
            id: "s1",
            title: "FinTech & Generative AI Innovation Grant",
            sponsor: "IBM & FinTech Coalition",
            amount: 2500,
            deadlineDate: "2026-09-15",
            daysRemaining: 19,
            matchProbability: profile.gpa >= 3.5 ? "Very High" : "High",
            criteriaSummary: "Open to CS/FinTech majors with GPA 3.5+ focusing on AI applications.",
            essayTips: "Detail how prompt engineering and Gemini models can democratize personal wealth advisory for low-income student segments. Highlight local prototype architectures.",
            keywords: ["generative AI", "democratization", "personal finance", "fintech integration", "scalability"],
          },
          {
            id: "s2",
            title: "First-Generation Pathfinders Scholarship",
            sponsor: "National Education Endowment",
            amount: 5000,
            deadlineDate: "2026-09-28",
            daysRemaining: 32,
            matchProbability: profile.firstGen ? "Very High" : "Medium",
            criteriaSummary: "Exclusively for students who are the first in their family to attend college.",
            essayTips: "Discuss your family's educational background, the emotional/financial barriers you overcame, and your plans to establish career mentorship programs on campus.",
            keywords: ["mentorship", "first-generation", "community impact", "economic resilience", "leadership"],
          },
          {
            id: "s3",
            title: "Academic STEM Excellence Grant",
            sponsor: "Tech Pioneers Council",
            amount: 3000,
            deadlineDate: "2026-10-05",
            daysRemaining: 39,
            matchProbability: profile.gpa >= 3.7 ? "Very High" : "High",
            criteriaSummary: "STEM students with outstanding GPAs and extracurricular coding/lab research.",
            essayTips: "Highlight software engineering projects, algorithm optimization cases, or research studies. Connect technical expertise to societal resource allocation questions.",
            keywords: ["STEM", "software design", "academic research", "data structures", "innovative solutions"],
          },
        ];
      }
    } else {
      // Mode 2: Young Professional Savings Tips & Advice
      if (currency === "INR") {
        return [
          {
            id: "i1",
            title: "Automatic Split Savings (50/30/20 Rule)",
            sponsor: "Financial Best Practices",
            amount: 60000, // Est. savings ₹60k/yr
            deadlineDate: "2026-12-31",
            daysRemaining: 126,
            matchProbability: "Very High",
            criteriaSummary: "Automate salary transfers to divert 20% directly to savings on payday.",
            essayTips: "By paying yourself first, you remove the willpower barrier. Establish a target of having 3 to 6 months of fixed expenses in a liquid emergency fund.",
            keywords: ["50/30/20 Rule", "Emergency Fund", "Autopay", "Liquidity"],
          },
          {
            id: "i2",
            title: "Mutual Fund Systematic Investment Plan (SIP)",
            sponsor: "Long-Term Wealth Strategy",
            amount: 120000, // Est. wealth boost
            deadlineDate: "2026-12-31",
            daysRemaining: 126,
            matchProbability: "Very High",
            criteriaSummary: "Regular automated investing in low-cost index funds to leverage compounding.",
            essayTips: "Starting an investment of even ₹2,000/month in your early 20s will accumulate significantly more than waiting to invest ₹10,000/month in your 30s due to the power of compounding.",
            keywords: ["Index Funds", "Compounding", "SIP", "Rupee Cost Averaging"],
          },
          {
            id: "i3",
            title: "Subscription Auditing & Trimming",
            sponsor: "Daily Cash Flow Optimization",
            amount: 24000, // Savings potential
            deadlineDate: "2026-09-30",
            daysRemaining: 34,
            matchProbability: "High",
            criteriaSummary: "Perform a quarterly audit of recurring subscriptions and negotiate rates or cancel unused services.",
            essayTips: "A single unused ₹500/month subscription sums up to ₹6,000/yr. Consolidate plans, review family sharing options, and clean up active trials.",
            keywords: ["Subscription Leak", "Expense Review", "Cash Flow Boost", "Negotiate Rates"],
          },
        ];
      } else {
        // Young Professional USD Savings Tips
        return [
          {
            id: "i1",
            title: "High-Yield Savings Account (HYSA) Setup",
            sponsor: "FDIC Insured Banking Partners",
            amount: 250, // Est. extra yield/yr
            deadlineDate: "2026-12-31",
            daysRemaining: 126,
            matchProbability: "Very High",
            criteriaSummary: "Move emergency funds from standard big banks to online HYSAs yielding 4-5% interest.",
            essayTips: "On a $5,000 emergency fund, moving to an online HYSA earns an extra $200-$250 per year risk-free. Ensure the account is FDIC insured with no hidden monthly fees.",
            keywords: ["HYSA", "Emergency Cash", "FDIC Insured", "Passive Yield"],
          },
          {
            id: "i2",
            title: "Automated Broad-Market ETF Investing",
            sponsor: "Dollar-Cost Averaging Advisors",
            amount: 1800, // Invested capital/yr
            deadlineDate: "2026-12-31",
            daysRemaining: 126,
            matchProbability: "Very High",
            criteriaSummary: "Set up automated weekly fractional investing ($10-$25) into low-fee diversified ETFs.",
            essayTips: "Time in the market beats timing the market. Automating small amounts removes emotional trading decisions and locks in long-term equity growth.",
            keywords: ["Broad Market ETFs", "Micro-Investing", "Automated Investing", "Long-term Wealth"],
          },
          {
            id: "i3",
            title: "Fixed Cost Audit & Subscription Trim",
            sponsor: "Monthly Budget Cleanse",
            amount: 360, // Annual savings
            deadlineDate: "2026-09-30",
            daysRemaining: 34,
            matchProbability: "High",
            criteriaSummary: "Review all active software, streaming, and membership accounts to cut underutilized subscriptions.",
            essayTips: "A single unused $15/month streaming subscription is $180/year. Set calendar reminders for free trials and negotiate gym/internet bills annually.",
            keywords: ["Subscription Leak", "Cash Flow Boost", "Fixed Cost Review", "Trial Tracking"],
          },
        ];
      }
    }
  }, [currency, userType, profile]);

  const toggleSave = (id: string) => {
    const isSaved = savedIds.includes(id);
    if (isSaved) {
      setSavedIds(prev => prev.filter(x => x !== id));
    } else {
      setSavedIds(prev => [...prev, id]);
      gainXp(40, "Bookmarked match target");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      {/* Title */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-display">
            {userType === "Student" ? "Scholarship & Grant Matcher" : "Savings Advisor & Tips"}
          </h1>
          <p className="text-sm text-slate-500">
            {userType === "Student" 
              ? "Profile-driven matching engine comparing your GPA, major, and interests against available grants."
              : "Explore actionable savings tips, micro-investment options, and wealth-building recommendations tailored for your career stage."}
          </p>
        </div>

        {/* Profile Stats Chip */}
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs leading-normal shrink-0">
          <p className="font-bold text-slate-800">{userType === "Student" ? "Matching Mode:" : "Advisor Mode:"}</p>
          <p className="text-slate-500 mt-0.5">{userType} &bull; {currency}</p>
        </div>
      </div>

      {/* Main List */}
      <div className="space-y-4">
        {opportunities.map((sch) => {
          const isSaved = savedIds.includes(sch.id);
          const isExpanded = expandedId === sch.id;
          
          return (
            <div 
              key={sch.id}
              className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:border-slate-300"
            >
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                {/* Title & sponsor */}
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-brand-teal border border-teal-100">
                    {userType === "Student" ? (
                      <GraduationCap className="h-5.5 w-5.5" />
                    ) : (
                      <PiggyBank className="h-5.5 w-5.5" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-display text-sm font-bold text-slate-900 leading-tight">
                      {sch.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">{sch.sponsor}</p>
                    
                    {/* Tags row */}
                    <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-700">
                        {userType === "Student" ? `${formatAmt(sch.amount)} Grant` : `Est. Impact: ${formatAmt(sch.amount)}/yr`}
                      </span>
                      
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold border ${
                        sch.matchProbability === "Very High"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-100"
                          : sch.matchProbability === "High"
                          ? "bg-teal-50 text-teal-800 border-teal-100"
                          : "bg-slate-50 text-slate-600 border-slate-200"
                      }`}>
                        {userType === "Student" ? "Match: " : "Impact Level: "}{sch.matchProbability}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Deadlines and Actions */}
                <div className="flex flex-col sm:flex-row md:flex-col items-start sm:items-center md:items-end justify-between gap-3 shrink-0">
                  
                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <CalendarClock className="h-4.5 w-4.5 text-orange-500" />
                    <span>
                      {sch.daysRemaining} days left ({sch.deadlineDate})
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : sch.id)}
                      className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 transition-colors cursor-pointer select-none"
                    >
                      {isExpanded ? "Hide Details" : (userType === "Student" ? "Get Essay Tips" : "Get Action Plan")}
                    </button>
                    <button
                      onClick={() => toggleSave(sch.id)}
                      className={`rounded-xl border p-2 transition-all cursor-pointer ${
                        isSaved 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                          : "border-slate-200 hover:bg-slate-50 text-slate-400"
                      }`}
                      title={isSaved ? "Saved Match" : "Save Match"}
                    >
                      {isSaved ? <BookmarkCheck className="h-4.5 w-4.5" /> : <Bookmark className="h-4.5 w-4.5" />}
                    </button>
                  </div>

                </div>

              </div>

              {/* Details helper box */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4">
                      
                      {/* Strategic Tips */}
                      <div className="md:col-span-2 space-y-1.5">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1">
                          <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                          {userType === "Student" ? "Strategic Essay Prompt Tips" : "Step-by-Step Implementation Advice"}
                        </h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {sch.essayTips}
                        </p>
                      </div>

                      {/* Keywords list */}
                      <div className="space-y-1.5">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                          Key Terms
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {sch.keywords.map((k, idx) => (
                            <span 
                              key={idx} 
                              className="inline-flex items-center gap-0.5 rounded-lg bg-teal-50 border border-teal-100 px-2 py-1 text-[10px] text-teal-800 font-semibold"
                            >
                              <Check className="h-2.5 w-2.5 text-teal-600" />
                              {k}
                            </span>
                          ))}
                        </div>
                      </div>

                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          );
        })}
      </div>

    </div>
  );
};
