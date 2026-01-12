import type { Transaction, Invoice, TaxPayment, UserSettings } from "../types";

export type InsightSeverity = "low" | "medium" | "high";

export type Insight = {
  id: string;
  severity: InsightSeverity;
  title: string;
  message: string;
  detail?: string;
};

const DISMISSED_KEY = "moniezi_insights_dismissed_v1";

export function getDismissedInsightIds(): string[] {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x) => typeof x === "string");
  } catch {
    return [];
  }
}

export function dismissInsightId(id: string) {
  const curr = new Set(getDismissedInsightIds());
  curr.add(id);
  localStorage.setItem(DISMISSED_KEY, JSON.stringify(Array.from(curr)));
}

export function clearDismissedInsights() {
  localStorage.removeItem(DISMISSED_KEY);
}

function parseDate(d: string): number {
  const t = Date.parse(d);
  return Number.isFinite(t) ? t : 0;
}

function sum(nums: number[]) {
  return nums.reduce((a, b) => a + b, 0);
}

function lastNDaysTransactions(transactions: Transaction[], days: number) {
  const now = Date.now();
  const cutoff = now - days * 24 * 60 * 60 * 1000;
  return transactions.filter((t) => parseDate(String((t as any).date)) >= cutoff);
}

function formatMoney(n: number) {
  const sign = n < 0 ? "-" : "";
  const val = Math.abs(n);
  return `${sign}$${val.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function generateInsights(input: {
  transactions: Transaction[];
  invoices: Invoice[];
  taxPayments: TaxPayment[];
  settings: UserSettings;
}): Insight[] {
  const { transactions, invoices, taxPayments } = input;

  const insights: Insight[] = [];

  // 1) Cashflow
  const income = sum(
    transactions.filter((t: any) => t.type === "income").map((t: any) => Number(t.amount) || 0)
  );
  const expenses = sum(
    transactions.filter((t: any) => t.type === "expense").map((t: any) => Number(t.amount) || 0)
  );
  const net = income - expenses;

  if (transactions.length >= 5) {
    if (net < 0) {
      insights.push({
        id: "cashflow_negative",
        severity: "high",
        title: "Negative cash flow",
        message: `You’re spending more than you earn (${formatMoney(net)} net).`,
        detail:
          "Consider reducing your biggest expense category or increasing income inflows.",
      });
    } else if (income > 0 && net < income * 0.1) {
      insights.push({
        id: "cashflow_low_savings",
        severity: "medium",
        title: "Low savings rate",
        message: `Net profit is only about ${Math.round((net / income) * 100)}% of income.`,
        detail: "Aim for 15–25% if possible, depending on your business.",
      });
    } else {
      insights.push({
        id: "cashflow_healthy",
        severity: "low",
        title: "Healthy cash flow",
        message: `You’re net positive by ${formatMoney(net)}.`,
      });
    }
  }

  // 2) Spending trend: last 30 vs previous 30
  if (transactions.length >= 10) {
    const last30 = lastNDaysTransactions(transactions, 30);
    const last60 = lastNDaysTransactions(transactions, 60);
    const prev30 = last60.filter((t) => !last30.includes(t));

    const expLast = sum(
      last30.filter((t: any) => t.type === "expense").map((t: any) => Number(t.amount) || 0)
    );
    const expPrev = sum(
      prev30.filter((t: any) => t.type === "expense").map((t: any) => Number(t.amount) || 0)
    );

    if (expPrev > 0) {
      const change = (expLast - expPrev) / expPrev;
      if (change > 0.25) {
        insights.push({
          id: "spend_up_30",
          severity: "medium",
          title: "Expenses rising",
          message: `Expenses are up ~${Math.round(change * 100)}% vs the previous 30 days.`,
          detail: "Check if any category or vendor spiked unexpectedly.",
        });
      } else if (change < -0.25) {
        insights.push({
          id: "spend_down_30",
          severity: "low",
          title: "Expenses improving",
          message: `Expenses are down ~${Math.round(Math.abs(change) * 100)}% vs the previous 30 days.`,
        });
      }
    }
  }

  // 3) Overdue / unpaid invoices (handles slight schema variants)
  const unpaid = (invoices as any[]).filter((inv) => inv?.status === "unpaid");
  if (unpaid.length > 0) {
    const overdue = unpaid.filter((inv) => {
      const due = inv?.dueDate || inv?.date;
      const dueTs = parseDate(String(due));
      return dueTs > 0 && dueTs < Date.now() - 24 * 60 * 60 * 1000;
    });

    if (overdue.length > 0) {
      insights.push({
        id: "invoices_overdue",
        severity: "high",
        title: "Overdue invoices",
        message: `${overdue.length} unpaid invoice(s) look overdue.`,
        detail: "Follow up with clients and consider adding reminders.",
      });
    } else {
      insights.push({
        id: "invoices_unpaid",
        severity: "medium",
        title: "Unpaid invoices",
        message: `${unpaid.length} invoice(s) are still unpaid.`,
      });
    }
  }

  // 4) Category concentration
  const expenseTx = (transactions as any[]).filter((t) => t?.type === "expense");
  if (expenseTx.length >= 8) {
    const byCat = new Map<string, number>();
    for (const t of expenseTx) {
      const cat = t?.category || "Uncategorized";
      byCat.set(cat, (byCat.get(cat) || 0) + (Number(t.amount) || 0));
    }
    const sorted = Array.from(byCat.entries()).sort((a, b) => b[1] - a[1]);
    const top = sorted[0];
    const totalExp = sum(expenseTx.map((t) => Number(t.amount) || 0));

    if (top && totalExp > 0) {
      const share = top[1] / totalExp;
      if (share > 0.45) {
        insights.push({
          id: "category_concentration",
          severity: "medium",
          title: "One category dominates spending",
          message: `"${top[0]}" is about ${Math.round(share * 100)}% of your expenses.`,
          detail: "If expected (rent/inventory), ignore. Otherwise review it.",
        });
      }
    }
  }

  // 5) Simple tax underfunding signal (approx)
  if (income > 0) {
    const paidTax = sum((taxPayments as any[]).map((p) => Number(p?.amount) || 0));
    const target = income * 0.2; // crude default
    if (paidTax < target * 0.5) {
      insights.push({
        id: "tax_underfunded",
        severity: "medium",
        title: "Tax payments may be low",
        message: `Tax payments (${formatMoney(paidTax)}) look low compared to income.`,
        detail: "Consider setting aside a consistent percentage per income payment.",
      });
    }
  }

  return insights;
}

// ✅ THIS is what App.tsx is importing for the badge count
export function getInsightCount(input: {
  transactions: Transaction[];
  invoices: Invoice[];
  taxPayments: TaxPayment[];
  settings: UserSettings;
}): number {
  const insights = generateInsights(input);
  const dismissed = new Set(getDismissedInsightIds());
  return insights.filter((i) => !dismissed.has(i.id)).length;
}
