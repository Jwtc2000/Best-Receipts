import type { Report, Expense } from './types'
import { shareOrDownloadFile } from './share'

const HEADERS = ['Date', 'Title', 'Merchant', 'Category', 'Amount', 'Currency', 'Notes']

// Prepended to the CSV text so Excel on Windows reads non-ASCII
// merchant/title text as UTF-8 instead of guessing the wrong encoding.
const UTF8_BOM = '﻿'

function csvEscape(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

/** Plain, tabular CSV — no report name or grand-total row — so it opens
 * directly in Excel/Sheets/accounting tools without extra parsing. */
export function buildExpenseCsv(expenses: Expense[]): string {
  const rows = [
    HEADERS,
    ...expenses.map((e) => [e.date, e.title, e.merchant, e.category, e.amount.toFixed(2), e.currency, e.notes]),
  ]
  return rows.map((row) => row.map(csvEscape).join(',')).join('\r\n')
}

/**
 * Export a report's expenses to CSV. On mobile this opens the share sheet;
 * elsewhere it downloads.
 */
export async function exportReportCsv(report: Report, expenses: Expense[]): Promise<void> {
  const csv = UTF8_BOM + buildExpenseCsv(expenses)
  const safeName = report.name.replace(/[^\w-]+/g, '_') || 'expense_report'
  const file = new File([csv], `${safeName}.csv`, { type: 'text/csv;charset=utf-8' })
  await shareOrDownloadFile(file, `${report.name} — CSV export`)
}
