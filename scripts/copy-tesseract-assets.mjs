// Copies the Tesseract OCR engine (worker, WASM cores, English language
// data) from node_modules into public/tesseract so the app is fully
// self-hosted — no CDN calls at runtime.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dest = path.join(root, 'public', 'tesseract')
fs.mkdirSync(dest, { recursive: true })

const copies = [
  ['node_modules/tesseract.js/dist/worker.min.js', 'worker.min.js'],
  ['node_modules/@tesseract.js-data/eng/4.0.0/eng.traineddata.gz', 'eng.traineddata.gz'],
]
for (const variant of ['', '-simd', '-lstm', '-simd-lstm']) {
  copies.push([
    `node_modules/tesseract.js-core/tesseract-core${variant}.wasm.js`,
    `tesseract-core${variant}.wasm.js`,
  ])
  copies.push([
    `node_modules/tesseract.js-core/tesseract-core${variant}.wasm`,
    `tesseract-core${variant}.wasm`,
  ])
}

for (const [from, to] of copies) {
  fs.copyFileSync(path.join(root, from), path.join(dest, to))
}
console.log(`Copied ${copies.length} Tesseract assets to public/tesseract/`)
