import { describe, expect, it } from 'vitest'
import { formatTotal, dayNumbersByDate } from './types'

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

describe('dayNumbersByDate', () => {
  it('ranks distinct dates chronologically starting at 1', () => {
    const map = dayNumbersByDate([{ date: '2026-07-19' }, { date: '2026-07-18' }, { date: '2026-07-20' }])
    expect(map.get('2026-07-18')).toBe(1)
    expect(map.get('2026-07-19')).toBe(2)
    expect(map.get('2026-07-20')).toBe(3)
  })

  it('gives repeated dates the same day number', () => {
    const map = dayNumbersByDate([{ date: '2026-07-18' }, { date: '2026-07-19' }, { date: '2026-07-18' }])
    expect(map.get('2026-07-18')).toBe(1)
    expect(map.get('2026-07-19')).toBe(2)
    expect(map.size).toBe(2)
  })

  it('ranks by calendar date regardless of array order', () => {
    // Same set of dates, listed in a different order, should rank identically.
    const map = dayNumbersByDate([{ date: '2026-07-20' }, { date: '2026-07-18' }, { date: '2026-07-19' }])
    expect(map.get('2026-07-18')).toBe(1)
    expect(map.get('2026-07-19')).toBe(2)
    expect(map.get('2026-07-20')).toBe(3)
  })

  it('excludes expenses with no date', () => {
    const map = dayNumbersByDate([{ date: '2026-07-18' }, { date: '' }])
    expect(map.has('')).toBe(false)
    expect(map.size).toBe(1)
  })

  it('returns an empty map when no expenses have a date', () => {
    expect(dayNumbersByDate([{ date: '' }, { date: '' }]).size).toBe(0)
  })
})
