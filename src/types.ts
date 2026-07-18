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
  for (const e of expenses) totals.set(e.currency, (totals.get(e.currency) ?? 0) + e.amount)
  return [...totals].map(([currency, amount]) => formatMoney(amount, currency)).join(' + ')
}

export function newId(): string {
  return crypto.randomUUID()
}
