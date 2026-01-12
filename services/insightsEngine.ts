import { Invoice, TaxPayment, Transaction, UserSettings } from '../types';

export type InsightType = 'alert' | 'warning' | 'info' | 'positive';

export interface Insight {
  id: string;                 // deterministic across runs
  type: InsightType;          // drives color + icon
  category: 'spending' | 'cashflow' | 'invoices' | 'tax' | 'patterns';
  title: string;
  message: string;
  recommendation?: string;
  priority: number;           // 1..10
}

const DISMISSED_KEY = 'moniezi_v4.dismissedInsights.v1';

export function getDismissedInsightIds(): string[] {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter(x => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function setDismissedInsightIds(ids: string[]): void {
  try {
    const uniq = Array.from(new Set(ids.filter(x => typeof x === 'string')));
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(uniq));
  } catch {
    // ignore
  }
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function parseDate(dateStr: string): Date | null {
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

function sumTx(transactions: Transaction[], type: 'income' | 'expense'): number {
  return transactions
    .filter(t => t.type === type)
    .reduce((s, t) => s + Math.abs(Number(t.amount) || 0), 0);
}

function txInLastDays(transactions: Transaction[], days: number): Transaction[] {
  const cutoff = startOfDay(new Date());
  cutoff.setDate(cutoff.getDate() - days);
  return transactions.filter(t => {
    const d = parseDate(t.date);
    return d ? d >= cutoff : false;
  });
}

function txBetweenDaysAgo(transactions: Transaction[], startDaysAgo: number, endDaysAgo: number): Transaction[] {
  // range: [today - startDaysAgo, today - endDaysAgo)
  const end = startOfDay(new Date());
  end.setDate(end.getDate() - endDaysAgo);
  const start = startOfDay(new Date());
  start.setDate(start.getDate() - startDaysAgo);

  return transactions.filter(t => {
    const d = parseDate(t.date);
    return d ? (d >= start && d < end) : false;
  });
}

function formatCurrency(amount: number, currencySymbol: string = '$'): string {
  const n = Number(amount);
  if (!isFinite(n)) return `${currencySymbol}0.00`;
  // Keep it simple and consistent with the rest of Moniezi formatting
  return `${currencySymbol}${n.toFixed(2)}`;
}

export function generateInsights(args: {
  transactions: Transaction[];
  invoices: Invoice[];
  taxPayments: TaxPayment[];
  settings: UserSettings;
}): Insight[] {
  const { transactions, invoices, taxPayments, settings } = args;
  const currencySymbol = settings?.currencySymbol || '$';
  const insights: Insight[] = [];
  const today = startOfDay(new Date());
  const monthKey = today.toISOString().slice(0, 7);

  // Guard: if no data, return empty
  if (!transactions || transactions.length === 0) return [];

  // 1) Spending change (last 30 vs previous 30)
  {
    const last30 = txInLastDays(transactions, 30);
    const prev30 = txBetweenDaysAgo(transactions, 60, 30);

    const spendLast30 = sumTx(last30, 'expense');
    const spendPrev30 = sumTx(prev30, 'expense');

    if (spendPrev30 > 0 && spendLast30 > 0) {
      const changePct = ((spendLast30 - spendPrev30) / spendPrev30) * 100;
      if (changePct >= 20) {
        insights.push({
          id: `spending_increase_${monthKey}`,
          type: 'warning',
          category: 'spending',
          title: 'Spending Increased vs Last Month',
          message: `Your last 30 days spending is up ${changePct.toFixed(1)}% (${formatCurrency(spendLast30, currencySymbol)} vs ${formatCurrency(spendPrev30, currencySymbol)}).`,
          recommendation: 'Review your biggest expense categories and cut one non-essential item this week.',
          priority: 8,
        });
      } else if (changePct <= -15) {
        insights.push({
          id: `spending_decrease_${monthKey}`,
          type: 'positive',
          category: 'spending',
          title: 'Nice Work Reducing Spending',
          message: `Your spending dropped ${Math.abs(changePct).toFixed(1)}% compared to the previous 30 days.`,
          recommendation: 'Consider moving part of the savings toward taxes or a financial buffer.',
          priority: 6,
        });
      }
    }
  }

  // 2) Cashflow (last 30 days)
  {
    const last30 = txInLastDays(transactions, 30);
    const income = sumTx(last30, 'income');
    const expenses = sumTx(last30, 'expense');
    const net = income - expenses;

    // Only show if there's meaningful activity
    if (income > 0 || expenses > 0) {
      const ratio = income > 0 ? (net / income) * 100 : -100;
      if (net < 0) {
        insights.push({
          id: `cashflow_negative_${monthKey}`,
          type: 'alert',
          category: 'cashflow',
          title: 'Negative Cash Flow',
          message: `You spent ${formatCurrency(Math.abs(net), currencySymbol)} more than you earned in the last 30 days.`,
          recommendation: 'Reduce expenses for 7 days and add at least one new income entry or invoice.',
          priority: 10,
        });
      } else if (income > 0 && ratio < 10) {
        insights.push({
          id: `cashflow_low_savings_${monthKey}`,
          type: 'warning',
          category: 'cashflow',
          title: 'Low Savings Rate',
          message: `You saved about ${ratio.toFixed(1)}% of income in the last 30 days.`,
          recommendation: 'Aim for 15–20%. Pick one category to reduce by 10% this month.',
          priority: 8,
        });
      } else if (income > 0 && ratio >= 20) {
        insights.push({
          id: `cashflow_good_${monthKey}`,
          type: 'positive',
          category: 'cashflow',
          title: 'Healthy Cash Flow',
          message: `You saved about ${ratio.toFixed(1)}% of income in the last 30 days (${formatCurrency(net, currencySymbol)}).`,
          recommendation: 'Nice. Consider allocating a fixed % to taxes and a buffer.',
          priority: 6,
        });
      }
    }
  }

  // 3) Pattern: top expense category concentration (last 30 days)
  {
    const last30 = txInLastDays(transactions, 30).filter(t => t.type === 'expense');
    const total = last30.reduce((s, t) => s + Math.abs(Number(t.amount) || 0), 0);
    if (total > 0) {
      const byCat = new Map<string, number>();
      for (const t of last30) {
        const cat = (t.category || 'Uncategorized').trim() || 'Uncategorized';
        byCat.set(cat, (byCat.get(cat) || 0) + Math.abs(Number(t.amount) || 0));
      }
      const top = Array.from(byCat.entries()).sort((a, b) => b[1] - a[1])[0];
      if (top) {
        const pct = (top[1] / total) * 100;
        if (pct >= 45) {
          insights.push({
            id: `pattern_top_category_${monthKey}_${top[0].toLowerCase().replace(/\s+/g, '_')}`,
            type: 'info',
            category: 'patterns',
            title: `Top Spend Category: ${top[0]}`,
            message: `${pct.toFixed(1)}% of your last 30 days spending is in "${top[0]}".`,
            recommendation: 'If this is essential, set a budget. If it’s optional, cap it for the next 2 weeks.',
            priority: 5,
          });
        }
      }
    }
  }

  // 4) Overdue invoices
  {
    const overdue = (invoices || []).filter(inv => {
      if (!inv || inv.status !== 'unpaid') return false;
      const due = parseDate(inv.due);
      return due ? startOfDay(due) < today : false;
    });

    if (overdue.length > 0) {
      // earliest due date for stable id
      const earliest = overdue
        .map(inv => parseDate(inv.due))
        .filter((d): d is Date => !!d)
        .sort((a, b) => a.getTime() - b.getTime())[0];

      const totalDue = overdue.reduce((s, inv) => s + Math.abs(Number(inv.amount) || 0), 0);

      insights.push({
        id: `invoice_overdue_${earliest ? isoDate(earliest) : monthKey}`,
        type: 'alert',
        category: 'invoices',
        title: `Overdue Invoices (${overdue.length})`,
        message: `You have ${overdue.length} unpaid invoice(s) past due totaling about ${formatCurrency(totalDue, currencySymbol)}.`,
        recommendation: 'Send a friendly reminder today. Consider adding late terms for future invoices.',
        priority: 9,
      });
    } else {
      const unpaid = (invoices || []).filter(inv => inv?.status === 'unpaid');
      if (unpaid.length >= 5) {
        insights.push({
          id: `invoice_unpaid_many_${monthKey}`,
          type: 'warning',
          category: 'invoices',
          title: 'Many Unpaid Invoices',
          message: `You currently have ${unpaid.length} unpaid invoices.`,
          recommendation: 'Batch-send reminders and mark paid invoices in the app to keep totals accurate.',
          priority: 7,
        });
      }
    }
  }

  // 5) Tax funding reminder (simple YTD estimate)
  {
    const year = today.getFullYear();
    const ytdIncome = (transactions || [])
      .filter(t => t.type === 'income' && t.date?.startsWith(String(year)))
      .reduce((s, t) => s + Math.abs(Number(t.amount) || 0), 0);

    const ytdTaxPaid = (taxPayments || [])
      .filter(p => p.date?.startsWith(String(year)))
      .reduce((s, p) => s + Math.abs(Number(p.amount) || 0), 0);

    const totalRate = (Number(settings?.taxRate) || 0) + (Number(settings?.stateTaxRate) || 0);
    const estTax = ytdIncome * (totalRate / 100);

    if (ytdIncome > 0 && totalRate > 0) {
      const fundedPct = estTax > 0 ? (ytdTaxPaid / estTax) * 100 : 0;
      // Only surface if we have some income and are underfunded
      if (fundedPct < 60 && today.getMonth() >= 2) { // March+ reduces noise early Jan/Feb
        insights.push({
          id: `tax_underfunded_${year}_${today.getMonth()+1}`,
          type: 'warning',
          category: 'tax',
          title: 'Tax Payments May Be Behind',
          message: `Estimated tax on YTD income is about ${formatCurrency(estTax, currencySymbol)}. You've logged ${formatCurrency(ytdTaxPaid, currencySymbol)} (~${fundedPct.toFixed(0)}%).`,
          recommendation: 'Consider setting aside a fixed % of each income transaction and logging estimated payments.',
          priority: 7,
        });
      } else if (fundedPct >= 80 && ytdTaxPaid > 0) {
        insights.push({
          id: `tax_ontrack_${year}`,
          type: 'positive',
          category: 'tax',
          title: 'Tax Funding Looks On Track',
          message: `You’ve logged about ${fundedPct.toFixed(0)}% of your estimated YTD tax.`,
          recommendation: 'Keep the habit—consistency beats surprises.',
          priority: 5,
        });
      }
    }
  }

  // Sort + return
  return insights.sort((a, b) => b.priority - a.priority);
}

export function getInsightCount(args: {
  transactions: Transaction[];
  invoices: Invoice[];
  taxPayments: TaxPayment[];
  settings: UserSettings;
}): number {
  try {
    const all = generateInsights(args);
    const dismissed = new Set(getDismissedInsightIds());
    return all.filter(i => !dismissed.has(i.id)).length;
  } catch {
    return 0;
  }
}
