import { useEffect, useState } from 'react'
import { listReports } from '../db'

const SNOOZE_KEY = 'br.storageWarningDismissedAt'
const SNOOZE_MS = 14 * 24 * 60 * 60 * 1000

function isInstalled(): boolean {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    // iOS Safari exposes standalone here rather than via display-mode
    (navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

function snoozed(): boolean {
  const at = localStorage.getItem(SNOOZE_KEY)
  return at !== null && Date.now() - Number(at) < SNOOZE_MS
}

/**
 * Receipts Express keeps everything in IndexedDB with no server copy. On a
 * non-installed browser tab — Safari/iOS especially — that storage is *best
 * effort*: navigator.storage.persist() commonly returns false, and WebKit's
 * ITP evicts all site data after ~7 days without a visit. The existing
 * stale-backup card nudges backups on a timer; this banner is the missing
 * eviction-specific, install-prompting warning: it appears only when storage
 * is genuinely not persistent AND the user has data to lose.
 */
export default function StorageWarning() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!navigator.storage?.persist) return
    let cancelled = false
    void (async () => {
      // Always ask for durable storage; the browser grants it silently when it
      // will (installed PWAs usually get it). We only *warn* when it's still not
      // persistent, the app isn't installed, the user hasn't snoozed, and there
      // is data to lose.
      const granted = await navigator.storage.persist()
      if (granted || cancelled || isInstalled() || snoozed()) return
      const reports = await listReports()
      if (!cancelled && reports.length > 0) setShow(true)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (!show) return null

  const dismiss = () => {
    localStorage.setItem(SNOOZE_KEY, String(Date.now()))
    setShow(false)
  }

  return (
    <div className="storage-warning" role="alert">
      <div className="storage-warning-body">
        <strong>This browser may erase your receipts.</strong>
        <p>
          Storage here isn't guaranteed — on iPhone, Safari can clear it after about a
          week of not opening the app, with no server copy to restore from. Add Receipts
          Express to your Home Screen and back up regularly to keep your data safe.
        </p>
      </div>
      <button type="button" className="btn ghost small" onClick={dismiss}>
        Got it
      </button>
    </div>
  )
}
