export interface Report {
  id: string
  name: string
  createdAt: number
}

export interface Expense {
  id: string
  reportId: string
  /** Manual sort position within the report timeline */
  position: number
  title: string
  merchant: string
  amount: number
  currency: string
  /** ISO date string yyyy-mm-dd */
  date: string
  category: string
  notes: string
  imageId?: string
  createdAt: number
}

export interface ReceiptImage {
  id: string
  blob: Blob
}

export const CATEGORIES = [
  'Meals',
  'Travel',
  'Lodging',
  'Transport',
  'Supplies',
  'Entertainment',
  'Other',
] as const

export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount)
  } catch {
    return `${currency} ${amount.toFixed(2)}`
  }
}

/**
 * Sum amounts per currency and format each separately, since expenses in a
 * report aren't necessarily all in the same currency and naively adding
 * raw numbers across currencies would produce a meaningless total.
 */
export function formatTotal(expenses: { amount: number; currency: string }[]): string {
  if (expenses.length === 0) return formatMoney(0, 'USD')
  const totals = new Map<string, number>()
  for (const e of expenses) {
    // Normalize case so "USD" and "usd" (e.g. from an older backup) merge
    // into one bucket instead of showing as two separate totals.
    const currency = e.currency.trim().toUpperCase()
    totals.set(currency, (totals.get(currency) ?? 0) + e.amount)
  }
  return [...totals].map(([currency, amount]) => formatMoney(amount, currency)).join(' + ')
}

export function newId(): string {
  return crypto.randomUUID()
}

export function formatDate(iso: string): string {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

/**
 * Rank each distinct expense date chronologically across the whole report,
 * so "Day 1" is always the earliest calendar date, "Day 2" the next, and
 * so on — regardless of the expenses' display/position order. Expenses
 * with no date aren't given a day number.
 */
export function dayNumbersByDate(expenses: { date: string }[]): Map<string, number> {
  const uniqueDates = [...new Set(expenses.map((e) => e.date).filter(Boolean))].sort()
  const map = new Map<string, number>()
  uniqueDates.forEach((date, i) => map.set(date, i + 1))
  return map
}
