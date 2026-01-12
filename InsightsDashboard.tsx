import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, Sparkles, X, RefreshCcw } from 'lucide-react';
import { Invoice, TaxPayment, Transaction, UserSettings } from './types';
import { generateInsights, getDismissedInsightIds, Insight, setDismissedInsightIds } from './services/insightsEngine';

type Props = {
  transactions: Transaction[];
  invoices: Invoice[];
  taxPayments: TaxPayment[];
  settings: UserSettings;
  onClose: () => void;
};

const typeStyle: Record<Insight['type'], { badge: string; card: string; icon: React.ReactNode; label: string }> = {
  alert: {
    label: 'ALERT',
    badge: 'bg-red-600 text-white',
    card: 'border-red-200 dark:border-red-500/30 bg-red-50/70 dark:bg-red-500/10',
    icon: <AlertTriangle size={18} strokeWidth={2} />,
  },
  warning: {
    label: 'WARNING',
    badge: 'bg-amber-500 text-white',
    card: 'border-amber-200 dark:border-amber-500/30 bg-amber-50/70 dark:bg-amber-500/10',
    icon: <AlertTriangle size={18} strokeWidth={2} />,
  },
  info: {
    label: 'TIP',
    badge: 'bg-blue-600 text-white',
    card: 'border-blue-200 dark:border-blue-500/30 bg-blue-50/70 dark:bg-blue-500/10',
    icon: <Info size={18} strokeWidth={2} />,
  },
  positive: {
    label: 'GOOD NEWS',
    badge: 'bg-emerald-600 text-white',
    card: 'border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/70 dark:bg-emerald-500/10',
    icon: <CheckCircle2 size={18} strokeWidth={2} />,
  },
};

function niceCategory(cat: Insight['category']): string {
  switch (cat) {
    case 'spending':
      return 'Spending';
    case 'cashflow':
      return 'Cash Flow';
    case 'invoices':
      return 'Invoices';
    case 'tax':
      return 'Taxes';
    case 'patterns':
      return 'Patterns';
    default:
      return 'All';
  }
}

export default function InsightsDashboard({ transactions, invoices, taxPayments, settings, onClose }: Props) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | Insight['category']>('all');

  useEffect(() => {
    setDismissed(new Set(getDismissedInsightIds()));
  }, []);

  // ESC closes modal
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const allInsights = useMemo<Insight[]>(() => {
    return generateInsights({ transactions, invoices, taxPayments, settings });
  }, [transactions, invoices, taxPayments, settings]);

  const visibleInsights = useMemo(() => {
    const filtered = allInsights.filter(i => !dismissed.has(i.id));
    if (filter === 'all') return filtered;
    return filtered.filter(i => i.category === filter);
  }, [allInsights, dismissed, filter]);

  const totalsByCategory = useMemo(() => {
    const map: Record<string, number> = { all: 0 };
    for (const i of allInsights) {
      if (dismissed.has(i.id)) continue;
      map.all += 1;
      map[i.category] = (map[i.category] || 0) + 1;
    }
    return map;
  }, [allInsights, dismissed]);

  const handleDismiss = useCallback(
    (id: string) => {
      setDismissed(prev => {
        const next = new Set(prev);
        next.add(id);
        setDismissedInsightIds(Array.from(next));
        return next;
      });
    },
    []
  );

  const handleResetDismissed = useCallback(() => {
    setDismissed(new Set());
    setDismissedInsightIds([]);
  }, []);

  return (
    <div className="w-full h-full flex flex-col">
      {/* Top Bar */}
      <div className="flex items-start justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/30 backdrop-blur-xl">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/10 dark:bg-purple-400/10 flex items-center justify-center text-purple-700 dark:text-purple-300 border border-purple-200/40 dark:border-purple-500/20">
              <Sparkles size={18} strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-950 dark:text-white font-brand truncate">
                Insights
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
                Offline analysis • Private • No APIs • {Math.max(0, totalsByCategory.all)} active insight(s)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetDismissed}
            className="px-3 py-2 rounded-lg text-xs sm:text-sm font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all"
            title="Reset dismissed insights"
          >
            <span className="inline-flex items-center gap-2"><RefreshCcw size={16} /> Reset</span>
          </button>

          <button
            onClick={onClose}
            className="w-11 h-11 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white transition-all shadow-md"
            title="Close"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="flex flex-wrap gap-2">
          {([
            { key: 'all', label: `All (${totalsByCategory.all || 0})` },
            { key: 'spending', label: `${niceCategory('spending')} (${totalsByCategory.spending || 0})` },
            { key: 'cashflow', label: `${niceCategory('cashflow')} (${totalsByCategory.cashflow || 0})` },
            { key: 'invoices', label: `${niceCategory('invoices')} (${totalsByCategory.invoices || 0})` },
            { key: 'tax', label: `${niceCategory('tax')} (${totalsByCategory.tax || 0})` },
            { key: 'patterns', label: `${niceCategory('patterns')} (${totalsByCategory.patterns || 0})` },
          ] as Array<{ key: 'all' | Insight['category']; label: string }>).map(btn => (
            <button
              key={btn.key}
              onClick={() => setFilter(btn.key)}
              className={`px-3 py-2 rounded-full text-xs sm:text-sm font-bold border transition-all ${
                filter === btn.key
                  ? 'bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-500/20'
                  : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
        {visibleInsights.length === 0 ? (
          <div className="max-w-xl mx-auto mt-10 text-center">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 mb-4">
              <Sparkles size={22} />
            </div>
            <h3 className="text-lg font-extrabold text-slate-950 dark:text-white">No insights right now</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 font-medium mt-2 leading-relaxed">
              Add more transactions (10–20 is a good start), then re-open Insights. If you dismissed items, you can bring them back with “Reset”.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleInsights.map(insight => {
              const style = typeStyle[insight.type];
              return (
                <div
                  key={insight.id}
                  className={`rounded-2xl border p-4 sm:p-5 shadow-sm ${style.card}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-extrabold tracking-widest ${style.badge}`}>
                          {style.icon} {style.label}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-extrabold tracking-widest bg-white/60 dark:bg-white/10 text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/50">
                          {niceCategory(insight.category)}
                        </span>
                      </div>

                      <h4 className="mt-2 text-base sm:text-lg font-extrabold text-slate-950 dark:text-white">
                        {insight.title}
                      </h4>
                      <p className="mt-1 text-sm sm:text-base text-slate-700 dark:text-slate-200 font-medium leading-relaxed">
                        {insight.message}
                      </p>

                      {insight.recommendation && (
                        <div className="mt-3 flex items-start gap-3 bg-white/70 dark:bg-slate-950/30 border border-slate-200/60 dark:border-slate-700/40 rounded-xl p-3">
                          <div className="text-purple-700 dark:text-purple-300 pt-0.5"><Info size={18} /></div>
                          <p className="text-sm text-slate-800 dark:text-slate-200 font-bold leading-relaxed">
                            {insight.recommendation}
                          </p>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleDismiss(insight.id)}
                      className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-all"
                      title="Dismiss"
                    >
                      <X size={16} strokeWidth={2} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom note */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-600 dark:text-slate-300 font-medium flex items-center gap-2">
        <span className="inline-flex items-center gap-2"><Info size={14} /> Insights run locally in your browser. Nothing is sent anywhere.</span>
      </div>
    </div>
  );
}
