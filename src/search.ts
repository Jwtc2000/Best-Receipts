import type { Expense } from './types'
import { formatMoney } from './types'

/**
 * Does this expense match a free-text search query on title, merchant, or
 * amount? Amount matches both the raw number ("12.34") and the formatted,
 * currency-symbol form ("$12.34"), so either is searchable.
 */
export function expenseMatches(expense: Expense, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return (
    expense.title.toLowerCase().includes(q) ||
    expense.merchant.toLowerCase().includes(q) ||
    expense.amount.toFixed(2).includes(q) ||
    formatMoney(expense.amount, expense.currency).toLowerCase().includes(q)
  )
}
