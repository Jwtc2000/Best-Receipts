import { beforeEach, describe, expect, it } from 'vitest'
import { resetFakeIndexedDB } from './test/idb-reset'
import type { Expense } from './types'

beforeEach(() => {
  resetFakeIndexedDB()
})

function makeExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: 'expense-1',
    reportId: 'report-1',
    position: 0,
    title: 'Lunch',
    merchant: 'Cafe',
    amount: 12.5,
    currency: 'USD',
    date: '2026-07-18',
    category: 'Meals',
    notes: '',
    createdAt: Date.now(),
    ...overrides,
  }
}

describe('saveExpenseWithImage', () => {
  it('replaces the image and drops the old one only after the new one is written', async () => {
    const db = await import('./db')
    const oldImage = { id: 'image-old', blob: new Blob(['old']) }
    await db.saveImage(oldImage)
    await db.saveExpense(makeExpense({ imageId: oldImage.id }))

    const newImage = { id: 'image-new', blob: new Blob(['new']) }
    const updated = makeExpense({ imageId: newImage.id })
    await db.saveExpenseWithImage(updated, newImage, oldImage.id)

    expect(await db.getImage(oldImage.id)).toBeUndefined()
    const stored = await db.getImage(newImage.id)
    expect(stored).toBeDefined()
    expect(await db.getExpense(updated.id)).toMatchObject({ imageId: newImage.id })
  })

  it('leaves the existing image untouched when the image is not changed', async () => {
    const db = await import('./db')
    const image = { id: 'image-1', blob: new Blob(['data']) }
    await db.saveImage(image)
    await db.saveExpense(makeExpense({ imageId: image.id }))

    const renamed = makeExpense({ imageId: image.id, title: 'Dinner' })
    await db.saveExpenseWithImage(renamed, undefined, undefined)

    expect(await db.getImage(image.id)).toBeDefined()
    expect(await db.getExpense(renamed.id)).toMatchObject({ imageId: image.id, title: 'Dinner' })
  })

  it('adds a first image without needing anything to delete', async () => {
    const db = await import('./db')
    const image = { id: 'image-1', blob: new Blob(['data']) }
    const expense = makeExpense({ imageId: image.id })
    await db.saveExpenseWithImage(expense, image, undefined)

    expect(await db.getImage(image.id)).toBeDefined()
    expect(await db.getExpense(expense.id)).toMatchObject({ imageId: image.id })
  })
})

describe('listExpenses', () => {
  it('sorts by date rather than position', async () => {
    const db = await import('./db')
    await db.saveExpense(makeExpense({ id: 'later', date: '2026-07-20', position: 0 }))
    await db.saveExpense(makeExpense({ id: 'earlier', date: '2026-07-18', position: 1 }))
    const list = await db.listExpenses('report-1')
    expect(list.map((e) => e.id)).toEqual(['earlier', 'later'])
  })
})

describe('nextPosition', () => {
  it('returns one past the highest position even when date-sort reorders the list (regression)', async () => {
    const db = await import('./db')
    // Position 5 sorts first here because its date is earlier, so a naive
    // "last item in the sorted list" read would wrongly return 1 (0 + 1).
    await db.saveExpense(makeExpense({ id: 'a', date: '2026-07-20', position: 0 }))
    await db.saveExpense(makeExpense({ id: 'b', date: '2026-07-18', position: 5 }))
    expect(await db.nextPosition('report-1')).toBe(6)
  })
})
