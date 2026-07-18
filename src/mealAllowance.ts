import type { Expense } from './types'
import { formatMoney } from './types'

/** The reimbursable portion of an expense — its amount minus whatever the
 * employee has designated as personal (not the company's to cover). */
export function businessAmount(expense: Expense): number {
  return expense.amount - (expense.personalAmount ?? 0)
}

export interface FoodBalance {
  used: number
  allowance: number
  remaining: number
  over: boolean
  currency: string
}

/**
 * How much of a day's Meals-category spending (after excluding personal
 * portions) counts against the daily allowance, and what's left. Assumes a
 * single currency per trip, matching the allowance itself (a plain number
 * with no currency of its own).
 */
export function foodBalanceForDate(expenses: Expense[], date: string, allowance: number): FoodBalance {
  const mealExpenses = expenses.filter((e) => e.date === date && e.category === 'Meals')
  const used = mealExpenses.reduce((sum, e) => sum + businessAmount(e), 0)
  const currency = mealExpenses[0]?.currency.trim().toUpperCase() || 'USD'
  const remaining = allowance - used
  return { used, allowance, remaining, over: remaining < 0, currency }
}

/** "Food $45.00 used · $5.00 left" or, over budget, "Food $60.00 used · $10.00 over". */
export function formatFoodBalance(balance: FoodBalance): string {
  const used = formatMoney(balance.used, balance.currency)
  const rest = formatMoney(Math.abs(balance.remaining), balance.currency)
  return balance.over ? `Food ${used} used · ${rest} over` : `Food ${used} used · ${rest} left`
}

/** Per-currency totals of the personal (non-reimbursable) portion the
 * employee owes back to the company, across every expense in a report. */
export function personalTotalsByCurrency(expenses: Expense[]): Map<string, number> {
  const totals = new Map<string, number>()
  for (const e of expenses) {
    const personal = e.personalAmount ?? 0
    if (personal <= 0) continue
    const currency = e.currency.trim().toUpperCase()
    totals.set(currency, (totals.get(currency) ?? 0) + personal)
  }
  return totals
}

/** Formatted "employee pays credit card company" total, or null if nothing is owed. */
export function formatPersonalTotal(expenses: Expense[]): string | null {
  const totals = personalTotalsByCurrency(expenses)
  if (totals.size === 0) return null
  return [...totals].map(([currency, amount]) => formatMoney(amount, currency)).join(' + ')
}
