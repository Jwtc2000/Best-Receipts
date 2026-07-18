# Receipts Express

Scan receipts, organize expense reports, and export polished PDFs — all in your browser, all on your device.

Receipts Express is a **Progressive Web App (PWA)**: it runs on iOS, Android, and desktop from a single codebase, can be installed to your home screen like a native app, and keeps working offline. No accounts, no servers — every receipt stays on your device.

## Features

- **📷 Scan receipts with your camera** (or upload a photo). On-device OCR (Tesseract.js) automatically extracts the merchant, date, and total — you just review and adjust.
- **📋 Multiple expense reports**, each with its own timeline of expenses.
- **↕️ Reorganize freely** — drag expenses to reorder them on the timeline (or use the arrow buttons on mobile), and move expenses between reports.
- **📄 One-tap PDF export** — a summary page listing every expense with the grand total, followed by a full page for each receipt image with its title and details below.
- **🔒 Private by design** — everything is stored in your browser's IndexedDB. Nothing leaves your device.

## Getting started

```bash
npm install
npm run dev        # local dev server
npm run build      # production build in dist/
npm run preview    # serve the production build
npm run typecheck  # tsc, no emit
npm test           # vitest
```

Open the dev server URL on your phone (same network) or deploy `dist/` to any static host (Netlify, Vercel, GitHub Pages, …). **Camera access requires HTTPS** (or localhost), so use a proper host or a tunneling tool when testing on a phone.

## Install as an app

- **iOS (Safari):** Share → *Add to Home Screen*
- **Android (Chrome):** Menu → *Install app*

## How it works

| Piece | Tech |
| --- | --- |
| UI | React 18 + TypeScript + Vite |
| Receipt OCR | Tesseract.js (runs fully in-browser) |
| Storage | IndexedDB via `idb` (reports, expenses, receipt images) |
| PDF export | jsPDF (summary page + one page per receipt) |
| Offline / installable | vite-plugin-pwa service worker + web manifest |

The OCR engine (worker, WASM core, English language data) is **self-hosted**: `npm run build`/`npm run dev` copy it from `node_modules` into `public/tesseract/` automatically, so the app never calls a CDN and scanning works fully offline once the app has loaded.

## Versioning

The app's version lives in `package.json` (semver) and is shown in the app under
Menu → About. See [CHANGELOG.md](./CHANGELOG.md) for release notes — bump the
version there whenever a change lands on `main`.
