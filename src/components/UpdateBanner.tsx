import { useEffect, useRef, useState } from 'react'
import { registerSW } from 'virtual:pwa-register'

// registerType is 'prompt' (see vite.config.ts) precisely so this banner can
// exist: a new version never swaps in under a user mid-scan or mid-export —
// it waits until they choose to reload.
export default function UpdateBanner() {
  const [needsRefresh, setNeedsRefresh] = useState(false)
  const [reloading, setReloading] = useState(false)
  const updateRef = useRef<((reload?: boolean) => Promise<void>) | null>(null)

  useEffect(() => {
    updateRef.current = registerSW({
      immediate: true,
      onNeedRefresh: () => setNeedsRefresh(true)
    })
  }, [])

  if (!needsRefresh) return null

  return (
    <div className="update-banner">
      <span>A new version is ready.</span>
      <button
        type="button"
        className="btn primary small"
        disabled={reloading}
        onClick={() => {
          setReloading(true)
          updateRef.current?.(true)
        }}
      >
        {reloading ? 'Updating…' : 'Refresh'}
      </button>
    </div>
  )
}
