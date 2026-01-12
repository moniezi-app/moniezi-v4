import React, { useEffect, useMemo, useState } from "react";
import {
  X,
  RefreshCcw,
  AlertTriangle,
  Info,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Calendar,
  PieChart,
  Activity,
  ShoppingCart,
  Bell,
  Sparkles,
  Filter,
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
      return <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4" />;
    case "spending":
      return <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />;
    case "income":
      return <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />;
    case "budget":
      return <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4" />;
    case "patterns":
      return <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />;
    case "subscriptions":
      return <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />;
    case "forecast":
      return <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />;
    case "savings":
      return <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" />;
    case "distribution":
      return <PieChart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />;
    default:
      return <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4" />;
  }
}

function SeverityIcon({ severity }: { severity: Insight["severity"] }) {
  if (severity === "high") return <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />;
  if (severity === "medium") return <Info className="w-4 h-4 sm:w-5 sm:h-5" />;
  return <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />;
}

function severityClasses(severity: Insight["severity"]) {
  switch (severity) {
    case "high":
      return "border-red-200 dark:border-red-900/40 bg-red-50/70 dark:bg-red-900/15 text-red-800 dark:text-red-200";
    case "medium":
      return "border-amber-200 dark:border-amber-900/40 bg-amber-50/70 dark:bg-amber-900/15 text-amber-800 dark:text-amber-200";
    default:
      return "border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/70 dark:bg-emerald-900/15 text-emerald-800 dark:text-emerald-200";
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
  const [sortBy, setSortBy] = useState<"priority" | "severity">("priority");
  const [expandedInsights, setExpandedInsights] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

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

    if (sortBy === "priority") {
      filtered.sort((a, b) => b.priority - a.priority);
    } else {
      const severityOrder = { high: 3, medium: 2, low: 1 };
      filtered.sort((a, b) => severityOrder[b.severity] - severityOrder[a.severity]);
    }

    return filtered;
  }, [allInsights, dismissed, selectedCategory, selectedSeverity, sortBy]);

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
    <div className="h-[90vh] max-h-[90vh] flex flex-col bg-white dark:bg-slate-900">
      {/* Header - Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-3 sm:px-5 py-3 sm:py-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-baseline gap-2 sm:gap-3">
          <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100">
            Smart Insights
          </h2>
          <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {stats.active} active
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-all"
            title="Refresh insights"
          >
            <RefreshCcw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={resetDismissed}
            className="hidden sm:inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            title="Reset dismissed insights"
          >
            Reset
          </button>

          <button
            onClick={onClose}
            className="inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            title="Close"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Stats Bar - Responsive with horizontal scroll on mobile */}
      <div className="px-3 sm:px-5 py-2 sm:py-3 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
        <div className="flex items-center gap-3 sm:gap-6 text-xs sm:text-sm min-w-max">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-slate-600 dark:text-slate-400">Total:</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">{stats.total}</span>
          </div>
          <div className="h-3 sm:h-4 w-px bg-slate-300 dark:bg-slate-700"></div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="inline-block w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-500"></span>
            <span className="text-slate-600 dark:text-slate-400">High:</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">{stats.high}</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="inline-block w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-500"></span>
            <span className="text-slate-600 dark:text-slate-400">Medium:</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">{stats.medium}</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="inline-block w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500"></span>
            <span className="text-slate-600 dark:text-slate-400">Low:</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">{stats.low}</span>
          </div>
          <div className="h-3 sm:h-4 w-px bg-slate-300 dark:bg-slate-700"></div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Target className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500" />
            <span className="text-slate-600 dark:text-slate-400">Actionable:</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {stats.actionable}
            </span>
          </div>
        </div>
      </div>

      {/* Filters - Collapsible on mobile */}
      <div className="px-3 sm:px-5 py-2 sm:py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        {/* Mobile: Show/Hide Filters Button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="sm:hidden flex items-center justify-between w-full py-2 text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span>Filters</span>
          </div>
          <ChevronDown
            className={`w-4 h-4 transition-transform ${showFilters ? "rotate-180" : ""}`}
          />
        </button>

        {/* Filter Controls */}
        <div
          className={`${
            showFilters ? "flex" : "hidden"
          } sm:flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 mt-2 sm:mt-0`}
        >
          <div className="hidden sm:flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Filters:</span>
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as any)}
            className="text-xs sm:text-sm px-2 sm:px-3 py-2 sm:py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 w-full sm:w-auto"
          >
            <option value="all">All Categories</option>
            {availableCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>

          {/* Severity Filter */}
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value as any)}
            className="text-xs sm:text-sm px-2 sm:px-3 py-2 sm:py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 w-full sm:w-auto"
          >
            <option value="all">All Severities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs sm:text-sm px-2 sm:px-3 py-2 sm:py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 w-full sm:w-auto"
          >
            <option value="priority">Sort by Priority</option>
            <option value="severity">Sort by Severity</option>
          </select>

          {/* Reset Filters */}
          {(selectedCategory !== "all" || selectedSeverity !== "all") && (
            <button
              onClick={() => {
                setSelectedCategory("all");
                setSelectedSeverity("all");
              }}
              className="text-xs sm:text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium py-2 sm:py-0"
            >
              Clear Filters
            </button>
          )}

          {/* Mobile: Reset Dismissed */}
          <button
            onClick={resetDismissed}
            className="sm:hidden text-xs text-slate-600 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 font-medium py-2"
          >
            Reset Dismissed Insights
          </button>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-5 py-3 sm:py-4">
        {filteredInsights.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3 sm:mb-4">
              <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400 dark:text-slate-600" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2 text-center">
              No insights to display
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 text-center max-w-md">
              {stats.active === 0
                ? "All insights have been dismissed. Add more transactions or reset dismissed insights."
                : "Try adjusting your filters to see more insights."}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 sm:space-y-3">
            {filteredInsights.map((insight) => {
              const isExpanded = expandedInsights.has(insight.id);
              return (
                <div
                  key={insight.id}
                  className={`rounded-lg sm:rounded-xl border-2 p-3 sm:p-4 transition-all ${severityClasses(
                    insight.severity
                  )}`}
                >
                  <div className="flex items-start gap-2 sm:gap-3">
                    {/* Icon */}
                    <div className="mt-0.5 opacity-90 flex-shrink-0">
                      <SeverityIcon severity={insight.severity} />
                    </div>

                    {/* Content - Added max-width constraint */}
                    <div className="flex-1 min-w-0 max-w-full overflow-hidden">
                      {/* Title Row */}
                      <div className="flex flex-col gap-2 mb-2">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-sm sm:text-base leading-snug flex-1 min-w-0">
                            {insight.title}
                          </h3>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {/* Category Badge */}
                            <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-white/60 dark:bg-slate-950/30 whitespace-nowrap">
                              {getCategoryIcon(insight.category)}
                              <span className="capitalize hidden sm:inline">{insight.category}</span>
                            </span>
                            {/* Priority Badge */}
                            <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-white/60 dark:bg-slate-950/30 whitespace-nowrap">
                              {priorityLabel(insight.priority)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Message */}
                      <p className="text-xs sm:text-sm leading-relaxed opacity-90 mb-2 break-words">
                        {insight.message}
                      </p>

                      {/* Detail (expandable) */}
                      {insight.detail && (
                        <div className="mt-2">
                          {isExpanded && (
                            <div className="bg-white/60 dark:bg-slate-950/30 rounded-md sm:rounded-lg p-2.5 sm:p-3 border border-current/10 mb-2">
                              <p className="text-xs sm:text-sm leading-relaxed break-words">{insight.detail}</p>
                            </div>
                          )}
                          <button
                            onClick={() => toggleExpanded(insight.id)}
                            className="inline-flex items-center gap-1 text-xs sm:text-sm font-medium hover:opacity-70 transition-opacity"
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="w-3 h-3 sm:w-4 sm:h-4" />
                                Show less
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
                                Show recommendation
                              </>
                            )}
                          </button>
                        </div>
                      )}

                      {/* Actionable Badge - Now properly constrained */}
                      {insight.actionable && (
                        <div className="mt-2 sm:mt-3">
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white/70 dark:bg-slate-950/30 text-[10px] sm:text-xs font-medium border border-current/20 whitespace-nowrap">
                            <Target className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            Action Required
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Dismiss Button - Absolutely positioned to stay in place */}
                    <button
                      onClick={() => dismiss(insight.id)}
                      className="shrink-0 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md sm:rounded-lg border border-slate-200/70 dark:border-slate-800/70 bg-white/70 dark:bg-slate-950/10 hover:bg-white dark:hover:bg-slate-950/20 transition-colors self-start"
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

        <div className="h-4" />
      </div>
    </div>
  );
}
