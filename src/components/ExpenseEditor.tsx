import { useEffect, useRef, useState } from 'react'
import type { Expense } from '../types'
import { CATEGORIES, newId } from '../types'
import { getExpense, saveExpense, saveImage, getImage, deleteImage, nextPosition } from '../db'
import { compressImage } from '../image'
import { extractReceipt } from '../ocr'
import Icon from './icons'

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
}

const emptyDraft: Draft = {
  title: '',
  merchant: '',
  amount: '',
  currency: 'USD',
  date: new Date().toISOString().slice(0, 10),
  category: 'Other',
  notes: '',
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

  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }))

  const onImagePicked = async (file: File | undefined) => {
    if (!file) return
    const compressed = await compressImage(file)
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
      setScanState('failed')
    }
  }

  const save = async () => {
    const amount = parseFloat(draft.amount)
    if (isNaN(amount)) return
    setSaving(true)
    try {
      let imageId = existing?.imageId
      if (imageChanged && imageBlob) {
        if (imageId) await deleteImage(imageId)
        imageId = newId()
        await saveImage({ id: imageId, blob: imageBlob })
      }
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
      }
      await saveExpense(expense)
      onDone()
    } finally {
      setSaving(false)
    }
  }

  const canSave = !isNaN(parseFloat(draft.amount)) && (draft.title.trim() || draft.merchant.trim())

  return (
    <>
      <header className="topbar">
        <button className="icon-btn" onClick={onDone} aria-label="Back">
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
          onChange={(e) => void onImagePicked(e.target.files?.[0])}
        />
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => void onImagePicked(e.target.files?.[0])}
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
