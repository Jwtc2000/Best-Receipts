import { useEffect, useRef, useState } from 'react'
import type { Report } from '../types'
import { formatTotal, newId } from '../types'
import { listReports, listExpenses, saveReport, deleteReport } from '../db'
import { exportBackup, importBackup, lastBackupAt, backupIsStale } from '../backup'
import Icon from './icons'

interface ReportSummary {
  report: Report
  count: number
  totalDisplay: string
}

export default function ReportList({ onOpenReport }: { onOpenReport: (id: string) => void }) {
  const [summaries, setSummaries] = useState<ReportSummary[] | null>(null)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [backupBusy, setBackupBusy] = useState(false)
  const [backupNote, setBackupNote] = useState<string | null>(null)
  const [backupTick, setBackupTick] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const restoreInput = useRef<HTMLInputElement>(null)

  const refresh = async () => {
    const reports = await listReports()
    const result: ReportSummary[] = []
    for (const report of reports) {
      const expenses = await listExpenses(report.id)
      result.push({
        report,
        count: expenses.length,
        totalDisplay: formatTotal(expenses),
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

  const doBackup = async () => {
    setBackupBusy(true)
    setBackupNote(null)
    try {
      const done = await exportBackup()
      if (done) setBackupNote('Backup saved')
    } catch {
      setBackupNote('Backup failed — try again')
    } finally {
      setBackupBusy(false)
      setBackupTick((t) => t + 1)
    }
  }

  const doRestore = async (file: File | undefined) => {
    if (!file) return
    setBackupBusy(true)
    setBackupNote(null)
    try {
      const { reports, expenses } = await importBackup(file)
      setBackupNote(`Restored ${reports} report${reports === 1 ? '' : 's'}, ${expenses} expense${expenses === 1 ? '' : 's'}`)
      await refresh()
    } catch {
      setBackupNote("Couldn't read that file — is it a Receipts Express backup?")
    } finally {
      setBackupBusy(false)
      if (restoreInput.current) restoreInput.current.value = ''
    }
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
          <span className="logo">
            <Icon name="receipt" size={24} />
          </span>
          <h1>Receipts Express</h1>
          <span className="express-arrow">
            <Icon name="express-arrow" size={26} />
          </span>
        </div>
        <button className="icon-btn menu-btn" aria-label="Menu" onClick={() => setMenuOpen(true)}>
          <Icon name="menu" size={22} />
        </button>
      </header>

      {menuOpen && (
        <div className="drawer-backdrop" onClick={() => setMenuOpen(false)}>
          <aside className="drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h2>Menu</h2>
              <button className="icon-btn" aria-label="Close menu" onClick={() => setMenuOpen(false)}>
                <Icon name="close" />
              </button>
            </div>

            <section className="drawer-section">
              <h3>About</h3>
              <p>
                Receipts Express scans your receipts with on-device OCR, organizes them into expense
                reports, and exports polished PDFs.
              </p>
              <p>
                Everything stays on your device — receipts and reports are stored locally and are
                never uploaded anywhere. Use the Backup card on the home screen to keep an
                off-device copy.
              </p>
              <p className="muted">Version 1.0.0</p>
            </section>

            <footer className="drawer-footer">
              Assembled by Jordan WT Campbell with Claude Code
            </footer>
          </aside>
        </div>
      )}

      <main className="content">
        {summaries === null ? (
          <p className="muted center">Loading…</p>
        ) : summaries.length === 0 && !creating ? (
          <div className="empty-state">
            <div className="empty-icon">
              <Icon name="receipt" size={52} />
            </div>
            <h2>No reports yet</h2>
            <p className="muted">Create a report, then scan receipts into it.</p>
          </div>
        ) : (
          <ul className="report-list">
            {summaries.map(({ report, count, totalDisplay }) => (
              <li key={report.id} className="report-card" onClick={() => onOpenReport(report.id)}>
                <div className="report-card-main">
                  <h3>{report.name}</h3>
                  <p className="muted">
                    {count} expense{count === 1 ? '' : 's'}
                  </p>
                </div>
                <div className="report-card-side">
                  <span className="report-total">{totalDisplay}</span>
                  <button
                    className="icon-btn danger"
                    aria-label={`Delete ${report.name}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      void removeReport(report.id, report.name)
                    }}
                  >
                    <Icon name="trash" size={18} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {summaries !== null && (() => {
          void backupTick // re-read localStorage after each backup
          const hasData = summaries.some((s) => s.count > 0)
          const last = lastBackupAt()
          const stale = hasData && backupIsStale()
          return (
            <section className={`backup-card${stale ? ' stale' : ''}`}>
              <div className="backup-info">
                <h3>
                  {stale && <Icon name="warning" size={16} />}
                  {stale ? 'Back up your receipts' : 'Backup'}
                </h3>
                <p className="muted">
                  {backupNote ??
                    (last
                      ? `Last backup ${new Date(last).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
                      : hasData
                        ? 'Never backed up — save a copy of your data'
                        : 'Backs up all reports and receipt photos to a file')}
                </p>
              </div>
              <div className="backup-actions">
                <button className="btn primary small" onClick={() => void doBackup()} disabled={backupBusy}>
                  {backupBusy ? 'Working…' : 'Back up now'}
                </button>
                <button className="btn ghost small" onClick={() => restoreInput.current?.click()} disabled={backupBusy}>
                  Restore
                </button>
              </div>
              <input
                ref={restoreInput}
                type="file"
                accept="application/json,.json"
                hidden
                onChange={(e) => void doRestore(e.target.files?.[0])}
              />
            </section>
          )
        })()}

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
