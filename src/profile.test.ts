import { beforeEach, describe, expect, it } from 'vitest'
import { getProfile, profileSummaryLines, saveProfile } from './profile'

beforeEach(() => {
  localStorage.clear()
})

describe('getProfile / saveProfile', () => {
  it('returns all-empty fields when nothing has been saved', () => {
    expect(getProfile()).toEqual({ name: '', employeeId: '', costCenter: '', projectNumber: '' })
  })

  it('round-trips a saved profile', () => {
    const profile = { name: 'Jane Doe', employeeId: 'E123', costCenter: 'CC-9', projectNumber: 'PRJ-1' }
    saveProfile(profile)
    expect(getProfile()).toEqual(profile)
  })

  it('falls back to defaults on corrupted storage instead of throwing', () => {
    localStorage.setItem('br.profile', '{not json')
    expect(getProfile()).toEqual({ name: '', employeeId: '', costCenter: '', projectNumber: '' })
  })

  it('ignores non-string fields in stored data', () => {
    localStorage.setItem('br.profile', JSON.stringify({ name: 42, employeeId: null }))
    expect(getProfile()).toEqual({ name: '', employeeId: '', costCenter: '', projectNumber: '' })
  })
})

describe('profileSummaryLines', () => {
  it('returns nothing when every field is empty or blank', () => {
    expect(profileSummaryLines({ name: '', employeeId: '  ', costCenter: '', projectNumber: '' })).toEqual([])
  })

  it('includes only the filled-in fields, trimmed, in a fixed order', () => {
    expect(
      profileSummaryLines({ name: '  Jane Doe  ', employeeId: '', costCenter: 'CC-9', projectNumber: '' }),
    ).toEqual(['Name: Jane Doe', 'Cost Center: CC-9'])
  })

  it('includes all four fields when all are set', () => {
    expect(
      profileSummaryLines({ name: 'Jane', employeeId: 'E1', costCenter: 'CC-9', projectNumber: 'PRJ-1' }),
    ).toEqual(['Name: Jane', 'Employee ID: E1', 'Cost Center: CC-9', 'Project Number: PRJ-1'])
  })
})
