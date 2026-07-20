import { describe, expect, it } from 'vitest'
import { build } from 'vite'
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const pkg = JSON.parse(
  readFileSync(fileURLToPath(new URL('../package.json', import.meta.url)), 'utf-8'),
)

function readAllFiles(dir: string): string {
  let out = ''
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    out += statSync(full).isDirectory() ? readAllFiles(full) : readFileSync(full, 'utf-8')
  }
  return out
}

describe('app version wiring', () => {
  // package.json's version is the single source of truth (vite.config.ts injects
  // it as __APP_VERSION__ into the bundle, and About renders it). Building for
  // real and asserting the exact string lands in the output means any future
  // severing of that wire — a hardcoded literal, a dropped define — fails CI.
  it('the production build inlines the exact package.json version', async () => {
    const outDir = mkdtempSync(join(tmpdir(), 'version-build-'))
    try {
      await build({ logLevel: 'silent', build: { outDir, emptyOutDir: true } })
      const bundle = readAllFiles(outDir)
      expect(bundle).toContain(pkg.version)
    } finally {
      rmSync(outDir, { recursive: true, force: true })
    }
  }, 30_000)
})
