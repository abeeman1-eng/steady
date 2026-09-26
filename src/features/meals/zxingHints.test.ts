import { BinaryBitmap, DecodeHintType, HybridBinarizer, MultiFormatReader, RGBLuminanceSource } from '@zxing/library'
import { describe, expect, it } from 'vitest'
import { zxingHints } from './zxingHints'

// Standard EAN/UPC module patterns ("1" = dark), used to draw test barcodes.
const L = ['0001101', '0011001', '0010011', '0111101', '0100011', '0110001', '0101111', '0111011', '0110111', '0001011']
const R = L.map((p) => [...p].map((b) => (b === '1' ? '0' : '1')).join(''))
const G = R.map((p) => [...p].reverse().join(''))
const EAN13_PARITY = ['LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG', 'LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGLGL']
const QUIET = '0'.repeat(11)

function ean13Modules(code: string): string {
  const d = [...code].map(Number)
  const left = d.slice(1, 7).map((n, i) => (EAN13_PARITY[d[0]][i] === 'L' ? L : G)[n]).join('')
  const right = d.slice(7).map((n) => R[n]).join('')
  return `${QUIET}101${left}01010${right}101${QUIET}`
}


/**
 * Simulates a poor webcam frame: a barcode only `moduleWidth` pixels per bar, horizontally
 * blurred (out of focus), low contrast and noisy, in the middle of a 1280×720 frame.
 */
function webcamFrame(modules: string, { moduleWidth = 2, blur = 2, contrast = 0.45, noise = 30, seed = 1 } = {}) {
  const W = 1280
  const H = 720
  const bars: number[] = []
  for (const m of modules) for (let r = 0; r < moduleWidth; r++) bars.push(m === '1' ? 1 : 0)
  // Box blur along the row.
  const blurred = bars.map((_, i) => {
    let sum = 0
    let n = 0
    for (let k = -blur; k <= blur; k++) {
      if (bars[i + k] === undefined) continue
      sum += bars[i + k]
      n++
    }
    return sum / n
  })
  let rand = seed
  const next = () => ((rand = (rand * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff)
  const lum = new Uint8ClampedArray(W * H)
  const x0 = Math.floor((W - blurred.length) / 2)
  const [y0, y1] = [H / 2 - 60, H / 2 + 60]
  const mid = 140
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const inBar = y >= y0 && y < y1 && x >= x0 && x < x0 + blurred.length
      const dark = inBar ? blurred[x - x0] : 0
      lum[y * W + x] = mid + (0.5 - dark) * 255 * contrast + (next() - 0.5) * noise
    }
  }
  return new BinaryBitmap(new HybridBinarizer(new RGBLuminanceSource(lum, W, H)))
}

function decode(bitmap: BinaryBitmap, hints: Map<DecodeHintType, unknown>): string | null {
  const reader = new MultiFormatReader()
  reader.setHints(hints)
  try {
    return reader.decode(bitmap).getText()
  } catch {
    return null
  }
}


describe('ZXing decoding of webcam-quality frames', () => {
  const codes = ['3017624010701', '0012345678905', '5449000000996', '4006381333931']

  it('reads a clean EAN-13', () => {
    expect(decode(webcamFrame(ean13Modules('3017624010701'), { blur: 0, noise: 0, contrast: 1 }), zxingHints())).toBe('3017624010701')
  })

  // Why the scanner asks for HD: a barcode held far enough back for a laptop webcam to focus is
  // small, so at 640×480 each bar is ~2 px wide; at 1920×1080 the same barcode gets ~6 px.
  it('reads far more small, noisy barcodes at HD resolution than at VGA', () => {
    let vga = 0
    let hd = 0
    for (const code of codes) {
      for (const seed of [1, 2]) {
        if (decode(webcamFrame(ean13Modules(code), { moduleWidth: 2, blur: 1, contrast: 0.5, noise: 30, seed }), zxingHints()) === code) vga++
        if (decode(webcamFrame(ean13Modules(code), { moduleWidth: 6, blur: 1, contrast: 0.5, noise: 30, seed }), zxingHints()) === code) hd++
      }
    }
    expect(vga).toBe(0)
    expect(hd).toBeGreaterThanOrEqual(4)
  })
})
