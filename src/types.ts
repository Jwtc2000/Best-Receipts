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

export function newId(): string {
  return crypto.randomUUID()
}
