import { describe, expect, it } from 'vitest'
import { buildExpenseCsv } from './csv'
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

describe('buildExpenseCsv', () => {
  it('writes the header row even with no expenses', () => {
    expect(buildExpenseCsv([])).toBe('Date,Title,Merchant,Category,Amount,Currency,Notes')
  })

  it('writes one row per expense, in order, with amount formatted to two decimals', () => {
    const csv = buildExpenseCsv([
      makeExpense({ title: 'Lunch', amount: 12 }),
      makeExpense({ title: 'Dinner', amount: 30.5 }),
    ])
    const lines = csv.split('\r\n')
    expect(lines[0]).toBe('Date,Title,Merchant,Category,Amount,Currency,Notes')
    expect(lines[1]).toContain('Lunch')
    expect(lines[1]).toContain('12.00')
    expect(lines[2]).toContain('Dinner')
    expect(lines[2]).toContain('30.50')
  })

  it('quotes fields containing commas', () => {
    const csv = buildExpenseCsv([makeExpense({ merchant: 'Smith, Jones & Co' })])
    expect(csv).toContain('"Smith, Jones & Co"')
  })

  it('quotes and escapes fields containing double quotes', () => {
    const csv = buildExpenseCsv([makeExpense({ notes: 'Said "great service"' })])
    expect(csv).toContain('"Said ""great service"""')
  })

  it('quotes fields containing newlines', () => {
    const csv = buildExpenseCsv([makeExpense({ notes: 'Line one\nLine two' })])
    expect(csv).toContain('"Line one\nLine two"')
  })

  it('leaves plain fields unquoted', () => {
    const csv = buildExpenseCsv([makeExpense({ title: 'Plain Title' })])
    expect(csv).toContain('Plain Title')
    expect(csv).not.toContain('"Plain Title"')
  })
})
