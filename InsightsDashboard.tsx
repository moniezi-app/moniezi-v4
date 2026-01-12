import React, { useEffect, useMemo, useState } from "react";
import { X, RefreshCcw, AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import type { Transaction, Invoice, TaxPayment, UserSettings } from "./types";
import {
  generateInsights,
  getDismissedInsightIds,
  dismissInsightId,
  clearDismissedInsights,
  type Insight,
} from "./services/insightsEngine";

type Props = {
  transactions: Transaction[];
  invoices: Invoice[];
  taxPayments: TaxPayment[];
  settings: UserSettings;
  onClose: () => void;
};

function SeverityIcon({ severity }: { severity: Insight["severity"] }) {
  if (severity === "high") return <AlertTriangle size={18} />;
  if (severity === "medium") return <Info size={18} />;
  return <CheckCircle2 size={18} />;
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

export default function InsightsDashboard({
  transactions,
  invoices,
  taxPayments,
  settings,
  onClose,
}: Props) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    setDismissed(new Set(getDismissedInsightIds()));
  }, []);

  const allInsights: Insight[] = useMemo(() => {
    return generateInsights({ transactions, invoices, taxPayments, settings });
  }, [transactions, invoices, taxPayments, settings]);

  const activeInsights = useMemo(() => {
    return allInsights.filter((i) => !dismissed.has(i.id));
  }, [allInsights, dismissed]);

  const dismiss = (id: string) => {
    dismissInsightId(id);
    setDismissed(new Set(getDismissedInsightIds()));
  };

  const resetDismissed = () => {
    clearDismissedInsights();
    setDismissed(new Set());
  };

  return (
    <div className="h-[90vh] max-h-[90vh] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-baseline gap-3">
          <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Insights
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            {activeInsights.length} active
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={resetDismissed}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            title="Reset dismissed"
          >
            <RefreshCcw size={16} />
            Reset
          </button>

          <button
            onClick={onClose}
            className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {activeInsights.length === 0 ? (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-5 text-slate-600 dark:text-slate-300">
            No active insights right now.
            <div className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Add transactions/invoices and Insights will surface patterns.
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {activeInsights.map((insight) => (
              <div
                key={insight.id}
                className={`rounded-xl border p-4 ${severityClasses(insight.severity)}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 opacity-90">
                      <SeverityIcon severity={insight.severity} />
                    </div>
                    <div>
                      <div className="font-semibold">{insight.title}</div>
                      <div className="mt-1 text-sm opacity-90">
                        {insight.message}
                      </div>
                      {insight.detail ? (
                        <div className="mt-2 text-sm opacity-80">
                          {insight.detail}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <button
                    onClick={() => dismiss(insight.id)}
                    className="shrink-0 px-3 py-2 text-sm rounded-lg border border-slate-200/70 dark:border-slate-800/70 bg-white/70 dark:bg-slate-950/10 hover:bg-white dark:hover:bg-slate-950/20"
                    title="Dismiss this insight"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="h-4" />
      </div>
    </div>
  );
}
