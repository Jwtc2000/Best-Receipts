import { describe, expect, it } from 'vitest'
import { expenseMatches } from './search'
import type { Expense } from './types'

function makeExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: 'e1',
    reportId: 'r1',
    position: 0,
    title: 'Team lunch',
    merchant: "Joe's Diner",
    amount: 42.5,
    currency: 'USD',
    date: '2026-07-18',
    category: 'Meals',
    notes: '',
    createdAt: 1,
    ...overrides,
  }
}

describe('expenseMatches', () => {
  it('matches on title, case-insensitively', () => {
    expect(expenseMatches(makeExpense({ title: 'Team Lunch' }), 'lunch')).toBe(true)
    expect(expenseMatches(makeExpense({ title: 'Team Lunch' }), 'LUNCH')).toBe(true)
  })

  it('matches on merchant', () => {
    expect(expenseMatches(makeExpense({ merchant: "Joe's Diner" }), "joe's")).toBe(true)
  })

  it('matches on the raw amount', () => {
    expect(expenseMatches(makeExpense({ amount: 42.5 }), '42.50')).toBe(true)
    expect(expenseMatches(makeExpense({ amount: 42.5 }), '42.5')).toBe(true)
  })

  it('matches on the formatted, currency-symbol amount', () => {
    expect(expenseMatches(makeExpense({ amount: 42.5, currency: 'USD' }), '$42.50')).toBe(true)
  })

  it('does not match unrelated text', () => {
    expect(expenseMatches(makeExpense({ title: 'Team lunch', merchant: "Joe's Diner" }), 'airfare')).toBe(false)
  })

  it('treats an empty or blank query as matching everything', () => {
    expect(expenseMatches(makeExpense(), '')).toBe(true)
    expect(expenseMatches(makeExpense(), '   ')).toBe(true)
  })
})
