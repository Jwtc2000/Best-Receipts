import { describe, expect, it } from 'vitest'
import { build } from 'vite'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

describe('Content-Security-Policy', () => {
  it('the production build injects a CSP with connect-src \'self\'', async () => {
    const outDir = mkdtempSync(join(tmpdir(), 'csp-build-'))
    try {
      await build({ logLevel: 'silent', build: { outDir, emptyOutDir: true } })
      const html = readFileSync(join(outDir, 'index.html'), 'utf-8').replace(/&#39;/g, "'")
      expect(html).toMatch(/<meta\s+http-equiv="Content-Security-Policy"/)
      expect(html).toMatch(/connect-src 'self'/)
    } finally {
      rmSync(outDir, { recursive: true, force: true })
    }
  }, 30_000)
})
