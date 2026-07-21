import { useEffect, useState } from 'react'

/**
 * Last-resort safety net for writes that fail without their own error UI.
 * Many persistence calls in the app are fired as `void save…()` — a rejection
 * (e.g. QuotaExceededError from IndexedDB) otherwise surfaces nowhere and the
 * user is left believing an edit persisted when it didn't. This listens for
 * unhandled promise rejections and shows a dismissible banner, so a silent
 * write failure at least becomes visible.
 */
export default function GlobalErrorToast() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout>
    const onRejection = () => {
      setVisible(true)
      clearTimeout(hideTimer)
      hideTimer = setTimeout(() => setVisible(false), 8000)
    }
    window.addEventListener('unhandledrejection', onRejection)
    return () => {
      window.removeEventListener('unhandledrejection', onRejection)
      clearTimeout(hideTimer)
    }
  }, [])

  if (!visible) return null

  return (
    <div className="error-toast" role="alert">
      <span>Something went wrong — your last change may not have been saved.</span>
      <button
        type="button"
        className="btn ghost small"
        onClick={() => setVisible(false)}
        aria-label="Dismiss"
      >
        Dismiss
      </button>
    </div>
  )
}
