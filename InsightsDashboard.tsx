import React, { useEffect, useMemo, useState } from "react";
import {
  X,
  RefreshCcw,
  AlertTriangle,
  Info,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  Target,
  Calendar,
  Activity,
  ShoppingCart,
  Bell,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { Transaction, Invoice, TaxPayment, UserSettings } from "./types";
import {
  generateInsights,
  getDismissedInsightIds,
  dismissInsightId,
  clearDismissedInsights,
  type Insight,
  type InsightCategory,
} from "./services/insightsEngine";

type Props = {
  transactions: Transaction[];
  invoices: Invoice[];
  taxPayments: TaxPayment[];
  settings: UserSettings;
  onClose: () => void;
};

// Category icons mapping
function getCategoryIcon(category: InsightCategory) {
  switch (category) {
    case "cashflow":
      return <Activity className="w-5 h-5" />;
    case "spending":
      return <ShoppingCart className="w-5 h-5" />;
    case "income":
      return <TrendingUp className="w-5 h-5" />;
    case "budget":
      return <Target className="w-5 h-5" />;
    case "patterns":
      return <Calendar className="w-5 h-5" />;
    case "subscriptions":
      return <Bell className="w-5 h-5" />;
    case "forecast":
      return <Sparkles className="w-5 h-5" />;
    case "savings":
      return <DollarSign className="w-5 h-5" />;
    default:
      return <Info className="w-5 h-5" />;
  }
}

function SeverityIcon({ severity }: { severity: Insight["severity"] }) {
  if (severity === "high") return <AlertTriangle className="w-5 h-5" />;
  if (severity === "medium") return <Info className="w-5 h-5" />;
  return <CheckCircle2 className="w-5 h-5" />;
}

function severityColors(severity: Insight["severity"]) {
  switch (severity) {
    case "high":
      return {
        bg: "bg-red-50 dark:bg-red-950/20",
        border: "border-red-200 dark:border-red-900/30",
        icon: "text-red-600 dark:text-red-400",
        iconBg: "bg-red-100 dark:bg-red-900/30",
        badge: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300",
      };
    case "medium":
      return {
        bg: "bg-amber-50 dark:bg-amber-950/20",
        border: "border-amber-200 dark:border-amber-900/30",
        icon: "text-amber-600 dark:text-amber-400",
        iconBg: "bg-amber-100 dark:bg-amber-900/30",
        badge: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300",
      };
    default:
      return {
        bg: "bg-emerald-50 dark:bg-emerald-950/20",
        border: "border-emerald-200 dark:border-emerald-900/30",
        icon: "text-emerald-600 dark:text-emerald-400",
        iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
        badge: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300",
      };
  }
}

function priorityLabel(priority: number): string {
  if (priority >= 9) return "Critical";
  if (priority >= 7) return "High";
  if (priority >= 5) return "Medium";
  return "Low";
}

export default function InsightsDashboard({
  transactions,
  invoices,
  taxPayments,
  settings,
  onClose,
}: Props) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<InsightCategory | "all">("all");
  const [selectedSeverity, setSelectedSeverity] = useState<Insight["severity"] | "all">("all");
  const [expandedInsights, setExpandedInsights] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    setDismissed(new Set(getDismissedInsightIds()));
  }, []);

  const allInsights: Insight[] = useMemo(() => {
    return generateInsights({ transactions, invoices, taxPayments, settings });
  }, [transactions, invoices, taxPayments, settings]);

  const filteredInsights = useMemo(() => {
    let filtered = allInsights.filter((i) => !dismissed.has(i.id));

    if (selectedCategory !== "all") {
      filtered = filtered.filter((i) => i.category === selectedCategory);
    }

    if (selectedSeverity !== "all") {
      filtered = filtered.filter((i) => i.severity === selectedSeverity);
    }

    filtered.sort((a, b) => b.priority - a.priority);

    return filtered;
  }, [allInsights, dismissed, selectedCategory, selectedSeverity]);

  const availableCategories = useMemo(() => {
    const cats = new Set(allInsights.map((i) => i.category));
    return Array.from(cats).sort();
  }, [allInsights]);

  const stats = useMemo(() => {
    const active = allInsights.filter((i) => !dismissed.has(i.id));
    return {
      total: allInsights.length,
      active: active.length,
      dismissed: allInsights.length - active.length,
      high: active.filter((i) => i.severity === "high").length,
      medium: active.filter((i) => i.severity === "medium").length,
      low: active.filter((i) => i.severity === "low").length,
      actionable: active.filter((i) => i.actionable).length,
    };
  }, [allInsights, dismissed]);

  const dismiss = (id: string) => {
    dismissInsightId(id);
    setDismissed(new Set(getDismissedInsightIds()));
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  };

  const resetDismissed = () => {
    clearDismissedInsights();
    setDismissed(new Set());
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedInsights);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedInsights(newExpanded);
  };

  return (
    <div className="h-[90vh] max-h-[90vh] flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Modern Header with Glassmorphism */}
      <div className="relative px-6 sm:px-8 py-6 sm:py-8 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50">
        {/* Action Buttons - Top Right */}
        <div className="absolute top-6 right-6 sm:top-8 sm:right-8 flex items-center gap-3 z-10">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="group relative p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 disabled:opacity-50"
            title="Refresh insights"
          >
            <RefreshCcw className={`w-5 h-5 text-slate-600 dark:text-slate-300 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors ${isRefreshing ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={onClose}
            className="group relative p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-red-300 dark:hover:border-red-600 hover:shadow-lg hover:shadow-red-500/10 transition-all duration-300"
            title="Close"
          >
            <X className="w-5 h-5 text-slate-600 dark:text-slate-300 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors" />
          </button>
        </div>

        {/* Title Section */}
        <div className="pr-32">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 shadow-lg shadow-purple-500/30">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                Smart Insights
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                AI-powered financial intelligence
              </p>
            </div>
          </div>

          {/* Stats Pills */}
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <div className="px-4 py-2 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-sm shadow-lg">
              {stats.active} Active
            </div>
            {stats.high > 0 && (
              <div className="px-4 py-2 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 font-medium text-sm">
                {stats.high} High Priority
              </div>
            )}
            {stats.actionable > 0 && (
              <div className="px-4 py-2 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium text-sm">
                {stats.actionable} Need Action
              </div>
            )}
            <button
              onClick={resetDismissed}
              className="px-4 py-2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 font-medium text-sm transition-colors"
            >
              Reset Dismissed
            </button>
          </div>
        </div>
      </div>

      {/* Filters Section - Clean & Spacious */}
      <div className="px-6 sm:px-8 py-5 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Filter by:</span>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as any)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium text-sm hover:border-purple-300 dark:hover:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all cursor-pointer"
          >
            <option value="all">All Categories</option>
            {availableCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>

          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value as any)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium text-sm hover:border-purple-300 dark:hover:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all cursor-pointer"
          >
            <option value="all">All Severities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>

          {(selectedCategory !== "all" || selectedSeverity !== "all") && (
            <button
              onClick={() => {
                setSelectedCategory("all");
                setSelectedSeverity("all");
              }}
              className="px-4 py-2.5 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50 font-medium text-sm transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Insights Cards - Modern Spacious Design */}
      <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 sm:py-8">
        {filteredInsights.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center mb-6 shadow-xl shadow-purple-500/20">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 text-center">
              All Clear!
            </h3>
            <p className="text-base text-slate-600 dark:text-slate-400 text-center max-w-md leading-relaxed">
              {stats.active === 0
                ? "No active insights. Add more transactions or reset dismissed insights to see recommendations."
                : "Try adjusting your filters to see more insights."}
            </p>
          </div>
        ) : (
          <div className="space-y-5 max-w-4xl mx-auto">
            {filteredInsights.map((insight) => {
              const isExpanded = expandedInsights.has(insight.id);
              const colors = severityColors(insight.severity);
              
              return (
                <div
                  key={insight.id}
                  className={`group relative ${colors.bg} ${colors.border} border-2 rounded-2xl p-6 sm:p-8 transition-all duration-300 hover:shadow-xl hover:shadow-slate-900/5 dark:hover:shadow-slate-950/20`}
                >
                  {/* Card Header */}
                  <div className="flex items-start gap-5 mb-5">
                    {/* Icon */}
                    <div className={`flex-shrink-0 p-3.5 rounded-xl ${colors.iconBg} ${colors.icon} shadow-sm`}>
                      <SeverityIcon severity={insight.severity} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Title & Badges */}
                      <div className="flex flex-wrap items-start gap-3 mb-3">
                        <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-tight flex-1 min-w-0">
                          {insight.title}
                        </h3>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${colors.badge} text-xs font-bold uppercase tracking-wide`}>
                            {getCategoryIcon(insight.category)}
                            <span className="hidden sm:inline">{insight.category}</span>
                          </span>
                          <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-white/80 dark:bg-slate-800/80 text-slate-900 dark:text-white text-xs font-bold uppercase tracking-wide">
                            {priorityLabel(insight.priority)}
                          </span>
                        </div>
                      </div>

                      {/* Message */}
                      <p className="text-base text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
                        {insight.message}
                      </p>

                      {/* Action Required Badge */}
                      {insight.actionable && (
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-blue-600 text-white text-sm font-bold shadow-lg shadow-purple-500/20 mb-4">
                          <Target className="w-4 h-4" />
                          Action Required
                        </div>
                      )}

                      {/* Expandable Details */}
                      {insight.detail && (
                        <div className="mt-4">
                          {isExpanded && (
                            <div className="mb-4 p-5 rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50">
                              <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed">
                                {insight.detail}
                              </p>
                            </div>
                          )}
                          <button
                            onClick={() => toggleExpanded(insight.id)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-600 text-slate-700 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 font-semibold text-sm transition-all"
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="w-4 h-4" />
                                Show Less
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-4 h-4" />
                                View Recommendation
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Dismiss Button */}
                    <button
                      onClick={() => dismiss(insight.id)}
                      className="flex-shrink-0 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm transition-all self-start"
                      title="Dismiss this insight"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
