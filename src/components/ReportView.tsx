import { Fragment, useEffect, useRef, useState } from 'react'
import type { Report, Expense } from '../types'
import { formatMoney, formatTotal, formatDate, dayNumbersByDate } from '../types'
import {
  getReport,
  saveReport,
  listReports,
  listExpenses,
  saveExpense,
  saveExpenses,
  deleteExpense,
  getImage,
  nextPosition,
} from '../db'
import { exportReportPdf } from '../pdf'
import { exportReportCsv } from '../csv'
import { expenseMatches } from '../search'
import Icon from './icons'

interface Props {
  reportId: string
  onBack: () => void
  onAddExpense: () => void
  onEditExpense: (expenseId: string) => void
}

export default function ReportView({ reportId, onBack, onAddExpense, onEditExpense }: Props) {
  const [report, setReport] = useState<Report | null>(null)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [thumbs, setThumbs] = useState<Map<string, string>>(new Map())
  const [otherReports, setOtherReports] = useState<Report[]>([])
  const [movingId, setMovingId] = useState<string | null>(null)
  const [exporting, setExporting] = useState<'pdf' | 'csv' | null>(null)
  const [exportMenuOpen, setExportMenuOpen] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const dragIndex = useRef<number | null>(null)
  const thumbsRef = useRef<Map<string, string>>(new Map())

  const refresh = async () => {
    const r = await getReport(reportId)
    if (!r) {
      onBack()
      return
    }
    setReport(r)
    const list = await listExpenses(reportId)
    setExpenses(list)
    setOtherReports((await listReports()).filter((x) => x.id !== reportId))

    const next = new Map<string, string>()
    for (const e of list) {
      if (!e.imageId) continue
      const existing = thumbsRef.current.get(e.imageId)
      if (existing) {
        next.set(e.imageId, existing)
      } else {
        const img = await getImage(e.imageId)
        if (img) next.set(e.imageId, URL.createObjectURL(img.blob))
      }
    }
    // Revoke thumbnails no longer in use
    for (const [id, url] of thumbsRef.current) {
      if (!next.has(id)) URL.revokeObjectURL(url)
    }
    thumbsRef.current = next
    setThumbs(next)
  }

  useEffect(() => {
    void refresh()
    return () => {
      for (const url of thumbsRef.current.values()) URL.revokeObjectURL(url)
      thumbsRef.current = new Map()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportId])

  const totalDisplay = formatTotal(expenses)

  // ---- Search ----

  const query = searchQuery.trim()
  const searching = searchOpen && query.length > 0
  const visibleIndices: number[] = []
  expenses.forEach((e, i) => {
    if (!searching || expenseMatches(e, query)) visibleIndices.push(i)
  })
  const lastVisibleIndex = visibleIndices[visibleIndices.length - 1]

  const toggleSearch = () => {
    if (searchOpen) setSearchQuery('')
    setSearchOpen((v) => !v)
  }

  // ---- Day grouping ----
  // "Day N" is the chronological rank of an expense's calendar date across
  // the whole report, so it stays correct regardless of manual reordering
  // or search filtering. A divider is shown above the first visible
  // expense of each date.

  const dayNumberByDate = dayNumbersByDate(expenses)
  const dayDividerAt = new Set<number>()
  {
    let previousDate: string | null = null
    for (const i of visibleIndices) {
      const date = expenses[i].date
      if (date && dayNumberByDate.has(date) && date !== previousDate) dayDividerAt.add(i)
      if (date) previousDate = date
    }
  }

  // ---- Reordering ----

  const persistOrder = async (list: Expense[]) => {
    const renumbered = list.map((e, i) => ({ ...e, position: i }))
    setExpenses(renumbered)
    await saveExpenses(renumbered)
  }

  const moveBy = (index: number, delta: number) => {
    const target = index + delta
    if (target < 0 || target >= expenses.length) return
    const list = [...expenses]
    ;[list[index], list[target]] = [list[target], list[index]]
    void persistOrder(list)
  }

  const handleDrop = (dropIndex: number) => {
    const from = dragIndex.current
    dragIndex.current = null
    if (from === null || from === dropIndex) return
    const list = [...expenses]
    const [moved] = list.splice(from, 1)
    list.splice(dropIndex, 0, moved)
    void persistOrder(list)
  }

  // ---- Move to another report ----

  const moveToReport = async (expense: Expense, targetReportId: string) => {
    const position = await nextPosition(targetReportId)
    await saveExpense({ ...expense, reportId: targetReportId, position })
    setMovingId(null)
    await refresh()
  }

  const removeExpense = async (expense: Expense) => {
    if (!window.confirm(`Delete "${expense.title || 'this expense'}"?`)) return
    await deleteExpense(expense.id)
    await refresh()
  }

  const doExportPdf = async () => {
    if (!report || expenses.length === 0) return
    setExportMenuOpen(false)
    setExporting('pdf')
    try {
      await exportReportPdf(report, expenses)
    } finally {
      setExporting(null)
    }
  }

  const doExportCsv = async () => {
    if (!report || expenses.length === 0) return
    setExportMenuOpen(false)
    setExporting('csv')
    try {
      await exportReportCsv(report, expenses)
    } finally {
      setExporting(null)
    }
  }

  const saveRename = async () => {
    if (!report) return
    const name = nameDraft.trim()
    if (name && name !== report.name) {
      await saveReport({ ...report, name })
      setReport({ ...report, name })
    }
    setRenaming(false)
  }

  if (!report) return <p className="muted center">Loading…</p>

  return (
    <>
      <header className="topbar">
        <button className="icon-btn" onClick={onBack} aria-label="Back">
          <Icon name="chevron-left" size={22} />
        </button>
        {renaming ? (
          <form
            className="rename-form"
            onSubmit={(e) => {
              e.preventDefault()
              void saveRename()
            }}
          >
            <input autoFocus value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} onBlur={() => void saveRename()} />
          </form>
        ) : (
          <h1
            className="report-title"
            onClick={() => {
              setNameDraft(report.name)
              setRenaming(true)
            }}
            title="Tap to rename"
          >
            {report.name}
          </h1>
        )}
        {expenses.length > 0 && (
          <button
            className="icon-btn"
            aria-label={searchOpen ? 'Close search' : 'Search expenses'}
            onClick={toggleSearch}
          >
            <Icon name={searchOpen ? 'close' : 'search'} size={20} />
          </button>
        )}
        <div className="export-menu-wrap">
          <button
            className="btn primary small"
            onClick={() => setExportMenuOpen((v) => !v)}
            disabled={exporting !== null || expenses.length === 0}
          >
            {exporting === 'pdf' ? 'Exporting PDF…' : exporting === 'csv' ? 'Exporting CSV…' : 'Export'}
          </button>
          {exportMenuOpen && (
            <>
              <div className="export-menu-backdrop" onClick={() => setExportMenuOpen(false)} />
              <div className="export-menu">
                <button className="btn ghost small" onClick={() => void doExportPdf()}>
                  Export as PDF
                </button>
                <button className="btn ghost small" onClick={() => void doExportCsv()}>
                  Export as CSV
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      {searchOpen && (
        <div className="search-bar">
          <Icon name="search" size={16} />
          <input
            autoFocus
            type="text"
            inputMode="search"
            placeholder="Search title, merchant, or amount…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="icon-btn" aria-label="Clear search" onClick={() => setSearchQuery('')}>
              <Icon name="close" size={14} />
            </button>
          )}
        </div>
      )}

      <div className="report-summary-bar">
        <span>
          {searching
            ? `${visibleIndices.length} of ${expenses.length} match${expenses.length === 1 ? '' : 'es'}`
            : `${expenses.length} expense${expenses.length === 1 ? '' : 's'}`}
        </span>
        <strong>{totalDisplay}</strong>
      </div>

      <main className="content">
        {expenses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <Icon name="camera" size={52} />
            </div>
            <h2>No expenses yet</h2>
            <p className="muted">Scan your first receipt to get started.</p>
          </div>
        ) : searching && visibleIndices.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <Icon name="search" size={52} />
            </div>
            <h2>No matches</h2>
            <p className="muted">Try a different title, merchant, or amount.</p>
          </div>
        ) : (
          <ol className="timeline">
            {expenses.map((expense, index) => {
              if (searching && !expenseMatches(expense, query)) return null
              const dayNumber = dayDividerAt.has(index) ? dayNumberByDate.get(expense.date) : undefined
              return (
              <Fragment key={expense.id}>
              {dayNumber !== undefined && (
                <li className="day-divider">
                  <span className="day-divider-label">Day {dayNumber}</span>
                  <span className="day-divider-date">{formatDate(expense.date)}</span>
                </li>
              )}
              <li
                className="timeline-item"
                draggable={!searching}
                onDragStart={() => {
                  dragIndex.current = index
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(index)}
              >
                <div className="timeline-marker">
                  <span className="timeline-dot" />
                  {index !== lastVisibleIndex && <span className="timeline-line" />}
                </div>

                <div className="expense-card">
                  <div className="expense-card-body" onClick={() => onEditExpense(expense.id)}>
                    {expense.imageId && thumbs.get(expense.imageId) ? (
                      <img className="expense-thumb" src={thumbs.get(expense.imageId)} alt="" />
                    ) : (
                      <div className="expense-thumb placeholder">
                        <Icon name="receipt" size={24} />
                      </div>
                    )}
                    <div className="expense-info">
                      <h3>{expense.title || expense.merchant || 'Untitled expense'}</h3>
                      <p className="muted">
                        {expense.date || 'No date'} · {expense.category}
                      </p>
                    </div>
                    <span className="expense-amount">
                      {formatMoney(expense.amount, expense.currency)}
                    </span>
                  </div>

                  <div className="expense-actions">
                    {!searching && (
                      <>
                        <button className="icon-btn" onClick={() => moveBy(index, -1)} disabled={index === 0} aria-label="Move up">
                          <Icon name="chevron-up" size={18} />
                        </button>
                        <button
                          className="icon-btn"
                          onClick={() => moveBy(index, 1)}
                          disabled={index === expenses.length - 1}
                          aria-label="Move down"
                        >
                          <Icon name="chevron-down" size={18} />
                        </button>
                      </>
                    )}
                    {otherReports.length > 0 && (
                      <button
                        className="icon-btn"
                        onClick={() => setMovingId(movingId === expense.id ? null : expense.id)}
                        aria-label="Move to another report"
                      >
                        <Icon name="swap" size={16} />
                      </button>
                    )}
                    <button className="icon-btn danger" onClick={() => void removeExpense(expense)} aria-label="Delete">
                      <Icon name="trash" size={17} />
                    </button>
                  </div>

                  {movingId === expense.id && (
                    <div className="move-picker">
                      <span className="muted">Move to:</span>
                      {otherReports.map((r) => (
                        <button key={r.id} className="btn ghost small" onClick={() => void moveToReport(expense, r.id)}>
                          {r.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </li>
              </Fragment>
              )
            })}
          </ol>
        )}

        <button className="fab" onClick={onAddExpense}>
          + Add Expense
        </button>
      </main>
    </>
  )
}
