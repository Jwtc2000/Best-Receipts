import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// package.json's "version" is the single source of truth for the app's
// version — bump it there (semver) and it flows into the build and the
// in-app About menu automatically.
const pkg = JSON.parse(readFileSync(fileURLToPath(new URL('./package.json', import.meta.url)), 'utf-8'))

export default defineConfig({
  // GitHub Pages serves a project site from /<repo>/ — the deploy workflow
  // sets BASE_PATH from the repo name; local dev/build stays at the root.
  base: process.env.BASE_PATH ?? '/',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon.svg'],
      manifest: {
        name: 'Receipts Express',
        short_name: 'Receipts Express',
        description: 'Scan receipts, organize expense reports, export polished PDFs.',
        theme_color: '#0f766e',
        background_color: '#f8fafc',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        // OCR engine files are large, so they're cached on first use
        // instead of being precached (see runtimeCaching below)
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        globIgnores: ['tesseract/**'],
        runtimeCaching: [
          {
            urlPattern: /\/tesseract\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'tesseract-engine',
              expiration: { maxEntries: 12 }
            }
          }
        ]
      }
    })
  ]
})
