import { jsPDF } from 'jspdf'
import type { Report, Expense } from './types'
import { formatMoney, formatTotal } from './types'
import { getImage } from './db'
import { blobToDataURL, imageDimensions } from './image'

const PAGE_W = 595.28 // A4 portrait, points
const PAGE_H = 841.89
const MARGIN = 48

const TEAL: [number, number, number] = [15, 118, 110]
const SLATE: [number, number, number] = [51, 65, 85]
const LIGHT: [number, number, number] = [241, 245, 249]

function formatDate(iso: string): string {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

/**
 * Build the report PDF: a summary page with every expense and the grand
 * total, followed by one full page per receipt image with its details below.
 */
export async function exportReportPdf(report: Report, expenses: Expense[]): Promise<void> {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const totalDisplay = formatTotal(expenses)

  // ---------- Summary page ----------
  doc.setFillColor(...TEAL)
  doc.rect(0, 0, PAGE_W, 110, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(24)
  doc.text('Expense Report', MARGIN, 52)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'normal')
  doc.text(report.name, MARGIN, 76)
  doc.setFontSize(10)
  doc.text(
    `Generated ${new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}  ·  ${expenses.length} expense${expenses.length === 1 ? '' : 's'}`,
    MARGIN,
    94,
  )

  // Table header
  let y = 150
  const cols = { date: MARGIN, title: MARGIN + 90, category: MARGIN + 290, amount: PAGE_W - MARGIN }
  const drawTableHeader = () => {
    doc.setFillColor(...LIGHT)
    doc.rect(MARGIN - 8, y - 14, PAGE_W - 2 * (MARGIN - 8), 22, 'F')
    doc.setTextColor(...SLATE)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text('DATE', cols.date, y)
    doc.text('EXPENSE', cols.title, y)
    doc.text('CATEGORY', cols.category, y)
    doc.text('AMOUNT', cols.amount, y, { align: 'right' })
    y += 24
  }
  drawTableHeader()

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  expenses.forEach((e, i) => {
    if (y > PAGE_H - 110) {
      doc.addPage()
      y = MARGIN + 14
      drawTableHeader()
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
    }
    if (i % 2 === 1) {
      doc.setFillColor(250, 250, 250)
      doc.rect(MARGIN - 8, y - 12, PAGE_W - 2 * (MARGIN - 8), 20, 'F')
    }
    doc.setTextColor(...SLATE)
    doc.text(formatDate(e.date), cols.date, y)
    const title = e.title || e.merchant || 'Untitled expense'
    doc.text(doc.splitTextToSize(title, 190)[0] ?? '', cols.title, y)
    doc.text(e.category, cols.category, y)
    doc.text(formatMoney(e.amount, e.currency), cols.amount, y, { align: 'right' })
    y += 20
  })

  // Grand total
  y += 8
  doc.setDrawColor(...TEAL)
  doc.setLineWidth(1.5)
  doc.line(MARGIN - 8, y - 6, PAGE_W - MARGIN + 8, y - 6)
  y += 14
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(...TEAL)
  doc.text('TOTAL', cols.title, y)
  doc.text(totalDisplay, cols.amount, y, { align: 'right' })

  // ---------- One page per receipt ----------
  for (const [index, expense] of expenses.entries()) {
    doc.addPage()

    // Header strip
    doc.setFillColor(...LIGHT)
    doc.rect(0, 0, PAGE_W, 40, 'F')
    doc.setTextColor(...SLATE)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text(expense.title || expense.merchant || 'Untitled expense', MARGIN, 25)
    doc.setFont('helvetica', 'normal')
    doc.text(`Receipt ${index + 1} of ${expenses.length}`, PAGE_W - MARGIN, 25, { align: 'right' })

    // Receipt image, as large as fits above the details block
    const detailsTop = PAGE_H - 150
    const imgArea = { x: MARGIN, y: 56, w: PAGE_W - 2 * MARGIN, h: detailsTop - 56 - 16 }
    const stored = expense.imageId ? await getImage(expense.imageId) : undefined
    if (stored) {
      const dataUrl = await blobToDataURL(stored.blob)
      const dim = await imageDimensions(dataUrl)
      const scale = Math.min(imgArea.w / dim.width, imgArea.h / dim.height)
      const w = dim.width * scale
      const h = dim.height * scale
      const x = imgArea.x + (imgArea.w - w) / 2
      doc.addImage(dataUrl, 'JPEG', x, imgArea.y, w, h)
    } else {
      doc.setTextColor(150, 150, 150)
      doc.setFontSize(12)
      doc.text('No receipt image', PAGE_W / 2, imgArea.y + imgArea.h / 2, { align: 'center' })
    }

    // Details block
    doc.setDrawColor(...TEAL)
    doc.setLineWidth(2)
    doc.line(MARGIN, detailsTop, PAGE_W - MARGIN, detailsTop)

    let dy = detailsTop + 24
    doc.setTextColor(...TEAL)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(15)
    doc.text(expense.title || expense.merchant || 'Untitled expense', MARGIN, dy)
    doc.setTextColor(...SLATE)
    doc.setFontSize(15)
    doc.text(formatMoney(expense.amount, expense.currency), PAGE_W - MARGIN, dy, { align: 'right' })

    dy += 22
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    const parts = [
      expense.merchant && expense.merchant !== expense.title ? expense.merchant : null,
      formatDate(expense.date),
      expense.category,
    ].filter(Boolean)
    doc.text(parts.join('   ·   '), MARGIN, dy)

    if (expense.notes) {
      dy += 18
      doc.setTextColor(100, 116, 139)
      const noteLines = doc.splitTextToSize(expense.notes, PAGE_W - 2 * MARGIN)
      doc.text(noteLines.slice(0, 3), MARGIN, dy)
    }
  }

  const safeName = report.name.replace(/[^\w-]+/g, '_') || 'expense_report'
  doc.save(`${safeName}.pdf`)
}
