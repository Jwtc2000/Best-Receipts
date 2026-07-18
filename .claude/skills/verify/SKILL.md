---
name: verify
description: Build, run and drive Best Receipts end-to-end in headless Chromium
---

# Verifying Best Receipts

Best Receipts is a client-only React PWA (Vite). Surface = browser GUI.

## Build & serve

```bash
npm install          # also needed once for @tesseract.js-data/eng
npm run build        # prebuild copies OCR engine into public/tesseract/
npm run preview -- --port 4173 --strictPort   # serves dist/, run in background
```

## Drive with Playwright

Install `playwright-core` in a scratch dir and launch the pre-installed
Chromium at `/opt/pw-browsers/chromium-1194/chrome-linux/chrome` with
`--no-sandbox`. A 420x850 viewport approximates a phone.

Flows worth driving:
- Create report (`.fab` → `.new-report-form input` → primary button)
- Add expense with image: click `.capture-buttons .capture-btn:nth-child(2)`,
  satisfy the `filechooser` event with a receipt PNG. Wait for
  `.scan-banner.success` (OCR takes ~10-20s first run) and assert the
  title/merchant/amount/date inputs got prefilled.
- Reorder via `.expense-actions` arrow buttons; order persists to IndexedDB.
- Export PDF: `.topbar .btn.primary` fires a `download` event.
- Move between reports via the ⇄ button → `.move-picker`.

## Gotchas

- **No URL routing**: after `page.reload()` the app is back on the reports
  list — click a `.report-card` to re-enter a report.
- OCR is self-hosted; if it fails with a jsdelivr/CDN error, the
  `prebuild` copy step didn't run or `public/tesseract/` is missing.
- A synthetic receipt renders fine for OCR: HTML with `Courier New` at
  ~22px, screenshotted at 480px wide via headless_shell `--screenshot`.
- To eyeball the exported PDF: `pdftoppm` is unavailable; render pages
  with `pdfjs-dist@4.10.38` (newer needs APIs this Chromium lacks) in a
  Playwright page served over `python3 -m http.server`.
