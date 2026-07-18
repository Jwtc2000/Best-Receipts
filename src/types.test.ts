import { describe, expect, it } from 'vitest'
import { formatTotal } from './types'

describe('formatTotal', () => {
  it('sums same-currency expenses into a single total', () => {
    expect(
      formatTotal([
        { amount: 20, currency: 'USD' },
        { amount: 15, currency: 'USD' },
      ]),
    ).toBe('$35.00')
  })

  it('keeps different currencies separate instead of summing raw numbers', () => {
    const result = formatTotal([
      { amount: 20, currency: 'USD' },
      { amount: 15, currency: 'EUR' },
    ])
    expect(result).toContain('$20.00')
    expect(result).toContain('€15.00')
    expect(result).not.toContain('35')
  })

  it('returns a zero total for an empty report', () => {
    expect(formatTotal([])).toBe('$0.00')
  })

  it('merges currency codes that only differ by case (regression)', () => {
    expect(
      formatTotal([
        { amount: 20, currency: 'USD' },
        { amount: 15, currency: 'usd' },
      ]),
    ).toBe('$35.00')
  })
})
