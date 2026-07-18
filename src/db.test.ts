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
