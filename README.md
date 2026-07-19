# Receipts Express

[![Build, test, and deploy](https://github.com/Jwtc2000/Receipts-Express/actions/workflows/deploy.yml/badge.svg)](https://github.com/Jwtc2000/Receipts-Express/actions/workflows/deploy.yml)

Scan receipts, organize expense reports, and export polished PDFs — all in your browser, all on your device.

Receipts Express is a **Progressive Web App (PWA)**: it runs on iOS, Android, and desktop from a single codebase, can be installed to your home screen like a native app, and keeps working offline. No accounts, no servers — every receipt stays on your device.

---

## Welcome to GitHub

If you are new here, you might be wondering where you have landed. Here is a simple guide to what this page is and the tools we use:

* **What is GitHub?**: GitHub is a secure, cloud-based filing cabinet (code hosting platform) where developers store, share, and collaborate on software projects. You are currently looking at the main web interface for this project.
* **What is a Repository (Repo)?**: A repository is a project folder containing all the code files, assets, documentation, and the complete history of every change ever made to the project.
* **What is Git?**: Git is the underlying system (version control system) running behind the scenes. Think of it as a time machine for files. It takes snapshots of the project as it changes, allowing developers to track changes, see who made them, and revert to older versions if something breaks.
* **What is a Branch?**: A branch is an isolated playground (development sandbox). Developers create a branch to edit files or add features without messing up the working, live version of the software. Once the changes are tested, they are merged back into the main branch (the `main` line of code).
* **What is a Pull Request (PR)?**: A pull request is a request to merge changes from a separate branch into the main branch. It is a digital meeting room where other developers review the new code, discuss edits, and approve them before they are officially merged.
* **What is CI/CD (Continuous Integration/Continuous Deployment)?**: Think of this as an automated quality inspector. Every time a developer submits changes (a pull request), automatic scripts run to verify that the app still compiles, all automated tests pass, and no security issues exist before allowing the code to be merged.

---

## Why This Exists

Expense reports get filed late because filing them is tedious: receipts pile up loose — paper or camera-roll photos — until the trip is over, and then someone has to sit down and reconstruct merchants, dates, and totals from a stack of faded thermal paper. Receipts Express is built to make that fast and frictionless enough that reports actually get filed on time: scan each receipt as you go, organize them into a report as the trip happens, and export one polished PDF at the end, ready to hand to whatever fiscal or expense system your organization uses. That's the goal the app is designed around.

---

## The Problem with the Alternatives

Most free receipt-scanner apps are ad-supported products. Their advertising toolkits (ad SDKs) are third-party code with their own data-sharing arrangements, they're known for showing intrusive or misleading ads, and the personal financial data flowing through them — receipts, which often carry partial card numbers and reveal exactly where and when you traveled — passes through servers (external cloud infrastructure) nobody outside the vendor has ever independently vetted. That's a bad trade for data this sensitive.

---

## Features

* <img src="./assets/camera.svg" width="18" height="18" align="center" /> **Scan receipts with your camera** (or upload a photo). On-device text recognition (Tesseract.js OCR) automatically extracts the merchant, date, and total — you just review and adjust.
* <img src="./assets/reports.svg" width="18" height="18" align="center" /> **Multiple expense reports**, each with its own timeline of expenses.
* <img src="./assets/reorder.svg" width="18" height="18" align="center" /> **Reorganize freely** — drag expenses to reorder them on the timeline (or use the arrow buttons on mobile), and move expenses between reports.
* <img src="./assets/pdf.svg" width="18" height="18" align="center" /> **One-tap PDF export** — a summary page listing every expense with the grand total, followed by a full page for each receipt image with its title and details below.
* <img src="./assets/lock.svg" width="18" height="18" align="center" /> **Private by design** — everything is stored in your browser's secure sandbox database (IndexedDB). Nothing leaves your device.

---

## Security Posture

Every claim below is something you can verify by reading this repository, not something you have to take on faith:

* **On-device-only processing and storage.** See [SECURITY.md](./SECURITY.md) for the full data classification.
* **No exfiltration, enforced by a Content-Security-Policy (CSP)** — not just promised. `connect-src 'self'` means the browser itself blocks any script from reaching any network destination other than this app's own origin, regardless of what a compromised dependency might try. [`src/csp.test.ts`](./src/csp.test.ts) asserts every production build carries the policy.
* **Self-hosted text recognition (OCR).** Tesseract.js's engine, WebAssembly (WASM) core, and language data are bundled and served from this app's own origin — it never calls an external content delivery network (CDN).
* **Dual Continuous Integration (CI).** GitHub Actions runs typecheck, tests, and a blocking security vulnerability audit (`npm audit`); a separate Jenkins pipeline runs secrets scanning (gitleaks) and static application security testing (SAST via semgrep) on its own agent infrastructure. See [ci/README.md](./ci/README.md).
* **SHA-pinned supply chain.** Every GitHub Action is pinned to a full commit cryptographic hash (SHA) rather than a mutable tag, with Dependabot on a 7-day cooldown before it proposes an update.
* **Branch protection on `main`**, requiring both CI systems to pass before anything merges.
* **[Apache-2.0](./LICENSE)** license.

---

## How It Works Under the Hood

| Component | Technology | Layman's Explanation |
| --- | --- | --- |
| **User Interface (UI)** | React 18 + TypeScript + Vite | **React** handles rendering the screens and components; **TypeScript** is a programming language that catches bugs early by checking code types; **Vite** is a packager (build tool) that compiles files for the web. |
| **Receipt OCR** | Tesseract.js (runs fully in-browser) | An offline engine that runs in-browser to transcribe text out of pictures using **WebAssembly (WASM)**, which lets native binary code run fast in the browser. |
| **Storage** | IndexedDB via `idb` | A secure local database inside your browser that holds reports, expenses, and receipt images. |
| **PDF Export** | jsPDF | A library that packages receipt details and images into a PDF file entirely on your machine. |
| **Offline Support** | `vite-plugin-pwa` service worker + manifest | Technology that allows the app to be installed onto your home screen and run offline without an internet connection (**Progressive Web App**). |

The text recognition engine (worker, WASM core, English language data) is **self-hosted**: the build process copies it from the program's library folder (`node_modules`) into the public distribution folder (`public/tesseract/`) automatically, so the app never calls a CDN and scanning works fully offline once the app has loaded.

---

## Getting Started

If you are a developer looking to run this project locally, execute the following commands in your command-line interface (terminal):

> [!WARNING]
> **Local Development CSP Bypass & Data Privacy**: 
> In local development mode (`npm run dev`), the Content-Security-Policy (CSP) is bypassed to allow hot-reloading (HMR) of styling files. Therefore, browser-level network exfiltration blocks are NOT active in development mode.
> 
> **Never load or scan real corporate/personal receipt data when running the app locally in development mode.** Always use mock/synthetic receipts for testing features locally. For end-to-end testing with real files, build and run the production package locally using `npm run build` and `npm run preview` (where the full CSP is active).

1. **Install dependencies**: Downloads all the external libraries the app needs to run.
   ```bash
   npm install
   ```
2. **Start local dev server**: Spins up a local web server so you can view and test the application in your browser.
   ```bash
   npm run dev
   ```
3. **Build production bundle**: Compiles and optimizes the app into a `dist/` directory ready to be deployed to any static host.
   ```bash
   npm run build
   ```
4. **Preview production build**: Serves the compiled production code locally to test it before deploying.
   ```bash
   npm run preview
   ```
5. **Typecheck code**: Runs TypeScript's compiler to verify there are no syntax or type errors.
   ```bash
   npm run typecheck
   ```
6. **Run tests**: Executes the test runner (Vitest) to verify that all code behaves correctly.
   ```bash
   npm test
   ```

Open the dev server URL on your phone (same network) or deploy `dist/` to any static host (Netlify, Vercel, GitHub Pages, …). **Camera access requires HTTPS** (or localhost), so use a proper host or a tunneling tool when testing on a phone.

---

## Install as an App

* **iOS (Safari):** Share → *Add to Home Screen*
* **Android (Chrome):** Menu → *Install app*

---

## Disclaimer & Data Guidance

This is a personal project, built and maintained independently. It has no affiliation with, endorsement from, or approval by FedEx, and it is not a production system operated by or for any organization.

By design, all receipt data — images, extracted text, and report contents — stays on your device (see [SECURITY.md](./SECURITY.md) for exactly how). Exported PDFs, once you save or share them, are your responsibility to handle according to your own organization's data-handling rules — this app has no visibility into, or control over, what happens to a file after it leaves the app.

## Versioning

The app's version lives in `package.json` (semver) and is shown in the app under Menu → About. See [CHANGELOG.md](./CHANGELOG.md) for release notes — bump the version there whenever a change lands on `main`.
