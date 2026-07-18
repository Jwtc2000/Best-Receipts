import { useEffect, useState } from 'react'
import type { Report, Expense } from '../types'
import { formatMoney, newId } from '../types'
import { listReports, listExpenses, saveReport, deleteReport } from '../db'

interface ReportSummary {
  report: Report
  count: number
  total: number
  currency: string
}

export default function ReportList({ onOpenReport }: { onOpenReport: (id: string) => void }) {
  const [summaries, setSummaries] = useState<ReportSummary[] | null>(null)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')

  const refresh = async () => {
    const reports = await listReports()
    const result: ReportSummary[] = []
    for (const report of reports) {
      const expenses = await listExpenses(report.id)
      result.push({
        report,
        count: expenses.length,
        total: expenses.reduce((s: number, e: Expense) => s + e.amount, 0),
        currency: expenses[0]?.currency ?? 'USD',
      })
    }
    setSummaries(result)
  }

  useEffect(() => {
    void refresh()
  }, [])

  const createReport = async () => {
    const name = newName.trim()
    if (!name) return
    const report: Report = { id: newId(), name, createdAt: Date.now() }
    await saveReport(report)
    setNewName('')
    setCreating(false)
    onOpenReport(report.id)
  }

  const removeReport = async (id: string, name: string) => {
    if (!window.confirm(`Delete report "${name}" and all its expenses?`)) return
    await deleteReport(id)
    await refresh()
  }

  return (
    <>
      <header className="topbar">
        <div className="topbar-title">
          <span className="logo">🧾</span>
          <h1>Best Receipts</h1>
        </div>
      </header>

      <main className="content">
        {summaries === null ? (
          <p className="muted center">Loading…</p>
        ) : summaries.length === 0 && !creating ? (
          <div className="empty-state">
            <div className="empty-icon">🧾</div>
            <h2>No reports yet</h2>
            <p className="muted">Create a report, then scan receipts into it.</p>
          </div>
        ) : (
          <ul className="report-list">
            {summaries.map(({ report, count, total, currency }) => (
              <li key={report.id} className="report-card" onClick={() => onOpenReport(report.id)}>
                <div className="report-card-main">
                  <h3>{report.name}</h3>
                  <p className="muted">
                    {count} expense{count === 1 ? '' : 's'}
                  </p>
                </div>
                <div className="report-card-side">
                  <span className="report-total">{formatMoney(total, currency)}</span>
                  <button
                    className="icon-btn danger"
                    aria-label={`Delete ${report.name}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      void removeReport(report.id, report.name)
                    }}
                  >
                    🗑
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {creating ? (
          <form
            className="new-report-form"
            onSubmit={(e) => {
              e.preventDefault()
              void createReport()
            }}
          >
            <input
              autoFocus
              placeholder="Report name — e.g. NYC Trip July"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <div className="form-actions">
              <button type="button" className="btn ghost" onClick={() => setCreating(false)}>
                Cancel
              </button>
              <button type="submit" className="btn primary" disabled={!newName.trim()}>
                Create
              </button>
            </div>
          </form>
        ) : (
          <button className="fab" onClick={() => setCreating(true)}>
            + New Report
          </button>
        )}
      </main>
    </>
  )
}
