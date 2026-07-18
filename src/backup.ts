import type { Report, Expense } from './types'
import { listReports, listAllExpenses, listAllImages, saveReport, saveExpense, saveImage } from './db'
import { blobToDataURL } from './image'

const APP_ID = 'receipts-express'
// Backups written before the rename carry the old id; still accepted on import.
const LEGACY_APP_IDS = ['best-receipts']

interface BackupFile {
  app: string
  version: 1
  exportedAt: string
  reports: Report[]
  expenses: Expense[]
  images: { id: string; dataUrl: string }[]
}

const LAST_BACKUP_KEY = 'br.lastBackupAt'
const STALE_AFTER_MS = 7 * 24 * 60 * 60 * 1000

export function lastBackupAt(): number | null {
  const raw = localStorage.getItem(LAST_BACKUP_KEY)
  return raw ? Number(raw) : null
}

export function backupIsStale(): boolean {
  const last = lastBackupAt()
  return last === null || Date.now() - last > STALE_AFTER_MS
}

async function buildBackupBlob(): Promise<Blob> {
  const [reports, expenses, images] = await Promise.all([
    listReports(),
    listAllExpenses(),
    listAllImages(),
  ])
  const backup: BackupFile = {
    app: APP_ID,
    version: 1,
    exportedAt: new Date().toISOString(),
    reports,
    expenses,
    images: await Promise.all(
      images.map(async (img) => ({ id: img.id, dataUrl: await blobToDataURL(img.blob) })),
    ),
  }
  return new Blob([JSON.stringify(backup)], { type: 'application/json' })
}

/**
 * Export everything to a single backup file. On mobile this opens the
 * share sheet (save to Files, Drive, Dropbox, …); elsewhere it downloads.
 * Returns true if the backup was handed off, false if the user cancelled.
 */
export async function exportBackup(): Promise<boolean> {
  const blob = await buildBackupBlob()
  const name = `receipts-express-backup-${new Date().toISOString().slice(0, 10)}.json`
  const file = new File([blob], name, { type: 'application/json' })

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Receipts Express backup' })
    } catch (err) {
      if ((err as DOMException).name === 'AbortError') return false
      throw err
    }
  } else {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = name
    a.click()
    URL.revokeObjectURL(url)
  }
  localStorage.setItem(LAST_BACKUP_KEY, String(Date.now()))
  return true
}

/**
 * Restore from a backup file. Existing entries with the same ids are
 * overwritten; everything else is left untouched (safe to run on a
 * device that already has data).
 */
export async function importBackup(file: File): Promise<{ reports: number; expenses: number }> {
  const parsed = JSON.parse(await file.text()) as BackupFile
  const known = parsed.app === APP_ID || LEGACY_APP_IDS.includes(parsed.app)
  if (!known || !Array.isArray(parsed.reports)) {
    throw new Error('Not a Receipts Express backup file')
  }
  for (const image of parsed.images ?? []) {
    const blob = await (await fetch(image.dataUrl)).blob()
    await saveImage({ id: image.id, blob })
  }
  for (const report of parsed.reports) await saveReport(report)
  for (const expense of parsed.expenses ?? []) await saveExpense(expense)
  return { reports: parsed.reports.length, expenses: (parsed.expenses ?? []).length }
}
