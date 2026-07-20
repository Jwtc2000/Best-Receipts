# Receipts Express Pilot Presentation

This markdown file represents the content of the interactive slide deck designed for co-workers who want to participate in the departmental pilot of **Receipts Express**. 

> [!TIP]
> You can also view the interactive, fully animated version of this slide deck directly in your browser by opening [docs/pilot-deck.html](./pilot-deck.html).

---

## Slide 1: Cover

### Receipts Express
**Standardized Receipt-to-PDF Capture**

* **Progressive Web App (Offline-First)**: Runs locally on any device.
* **Private by Design**: No servers, no accounts, zero data sharing.

---

## Slide 2: The Core Challenge

### The Challenge with Expense Capture
*Why traditional reporting causes friction and security risks*

#### 1. The Manual Burden
* Receipts accumulate loose in email inboxes, pockets, or camera rolls during business travel.
* Reconstructing dates, merchants, and totals weeks later leads to errors and delayed filing.
* No quick way to export polished compilations for downstream travel systems.

#### 2. The Privacy Trap
* Common free scanner apps contain third-party ad-tracking toolkits.
* Sensitive financial data (merchant locations, items purchased, card fractions) gets uploaded to unvetted cloud systems.
* Lack of structural boundaries leaves personal and corporate data vulnerable to exfiltration.

---

## Slide 3: The Solution

### Enter Receipts Express
*A fast, private utility running entirely on your device*

#### Key Pilot Features:
* **On-Device OCR**: [Tesseract.js](https://tesseract.projectnaptha.com/) scans receipts and extracts fields locally. No external APIs, no cloud processing.
* **Reports Manager**: Create, name, and drag-and-drop receipts to reorder. Group expenses easily by business trip.
* **Secure Storage**: Data stays safely in your local browser sandbox ([IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)). Zero servers are involved.
* **Local PDF Export**: Generates a comprehensive trip summary followed by full-page receipt images.

---

## Slide 4: Governance & AI-Efficiency

### Governance & Guidelines
*Inspiration and alignment with corporate frameworks*

Receipts Express's pilot governance structure is formatted after the **AI Pilot Program Template** from the FedEx AI Efficiency Hub. 

* **Inspiration Source**: [arigatoexpress/AI-Efficiency](https://github.com/arigatoexpress/AI-Efficiency) (FedEx AI Efficiency Hub). We credit their checklist for establishing the risk-review format we apply to this pilot proposal.
* **Why this matters**: Applying a standardized governance checklist upfront ensures privacy compliance, legal clarity, and clear risk mitigation strategies before introducing utility tools to departmental workflows.

#### Governance Checklist Snapshot:
| Field | Value / Response |
| --- | --- |
| **Data Classification** | Confidential (Receipts contain real personal/financial data) |
| **AI Engine Location** | On-Device Only (Self-hosted Tesseract.js WASM engine) |
| **Data Egress Control** | Enforced by Content-Security-Policy (`connect-src 'self'`) |
| **Human-in-the-Loop** | Active (User must verify and edit OCR drafts before saving) |

---

## Slide 5: PWA Installation Guide

### Install on Your Device
*Install as a Progressive Web App (PWA) in seconds*

Running the web app as an installed PWA grants it **persistent storage protection**, signaling to the mobile OS to protect database files from automatic eviction.

#### 📱 iOS (Safari)
1. Open the app link in Safari.
2. Tap the **Share** button `📤` in the browser toolbar.
3. Scroll down and select **Add to Home Screen** `➕`.

#### 🤖 Android (Chrome)
1. Open the app link in Chrome.
2. Tap the **Menu** icon `⠇` (three vertical dots).
3. Select **Install app** `📥`.

#### 🖥️ Desktop (Chrome / Edge / Safari)
1. Open the app link in Chrome or Edge.
2. Click the **Install icon** inside the right side of the address bar.
3. Alternatively, select **Install Receipts Express** from the browser's settings menu.

---

## Slide 6: Backup Architecture & Risks

### Backup Architecture & Risks
*Understanding browser storage lifecycle and durability*

#### Storage Eviction Risk
Since all receipts and images are stored locally in the browser database (IndexedDB) with no cloud backup, they are subject to **data loss** if:
* The device runs critically low on disk space.
* The user manually clears browser cache, cookies, and website data.
* The OS automatically purges browser caches to free up system space.

#### In-App Backup Dashboard
Receipts Express includes local backup controls to bundle all database records & base64 images into a single `.json` file:
* **The Stale Warning**: The app displays a warning card on the home screen if data goes unbacked-up for more than **7 days**.
* **One-Click Export**: Click **Back up now** to package the database and trigger the browser download/native share sheet.

---

## Slide 7: Backup Recommendations

### Backup Recommendations
*Best practices for pilot participants to safeguard data*

To ensure zero loss of receipt data while piloting the web application, participants must adhere to the following backup guidelines:

1. **Save JSON Backups Externally**: When clicking "Back up now", the app generates a single `.json` file containing all data. **Recommendation:** Save this file directly into corporate/secured network storage (such as OneDrive, Google Drive, iCloud, or SharePoint) under an `Expenses-Backup` folder.
2. **Backup Frequency Rule**: Always export a fresh backup after scanning new receipts on a trip. Do not ignore the in-app "Backup stale" warning. Treat Receipts Express as a **capture utility, not a long-term archive**. Export the final expense report PDF promptly.
3. **Cross-Device Restore**: If you upgrade your phone or switch browsers, export a backup JSON from your old device and click **Restore from file** on the new device to seamlessly merge all your reports, receipts, and images.

---

## Slide 8: Pilot Next Steps & Safety Guidelines

### Pilot Next Steps
*How to get started and contribute safely*

#### Safe Real-Trip Demo Guidelines:
* [ ] **Use Production URL Only**: Always run the pilot via the live HTTPS link. Never scan real corporate receipts in local dev mode (where the Content-Security-Policy is bypassed for hot reloading).
* [ ] **Policy Compliance Window**: Since reports must be filed by the Wednesday following a trip, scan receipts as they happen, export the complete PDF/CSV on the final day of travel, upload it, and then clear the data from the PWA.
* [ ] **Minimize Storage Duration**: Adhering to the Wednesday deadline ensures corporate financial data lives in the local browser database (IndexedDB) for less than 10 days, minimizing security exposure.
* [ ] **Daily Cloud Backups**: Export a JSON backup file to corporate OneDrive or Google Drive daily during travel. This prevents data loss in case the browser clears site caches.
* [ ] **Verify and Report**: Cross-check OCR data values against the physical receipts and log formatting suggestions.
