import { useEffect, useRef, useState } from 'react'
import type { Expense } from '../types'
import { CATEGORIES, newId } from '../types'
import { getExpense, saveExpenseWithImage, getImage, nextPosition } from '../db'
import { compressImage } from '../image'
import { extractReceipt } from '../ocr'
import Icon from './icons'
import { HeaderPlanes } from './decorative'

interface Props {
  reportId: string
  expenseId?: string
  onDone: () => void
}

interface Draft {
  title: string
  merchant: string
  amount: string
  currency: string
  date: string
  category: string
  notes: string
  personalAmount: string
}

const emptyDraft: Draft = {
  title: '',
  merchant: '',
  amount: '',
  currency: 'USD',
  date: new Date().toISOString().slice(0, 10),
  category: 'Other',
  notes: '',
  personalAmount: '',
}

export default function ExpenseEditor({ reportId, expenseId, onDone }: Props) {
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [existing, setExisting] = useState<Expense | null>(null)
  const [imageBlob, setImageBlob] = useState<Blob | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imageChanged, setImageChanged] = useState(false)
  const [scanState, setScanState] = useState<'idle' | 'scanning' | 'done' | 'failed'>('idle')
  const [scanPct, setScanPct] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [captureError, setCaptureError] = useState<string | null>(null)
  // True once the user has typed a field or attached/removed a photo — i.e. there
  // is unsaved work that Back / tab-close / a service-worker reload would discard.
  const [dirty, setDirty] = useState(false)
  const cameraInput = useRef<HTMLInputElement>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!expenseId) return
    void (async () => {
      const expense = await getExpense(expenseId)
      if (!expense) return
      setExisting(expense)
      setDraft({
        title: expense.title,
        merchant: expense.merchant,
        amount: expense.amount ? String(expense.amount) : '',
        currency: expense.currency,
        date: expense.date,
        category: expense.category,
        notes: expense.notes,
        personalAmount: expense.personalAmount ? String(expense.personalAmount) : '',
      })
      if (expense.imageId) {
        const img = await getImage(expense.imageId)
        if (img) {
          setImageBlob(img.blob)
          setImageUrl(URL.createObjectURL(img.blob))
        }
      }
    })()
  }, [expenseId])

  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl)
    }
  }, [imageUrl])

  // Warn the browser before it unloads (tab close, refresh, PWA back-gesture, or
  // the service-worker update reload) while there's an unsaved draft — otherwise
  // the typed fields and captured photo are gone with no confirmation.
  useEffect(() => {
    if (!dirty) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])

  const set = (patch: Partial<Draft>) => {
    setDirty(true)
    setDraft((d) => ({ ...d, ...patch }))
  }

  const onImagePicked = async (file: File | undefined) => {
    if (!file) return
    setCaptureError(null)
    // Compression can genuinely fail (an unsupported format like HEIC on some
    // browsers, a corrupt file, or canvas.toBlob returning null). Without this
    // catch the rejection was swallowed by the `void onImagePicked(...)` caller
    // and the freshly captured photo vanished with no message.
    let compressed: Blob
    try {
      compressed = await compressImage(file)
    } catch {
      setCaptureError("Couldn't process that photo — try again, or pick a different image.")
      return
    }
    setDirty(true)
    setImageBlob(compressed)
    setImageChanged(true)
    setImageUrl((old) => {
      if (old) URL.revokeObjectURL(old)
      return URL.createObjectURL(compressed)
    })

    // Auto-extract details with on-device OCR
    setScanState('scanning')
    setScanPct(0)
    try {
      const extracted = await extractReceipt(compressed, setScanPct)
      setDraft((d) => ({
        ...d,
        merchant: extracted.merchant ?? d.merchant,
        title: d.title || extracted.merchant || '',
        amount: extracted.total !== undefined ? extracted.total.toFixed(2) : d.amount,
        date: extracted.date ?? d.date,
      }))
      setScanState('done')
    } catch {
      // The photo is already attached; OCR failing just means manual entry.
      setScanState('failed')
    }
  }

  const removeImage = () => {
    setDirty(true)
    setImageBlob(null)
    setImageChanged(true)
    setImageUrl((old) => {
      if (old) URL.revokeObjectURL(old)
      return null
    })
    setScanState('idle')
  }

  const handleBack = () => {
    if (dirty && !window.confirm('Discard this expense? Your typed details and photo will be lost.')) {
      return
    }
    onDone()
  }

  const save = async () => {
    const amount = parseFloat(draft.amount)
    if (isNaN(amount)) return
    setSaving(true)
    setSaveError(null)
    try {
      const previousImageId = existing?.imageId
      // Three cases: untouched (keep imageId as-is); replaced with a new
      // blob (new imageId, old one deleted); removed entirely (imageId
      // cleared, old one deleted). imageChanged with a null blob means the
      // user explicitly removed the photo, not that nothing changed.
      let imageId = previousImageId
      let newImage: { id: string; blob: Blob } | undefined
      let staleImageId: string | undefined
      if (imageChanged) {
        staleImageId = previousImageId
        if (imageBlob) {
          imageId = newId()
          newImage = { id: imageId, blob: imageBlob }
        } else {
          imageId = undefined
        }
      }
      // Clamped to [0, amount] — the personal portion can't exceed the
      // expense's total or go negative.
      const personalAmount = Math.min(amount, Math.max(0, parseFloat(draft.personalAmount) || 0))
      const expense: Expense = {
        id: existing?.id ?? newId(),
        reportId: existing?.reportId ?? reportId,
        position: existing?.position ?? (await nextPosition(reportId)),
        title: draft.title.trim() || draft.merchant.trim(),
        merchant: draft.merchant.trim(),
        amount,
        currency: draft.currency.trim().toUpperCase() || 'USD',
        date: draft.date,
        category: draft.category,
        notes: draft.notes.trim(),
        imageId,
        createdAt: existing?.createdAt ?? Date.now(),
        personalAmount,
      }
      await saveExpenseWithImage(expense, newImage, staleImageId)
      setDirty(false)
      onDone()
    } catch (err) {
      // The write failed (most commonly QuotaExceededError on a near-full
      // device, where an IndexedDB transaction aborts). Keep the editor open
      // with the draft intact and tell the user, instead of silently returning
      // to a state that looks like a successful save.
      setSaveError(
        (err as DOMException)?.name === 'QuotaExceededError'
          ? "Couldn't save — this device's storage is full. Free up space, or remove the photo and try again."
          : "Couldn't save — something went wrong. Your details are still here; please try again.",
      )
    } finally {
      setSaving(false)
    }
  }

  const canSave = !isNaN(parseFloat(draft.amount)) && (draft.title.trim() || draft.merchant.trim())

  return (
    <>
      <header className="topbar">
        <HeaderPlanes />
        <button className="icon-btn" onClick={handleBack} aria-label="Back">
          <Icon name="chevron-left" size={22} />
        </button>
        <h1>{expenseId ? 'Edit Expense' : 'New Expense'}</h1>
        <button className="btn primary small" onClick={() => void save()} disabled={!canSave || saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </header>

      <main className="content editor">
        <input
          ref={cameraInput}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0]
            // Clear the value so re-picking the *same* file (e.g. after a failed
            // capture) still fires onChange instead of silently doing nothing.
            e.target.value = ''
            void onImagePicked(file)
          }}
        />
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            void onImagePicked(file)
          }}
        />

        {imageUrl ? (
          <div className="receipt-preview">
            <img src={imageUrl} alt="Receipt" />
            <div className="preview-actions">
              <button className="btn ghost small with-icon" onClick={() => cameraInput.current?.click()}>
                <Icon name="camera" size={16} /> Retake
              </button>
              <button className="btn ghost small with-icon" onClick={() => fileInput.current?.click()}>
                <Icon name="image" size={16} /> Replace
              </button>
              <button className="btn ghost small with-icon" onClick={removeImage}>
                <Icon name="trash" size={16} /> Remove
              </button>
            </div>
          </div>
        ) : (
          <div className="capture-buttons">
            <button className="capture-btn" onClick={() => cameraInput.current?.click()}>
              <span className="capture-icon">
                <Icon name="camera" size={32} />
              </span>
              Scan with camera
            </button>
            <button className="capture-btn" onClick={() => fileInput.current?.click()}>
              <span className="capture-icon">
                <Icon name="image" size={32} />
              </span>
              Choose photo
            </button>
          </div>
        )}

        {scanState === 'scanning' && (
          <div className="scan-banner">
            <div className="spinner" />
            Reading receipt… {scanPct}%
          </div>
        )}
        {scanState === 'done' && (
          <div className="scan-banner success">Details extracted — review and adjust below</div>
        )}
        {scanState === 'failed' && (
          <div className="scan-banner warn">Couldn't read the receipt — enter details manually</div>
        )}
        {captureError && (
          <div className="scan-banner warn" role="alert">{captureError}</div>
        )}
        {saveError && (
          <div className="scan-banner warn" role="alert">{saveError}</div>
        )}

        <div className="field-grid">
          <label className="field span-2">
            <span>Title</span>
            <input
              placeholder="e.g. Team lunch"
              value={draft.title}
              onChange={(e) => set({ title: e.target.value })}
            />
          </label>
          <label className="field span-2">
            <span>Merchant</span>
            <input
              placeholder="e.g. Joe's Diner"
              value={draft.merchant}
              onChange={(e) => set({ merchant: e.target.value })}
            />
          </label>
          <label className="field">
            <span>Amount</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={draft.amount}
              onChange={(e) => set({ amount: e.target.value })}
            />
          </label>
          <label className="field">
            <span>Currency</span>
            <input
              maxLength={3}
              placeholder="USD"
              value={draft.currency}
              onChange={(e) => set({ currency: e.target.value.toUpperCase() })}
            />
          </label>
          <label className="field span-2">
            <span>Personal amount (pay back to company)</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              max={draft.amount || undefined}
              placeholder="0.00"
              value={draft.personalAmount}
              onChange={(e) => set({ personalAmount: e.target.value })}
            />
          </label>
          <label className="field">
            <span>Date</span>
            <input type="date" value={draft.date} onChange={(e) => set({ date: e.target.value })} />
          </label>
          <label className="field">
            <span>Category</span>
            <select value={draft.category} onChange={(e) => set({ category: e.target.value })}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="field span-2">
            <span>Notes</span>
            <textarea
              rows={3}
              placeholder="Optional details for the report"
              value={draft.notes}
              onChange={(e) => set({ notes: e.target.value })}
            />
          </label>
        </div>
      </main>
    </>
  )
}
