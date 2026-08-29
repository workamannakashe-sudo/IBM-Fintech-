// BudgetMitra — Scholarship & Loan Scheme Matcher (Scholarships.tsx)
// Fetches real schemes from Supabase and uses IBM Bob to rank eligible ones.
import React, { useState, useEffect } from "react";
import { useFinancial } from "../context/FinancialContext";
import { matchSchemesBob, type SchemeRow, type MatchedScheme } from "../services/gemini";
import { supabase, isSupabaseConfigured } from "../utils/supabase/client";
import {
  GraduationCap, ExternalLink, Sparkles, BookOpen,
  Wallet, RefreshCw, ChevronDown, ChevronUp, IndianRupee
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Fallback data if Supabase not connected
const FALLBACK_SCHEMES: SchemeRow[] = [
  {
    id: "f1", name: "Prime Minister Scholarship Scheme (PMSS)", type: "scholarship",
    authority: "Government of India (DESW)",
    eligibility: { income_max: null, category: ["Gen","OBC","SC","ST","EWS"], state: "all", course_type: ["B.Tech","B.E","MCA","MBA","BCA"] },
    benefit: "₹2,500–₹3,000/month", apply_url: "https://scholarships.gov.in",
    description: "For wards/widows of ex-servicemen. Apply via the National Scholarship Portal."
  },
  {
    id: "f2", name: "Post Matric Scholarship for OBC Students", type: "scholarship",
    authority: "Ministry of Social Justice and Empowerment, GoI",
    eligibility: { income_max: 100000, category: ["OBC"], state: "all", course_type: ["B.Tech","B.Sc","B.Com","B.A","BBA","BCA","Diploma"] },
    benefit: "Full tuition fee + ₹230–₹570/month maintenance", apply_url: "https://scholarships.gov.in",
    description: "Central government post-matric scholarship for OBC students with family income below ₹1 lakh."
  },
  {
    id: "f3", name: "Central Sector Scheme of Scholarship (CSSS)", type: "scholarship",
    authority: "Department of Higher Education, GoI",
    eligibility: { income_max: 450000, category: ["Gen","OBC","SC","ST","EWS"], state: "all", course_type: ["B.Tech","B.Sc","B.Com","B.A","BBA","BCA"] },
    benefit: "₹10,000/year for first 3 years, ₹20,000/year for PG", apply_url: "https://scholarships.gov.in",
    description: "Merit-based scholarship for top class 12 scorers from low-income families."
  },
  {
    id: "f4", name: "Vidya Lakshmi Education Loan Scheme", type: "loan",
    authority: "Department of Financial Services, GoI",
    eligibility: { income_max: null, category: ["Gen","OBC","SC","ST","EWS"], state: "all", course_type: ["B.Tech","B.E","MBBS","MBA","B.Sc","B.Com","B.A"] },
    benefit: "Loans ₹50,000–₹10,00,000+ at 8.5%–11% from 40+ banks", apply_url: "https://www.vidyalakshmi.co.in",
    description: "Single portal to apply for education loans. No collateral for loans up to ₹7.5 lakhs."
  },
  {
    id: "f5", name: "AICTE Pragati Scholarship for Girls", type: "scholarship",
    authority: "AICTE",
    eligibility: { income_max: 800000, category: ["Gen","OBC","SC","ST","EWS"], state: "all", course_type: ["B.Tech","B.E","B.Arch","B.Pharm","MCA","MBA","Diploma"], gender: "female" },
    benefit: "₹50,000 per year for up to 4 years", apply_url: "https://www.aicte-pragati-saksham-gov.in",
    description: "Empowering girl students in AICTE-approved technical institutions."
  },
  {
    id: "f6", name: "Bihar Student Credit Card Scheme", type: "loan",
    authority: "Government of Bihar",
    eligibility: { income_max: null, category: ["Gen","OBC","SC","ST","EWS"], state: "Bihar", course_type: ["B.Tech","B.Sc","B.Com","B.A","MBBS","BCA","MBA","Polytechnic/Diploma"] },
    benefit: "Up to ₹4,00,000 at 4% interest (1% for girls/differently abled)", apply_url: "https://www.7nishchay-yuvaupmission.bihar.gov.in",
    description: "For Bihar domicile students for higher education expenses."
  },
  {
    id: "f7", name: "Tata Scholarship for Indian Undergraduates", type: "scholarship",
    authority: "Tata Education and Development Trust",
    eligibility: { income_max: 400000, category: ["Gen","OBC","SC","ST","EWS"], state: "all", course_type: ["B.Tech","B.E","B.Sc","MBBS"] },
    benefit: "Up to ₹2,50,000 per year", apply_url: "https://www.tatascholarships.com",
    description: "Need-based scholarships for premier institution students."
  },
  {
    id: "f8", name: "MYSY Scholarship (Gujarat)", type: "scholarship",
    authority: "Government of Gujarat",
    eligibility: { income_max: 600000, category: ["Gen","OBC","SC","ST","EWS"], state: "Gujarat", course_type: ["B.Tech","B.E","MBBS","B.D.S","B.Pharm","B.Sc","Diploma"] },
    benefit: "Up to ₹1,00,000/year for technical; ₹50,000 for general", apply_url: "https://mysy.guj.nic.in",
    description: "For meritorious Gujarat domicile students (80+ percentile in Class 12)."
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
  const [matchDone, setMatchDone] = useState(false);

  // Load schemes from Supabase or fallback
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

  // Auto-run Bob matching once schemes and profile loaded, or when preferredLanguage changes
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

  const displayedSchemes = (matchDone && matches.length > 0 ? matches : allSchemes.map(s => ({
    scheme_id: s.id, scheme_name: s.name, eligible: true,
    match_strength: "Likely" as const,
    eligibility_explanation: s.description,
    how_to_apply: `Visit ${s.apply_url}`,
    type: s.type, authority: s.authority, benefit: s.benefit, apply_url: s.apply_url, description: s.description
  }))).filter(m => filter === "all" || m.type === filter);

  const strengthColors: Record<string, string> = {
    Strong: "bg-emerald-100 text-emerald-700 border-emerald-200",
    Likely: "bg-blue-100 text-blue-700 border-blue-200",
    Possible: "bg-amber-100 text-amber-700 border-amber-200",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-display flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-orange-500" />
            Scholarship & Loan Schemes
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            IBM Bob has matched schemes based on your profile.
            {profile.category && ` Showing results for ${profile.category} category, ${profile.state || "India"}.`}
          </p>
        </div>
        <button onClick={runBobMatch} disabled={matchLoading || loading}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold px-4 py-2.5 text-xs shadow-md hover:from-orange-400 hover:to-amber-400 transition-all disabled:opacity-60">
          {matchLoading
            ? <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Bob is thinking...</>
            : <><Sparkles className="h-3.5 w-3.5" /> Re-run Bob Match</>
          }
        </button>
      </div>

      {/* Profile summary card */}
      <div className="rounded-2xl border border-orange-100 bg-orange-50/60 p-4 flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-slate-600">Course:</span>
          <span className="bg-white border border-orange-200 rounded-full px-2 py-0.5 font-semibold text-orange-700">{profile.course || profile.major || "B.Tech"}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-slate-600">State:</span>
          <span className="bg-white border border-orange-200 rounded-full px-2 py-0.5 font-semibold text-orange-700">{profile.state || "—"}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-slate-600">Category:</span>
          <span className="bg-white border border-orange-200 rounded-full px-2 py-0.5 font-semibold text-orange-700">{profile.category || "Gen"}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-slate-600">Family Income:</span>
          <span className="bg-white border border-orange-200 rounded-full px-2 py-0.5 font-semibold text-orange-700">{profile.income_bracket || "1-3L"}</span>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(["all", "scholarship", "loan"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold border capitalize transition-all ${
              filter === f ? "bg-orange-500 text-white border-orange-500" : "bg-white text-slate-600 border-slate-200 hover:border-orange-300"
            }`}>
            {f === "all" ? "All" : f === "scholarship" ? "📚 Scholarships" : "🏦 Loans"}
          </button>
        ))}
        <span className="ml-auto text-xs text-slate-400 self-center">{displayedSchemes.length} found</span>
      </div>

      {/* Loading state */}
      {(loading || matchLoading) && (
        <div className="flex items-center justify-center py-12 gap-3 text-slate-500">
          <Sparkles className="h-5 w-5 text-orange-400 animate-pulse" />
          <span className="text-sm font-medium">IBM Bob is analyzing your eligibility...</span>
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
                  className="rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : scheme.scheme_id)}
                    className="w-full text-left p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white ${
                          scheme.type === "scholarship" ? "bg-gradient-to-br from-emerald-500 to-teal-500" : "bg-gradient-to-br from-blue-500 to-indigo-500"
                        }`}>
                          {scheme.type === "scholarship" ? <BookOpen className="h-4 w-4" /> : <IndianRupee className="h-4 w-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-slate-900 text-sm leading-tight">{scheme.scheme_name}</h3>
                          <p className="text-[11px] text-slate-500 mt-0.5">{scheme.authority}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {matchDone && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${strengthColors[scheme.match_strength] || strengthColors.Likely}`}>
                            {scheme.match_strength}
                          </span>
                        )}
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                      </div>
                    </div>

                    {/* Benefit pill */}
                    <div className="mt-3 flex items-center gap-2">
                      <Wallet className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                      <span className="text-xs font-semibold text-orange-700 bg-orange-50 border border-orange-100 rounded-full px-2.5 py-0.5">
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
                        <div className="px-5 pb-5 space-y-4 border-t border-slate-100 pt-4">
                          {/* Bob's explanation */}
                          {matchDone && scheme.eligibility_explanation && (
                            <div className="rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 p-3">
                              <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                                <Sparkles className="h-3 w-3" /> IBM Bob says
                              </p>
                              <p className="text-xs text-slate-700 leading-relaxed">{scheme.eligibility_explanation}</p>
                            </div>
                          )}

                          {/* How to apply */}
                          {scheme.how_to_apply && (
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">How to Apply</p>
                              <p className="text-xs text-slate-600 leading-relaxed">{scheme.how_to_apply}</p>
                            </div>
                          )}

                          {/* Description */}
                          <p className="text-xs text-slate-500 leading-relaxed">{scheme.description}</p>

                          {/* CTA */}
                          <a href={scheme.apply_url} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold px-4 py-2.5 hover:from-orange-400 hover:to-amber-400 transition-all shadow-sm shadow-orange-200">
                            <ExternalLink className="h-3.5 w-3.5" /> Apply Now
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
            <div className="text-center py-12 text-slate-400">
              <GraduationCap className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No schemes matched your profile.</p>
              <p className="text-xs mt-1">Update your profile (category, state, course) and click Re-run Bob Match.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
