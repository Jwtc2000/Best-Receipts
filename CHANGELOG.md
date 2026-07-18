# Changelog

All notable changes to this project are documented here.

Versioning follows [Semantic Versioning](https://semver.org/) (`MAJOR.MINOR.PATCH`):
bump `MAJOR` for breaking changes to stored data or backup format, `MINOR` for new
user-facing features, and `PATCH` for fixes with no visible feature change. The
version lives in `package.json` and is shown in the app under Menu → About.

## [1.6.0] - 2026-07-18

### Added
- Creating a report now asks for a trip start/end date (calendar picker),
  which anchors "Day 1" for that report's timeline and PDF export — Day N
  stays correct even if a day in the middle of the trip has no expenses.
- A menu (sandwich icon) on the report screen lets you view and change a
  report's trip dates at any time; all Day N labels update immediately.
- Expenses are now sorted by their date rather than by manual add/reorder
  order.
- Moving an expense up or down past the edge of its day now reassigns its
  date to the adjacent day, so the timeline and its date stay in sync.

### Fixed
- `nextPosition` assumed the expense list was sorted by position; now that
  it's sorted by date, it computes the actual highest position instead —
  otherwise two new expenses in the same report could have collided on
  the same position.

## [1.5.0] - 2026-07-18

### Added
- Multi-day trips now show a "Day 1", "Day 2", … divider bar in the
  report timeline, grouping expenses by calendar date (ranked
  chronologically regardless of manual reorder order) for easier
  visual scanning. The same Day N grouping now appears in the PDF
  export's summary table.

## [1.4.0] - 2026-07-18

### Added
- CSV export, alongside PDF: the "Export" button in a report now opens a
  menu to choose PDF or CSV. The CSV is a plain Date/Title/Merchant/
  Category/Amount/Currency/Notes table, one row per expense, that opens
  directly in Excel/Sheets/accounting tools.

## [1.3.0] - 2026-07-18

### Added
- A search box on the main reports screen finds expenses across every
  report by title, merchant, or amount, and jumps straight into the
  matching expense when tapped.
- A search box within a report filters that report's expense list the
  same way (title, merchant, amount), without changing the report's
  totals.

## [1.2.0] - 2026-07-18

### Added
- A Profile section in the menu (Name, Employee ID, Cost Center, Project
  Number) — all optional. Whatever's filled in now appears on the summary
  page of every PDF export; the layout is unchanged if nothing is set.

## [1.1.0] - 2026-07-18

### Added
- The app now shows its version number (Menu → About), sourced from `package.json`
  at build time — this changelog starts tracking releases from here on.

### Fixed
- Report/expense totals across mixed currencies were summed as raw numbers and
  labeled with whichever currency happened to be first; totals are now shown
  per currency, and currency codes that only differ by case (e.g. `USD`/`usd`)
  are merged instead of shown separately.
- Replacing a receipt photo deleted the old image before saving the new one;
  a failed write could lose the original permanently. The swap is now atomic.
- Backup restore wrote reports, expenses, and images one at a time and accepted
  arbitrary `dataUrl` values (including fetchable URLs), so a corrupt or hostile
  backup file could leave a partial restore, overwrite existing data, trigger
  outbound requests, or carry unbounded/malformed data. Restores are now fully
  validated (shape, embedded-image format, size limits, cross-referenced
  `reportId`s) before being committed in a single transaction.
- GitHub Pages deploys were triggered by pushes to a feature branch, not just
  `main`. Deploys are now limited to `main` (or an explicit manual run), gated
  behind a CI job that runs the type checker and test suite.
- Upgraded `jspdf` (`2.5.2` → `4.2.1`), clearing a critical CVE bundle and a
  transitive `dompurify` advisory.

### Added (internal)
- First automated test suite (Vitest): currency totals, OCR parsing, backup
  validation/atomicity, and atomic image replacement.

## [1.0.0] - 2026-07-18

Initial release: camera/photo receipt capture with on-device OCR (Tesseract.js),
multi-report expense organization with drag-to-reorder, one-tap PDF export,
local backup/restore, and installable offline PWA support. All data stored
on-device in IndexedDB — nothing leaves the device.
