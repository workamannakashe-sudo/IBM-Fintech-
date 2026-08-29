// Scholarships.tsx - Enhanced Scholarship & Scheme Matcher with Dark/Light Support
import React, { useState, useEffect } from "react";
import { useFinancial } from "../context/FinancialContext";
import { matchSchemesBob, type SchemeRow, type MatchedScheme } from "../services/gemini";
import { supabase, isSupabaseConfigured } from "../utils/supabase/client";
import {
  GraduationCap,
  ExternalLink,
  Sparkles,
  BookOpen,
  Wallet,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  IndianRupee,
  Search
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const FALLBACK_SCHEMES: SchemeRow[] = [
  {
    id: "f1",
    name: "Prime Minister Scholarship Scheme (PMSS)",
    type: "scholarship",
    authority: "Government of India (DESW)",
    eligibility: {
      income_max: null,
      category: ["Gen", "OBC", "SC", "ST", "EWS"],
      state: "all",
      course_type: ["B.Tech", "B.E", "MCA", "MBA", "BCA"],
    },
    benefit: "₹2,500–₹3,000/month",
    apply_url: "https://scholarships.gov.in",
    description: "For wards/widows of ex-servicemen. Apply via the National Scholarship Portal.",
  },
  {
    id: "f2",
    name: "Post Matric Scholarship for OBC Students",
    type: "scholarship",
    authority: "Ministry of Social Justice and Empowerment, GoI",
    eligibility: {
      income_max: 100000,
      category: ["OBC"],
      state: "all",
      course_type: ["B.Tech", "B.Sc", "B.Com", "B.A", "BBA", "BCA", "Diploma"],
    },
    benefit: "Full tuition fee + ₹230–₹570/month maintenance",
    apply_url: "https://scholarships.gov.in",
    description: "Central government post-matric scholarship for OBC students with family income below ₹1 lakh.",
  },
  {
    id: "f3",
    name: "Central Sector Scheme of Scholarship (CSSS)",
    type: "scholarship",
    authority: "Department of Higher Education, GoI",
    eligibility: {
      income_max: 450000,
      category: ["Gen", "OBC", "SC", "ST", "EWS"],
      state: "all",
      course_type: ["B.Tech", "B.Sc", "B.Com", "B.A", "BBA", "BCA"],
    },
    benefit: "₹10,000/year for first 3 years, ₹20,000/year for PG",
    apply_url: "https://scholarships.gov.in",
    description: "Merit-based scholarship for top class 12 scorers from low-income families.",
  },
  {
    id: "f4",
    name: "Vidya Lakshmi Education Loan Scheme",
    type: "loan",
    authority: "Department of Financial Services, GoI",
    eligibility: {
      income_max: null,
      category: ["Gen", "OBC", "SC", "ST", "EWS"],
      state: "all",
      course_type: ["B.Tech", "B.E", "MBBS", "MBA", "B.Sc", "B.Com", "B.A"],
    },
    benefit: "Loans ₹50,000–₹10,00,000+ at 8.5%–11% from 40+ banks",
    apply_url: "https://www.vidyalakshmi.co.in",
    description: "Single portal to apply for education loans. No collateral for loans up to ₹7.5 lakhs.",
  },
  {
    id: "f5",
    name: "AICTE Pragati Scholarship for Girls",
    type: "scholarship",
    authority: "AICTE",
    eligibility: {
      income_max: 800000,
      category: ["Gen", "OBC", "SC", "ST", "EWS"],
      state: "all",
      course_type: ["B.Tech", "B.E", "B.Arch", "B.Pharm", "MCA", "MBA", "Diploma"],
      gender: "female",
    },
    benefit: "₹50,000 per year for up to 4 years",
    apply_url: "https://www.aicte-pragati-saksham-gov.in",
    description: "Empowering girl students in AICTE-approved technical institutions.",
  },
  {
    id: "f6",
    name: "Bihar Student Credit Card Scheme",
    type: "loan",
    authority: "Government of Bihar",
    eligibility: {
      income_max: null,
      category: ["Gen", "OBC", "SC", "ST", "EWS"],
      state: "Bihar",
      course_type: ["B.Tech", "B.Sc", "B.Com", "B.A", "MBBS", "BCA", "MBA", "Polytechnic/Diploma"],
    },
    benefit: "Up to ₹4,00,000 at 4% interest (1% for girls/differently abled)",
    apply_url: "https://www.7nishchay-yuvaupmission.bihar.gov.in",
    description: "For Bihar domicile students for higher education expenses.",
  },
  {
    id: "f7",
    name: "Tata Scholarship for Indian Undergraduates",
    type: "scholarship",
    authority: "Tata Education and Development Trust",
    eligibility: {
      income_max: 400000,
      category: ["Gen", "OBC", "SC", "ST", "EWS"],
      state: "all",
      course_type: ["B.Tech", "B.E", "B.Sc", "MBBS"],
    },
    benefit: "Up to ₹2,50,000 per year",
    apply_url: "https://www.tatascholarships.com",
    description: "Need-based scholarships for premier institution students.",
  },
  {
    id: "f8",
    name: "MYSY Scholarship (Gujarat)",
    type: "scholarship",
    authority: "Government of Gujarat",
    eligibility: {
      income_max: 600000,
      category: ["Gen", "OBC", "SC", "ST", "EWS"],
      state: "Gujarat",
      course_type: ["B.Tech", "B.E", "MBBS", "B.D.S", "B.Pharm", "B.Sc", "Diploma"],
    },
    benefit: "Up to ₹1,00,000/year for technical; ₹50,000 for general",
    apply_url: "https://mysy.guj.nic.in",
    description: "For meritorious Gujarat domicile students (80+ percentile in Class 12).",
  },
];

export const Scholarships: React.FC = () => {
  const { profile, preferredLanguage } = useFinancial();

  const [allSchemes, setAllSchemes] = useState<SchemeRow[]>([]);
  const [matches, setMatches] = useState<MatchedScheme[]>([]);
  const [loading, setLoading] = useState(false);
  const [matchLoading, setMatchLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "scholarship" | "loan">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [matchDone, setMatchDone] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      if (isSupabaseConfigured()) {
        try {
          const { data, error } = await supabase.from("schemes").select("*");
          if (!error && data && data.length > 0) {
            setAllSchemes(data as SchemeRow[]);
          } else {
            setAllSchemes(FALLBACK_SCHEMES);
          }
        } catch {
          setAllSchemes(FALLBACK_SCHEMES);
        }
      } else {
        setAllSchemes(FALLBACK_SCHEMES);
      }
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    if (allSchemes.length > 0 && profile.name) {
      runBobMatch();
    }
  }, [allSchemes, profile.name, preferredLanguage]);

  const runBobMatch = async () => {
    if (matchLoading) return;
    setMatchLoading(true);
    setMatchDone(false);
    try {
      const bobProfile = {
        full_name: profile.name || "Student",
        course: profile.course || profile.major || "B.Tech",
        year: profile.year || 1,
        state: profile.state || "Maharashtra",
        income_bracket: (profile.income_bracket || "1-3L") as "below_1L" | "1-3L" | "3-8L" | "above_8L",
        category: (profile.category || "Gen") as "Gen" | "OBC" | "SC" | "ST" | "EWS",
        monthly_allowance: profile.monthlyAllowance || 12000,
      };
      const result = await matchSchemesBob({ profile: bobProfile, schemes: allSchemes, preferredLanguage });
      setMatches(result);
    } catch (err) {
      console.warn("Bob matching failed:", err);
    }
    setMatchLoading(false);
    setMatchDone(true);
  };

  const displayedSchemes = (
    matchDone && matches.length > 0
      ? matches
      : allSchemes.map((s) => ({
          scheme_id: s.id,
          scheme_name: s.name,
          eligible: true,
          match_strength: "Likely" as const,
          eligibility_explanation: s.description,
          how_to_apply: `Visit ${s.apply_url}`,
          type: s.type,
          authority: s.authority,
          benefit: s.benefit,
          apply_url: s.apply_url,
          description: s.description,
        }))
  )
    .filter((m) => filter === "all" || m.type === filter)
    .filter(
      (m) =>
        m.scheme_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.authority?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const strengthColors: Record<string, string> = {
    Strong: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
    Likely: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
    Possible: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-display flex items-center gap-2">
            <GraduationCap className="h-7 w-7 text-blue-600 dark:text-cyan-400" />
            Financial Schemes & Scholarships
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Government initiatives and financial waivers matched to your academic profile.
          </p>
        </div>

        <button
          onClick={runBobMatch}
          disabled={matchLoading || loading}
          className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-gradient-to-r dark:from-[#ff2d78] dark:to-[#bd00ff] text-white font-bold px-4 py-2.5 text-xs shadow-md shadow-blue-500/20 dark:shadow-[0_0_15px_rgba(255,45,120,0.3)] transition-all disabled:opacity-60 cursor-pointer self-start sm:self-auto"
        >
          {matchLoading ? (
            <>
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              <span>Analyzing Eligibility...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" />
              <span>Re-run AI Match</span>
            </>
          )}
        </button>
      </div>

      {/* Profile summary card */}
      <div className="rounded-2xl border border-blue-100 dark:border-zinc-800 bg-blue-50/60 dark:bg-zinc-900/60 p-4 flex flex-wrap gap-3 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-slate-600 dark:text-zinc-400">Course:</span>
          <span className="bg-white dark:bg-zinc-800 border border-blue-200 dark:border-zinc-700 rounded-full px-2.5 py-0.5 font-bold text-blue-700 dark:text-cyan-400">
            {profile.course || profile.major || "B.Tech"}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-slate-600 dark:text-zinc-400">State:</span>
          <span className="bg-white dark:bg-zinc-800 border border-blue-200 dark:border-zinc-700 rounded-full px-2.5 py-0.5 font-bold text-blue-700 dark:text-cyan-400">
            {profile.state || "Maharashtra"}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-slate-600 dark:text-zinc-400">Category:</span>
          <span className="bg-white dark:bg-zinc-800 border border-blue-200 dark:border-zinc-700 rounded-full px-2.5 py-0.5 font-bold text-blue-700 dark:text-cyan-400">
            {profile.category || "General"}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-slate-600 dark:text-zinc-400">Family Income:</span>
          <span className="bg-white dark:bg-zinc-800 border border-blue-200 dark:border-zinc-700 rounded-full px-2.5 py-0.5 font-bold text-blue-700 dark:text-cyan-400">
            {profile.income_bracket || "1-3L"}
          </span>
        </div>
      </div>

      {/* Search & Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex gap-2">
          {(["all", "scholarship", "loan"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold border capitalize transition-all cursor-pointer ${
                filter === f
                  ? "bg-blue-600 dark:bg-cyan-500 text-white dark:text-slate-950 border-blue-600 dark:border-cyan-500 shadow-xs"
                  : "bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-800 hover:border-blue-300"
              }`}
            >
              {f === "all" ? "All Schemes" : f === "scholarship" ? "🎓 Scholarships" : "🏦 Loans & Credit"}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter schemes..."
            className="w-full h-9 pl-9 pr-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Loading state */}
      {(loading || matchLoading) && (
        <div className="flex items-center justify-center py-12 gap-3 text-slate-500 dark:text-zinc-400">
          <Sparkles className="h-5 w-5 text-blue-600 dark:text-cyan-400 animate-pulse" />
          <span className="text-sm font-medium">Analyzing your eligibility with IBM Bob...</span>
        </div>
      )}

      {/* Scheme cards */}
      {!loading && (
        <div className="space-y-3">
          <AnimatePresence>
            {displayedSchemes.map((scheme) => {
              const isExpanded = expandedId === scheme.scheme_id;
              return (
                <motion.div
                  key={scheme.scheme_id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#121217] ambient-shadow-card hover:border-slate-300 dark:hover:border-zinc-700 transition-all overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : scheme.scheme_id)}
                    className="w-full text-left p-5 cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white ${
                            scheme.type === "scholarship"
                              ? "bg-blue-600 dark:bg-cyan-500 dark:text-slate-950"
                              : "bg-indigo-600 dark:bg-[#ff2d78]"
                          }`}
                        >
                          {scheme.type === "scholarship" ? (
                            <BookOpen className="h-5 w-5" />
                          ) : (
                            <IndianRupee className="h-5 w-5" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-tight font-display">
                            {scheme.scheme_name}
                          </h3>
                          <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">{scheme.authority}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {matchDone && (
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                              strengthColors[scheme.match_strength] || strengthColors.Likely
                            }`}
                          >
                            {scheme.match_strength} Match
                          </span>
                        )}
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {/* Benefit pill */}
                    <div className="mt-3 flex items-center gap-2">
                      <Wallet className="h-3.5 w-3.5 text-blue-600 dark:text-cyan-400 shrink-0" />
                      <span className="text-xs font-bold text-blue-700 dark:text-cyan-300 bg-blue-50 dark:bg-cyan-950/60 border border-blue-100 dark:border-cyan-800 rounded-full px-3 py-0.5">
                        {scheme.benefit}
                      </span>
                    </div>
                  </button>

                  {/* Expanded detail */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 space-y-4 border-t border-slate-100 dark:border-zinc-800 pt-4">
                          {matchDone && scheme.eligibility_explanation && (
                            <div className="rounded-xl bg-blue-50/70 dark:bg-zinc-900 border border-blue-100 dark:border-zinc-800 p-3.5">
                              <p className="text-[10px] font-bold text-blue-900 dark:text-cyan-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                                <Sparkles className="h-3.5 w-3.5" /> AI Recommendation
                              </p>
                              <p className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed font-medium">
                                {scheme.eligibility_explanation}
                              </p>
                            </div>
                          )}

                          {scheme.how_to_apply && (
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                                How to Apply
                              </p>
                              <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
                                {scheme.how_to_apply}
                              </p>
                            </div>
                          )}

                          <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                            {scheme.description}
                          </p>

                          <a
                            href={scheme.apply_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-gradient-to-r dark:from-[#ff2d78] dark:to-[#bd00ff] text-white text-xs font-bold px-4 py-2.5 transition-all shadow-xs"
                          >
                            <ExternalLink className="h-3.5 w-3.5" /> Apply on Official Portal
                          </a>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {displayedSchemes.length === 0 && !matchLoading && (
            <div className="text-center py-12 text-slate-400 dark:text-zinc-500">
              <GraduationCap className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No schemes found matching your search.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
