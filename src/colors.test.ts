import { describe, expect, it } from 'vitest'
import { dayColor, contrastText, rgbToCss, HEADER_GRADIENT_A, HEADER_GRADIENT_B } from './colors'

describe('dayColor', () => {
  it('starts at the header gradient\'s first color for Day 1', () => {
    expect(dayColor(1)).toEqual(HEADER_GRADIENT_A)
  })

  it('reaches the header gradient\'s second color at the last step', () => {
    // The palette cycles every 6 days (see DAY_COLOR_STEPS in colors.ts).
    expect(dayColor(6)).toEqual(HEADER_GRADIENT_B)
  })

  it('gives every day in the cycle a distinct color', () => {
    const colors = [1, 2, 3, 4, 5, 6].map((d) => dayColor(d).join(','))
    expect(new Set(colors).size).toBe(6)
  })

  it('cycles back to Day 1\'s color after the palette length', () => {
    expect(dayColor(7)).toEqual(dayColor(1))
    expect(dayColor(12)).toEqual(dayColor(6))
  })
})

describe('contrastText', () => {
  it('picks white text for a dark background', () => {
    expect(contrastText([0, 0, 0])).toEqual([255, 255, 255])
  })

  it('picks black text for a light background', () => {
    expect(contrastText([255, 255, 255])).toEqual([0, 0, 0])
  })

  it('picks white for the purple gradient endpoint', () => {
    expect(contrastText(HEADER_GRADIENT_A)).toEqual([255, 255, 255])
  })

  it('picks black for the orange gradient endpoint (white contrasts too weakly there)', () => {
    expect(contrastText(HEADER_GRADIENT_B)).toEqual([0, 0, 0])
  })

  it('gives every color in the day cycle at least 4.5:1 contrast with its chosen text color', () => {
    function relativeLuminance([r, g, b]: [number, number, number]): number {
      const ch = (c: number) => {
        const s = c / 255
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
      }
      return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b)
    }
    function contrastRatio(a: number, b: number): number {
      const hi = Math.max(a, b)
      const lo = Math.min(a, b)
      return (hi + 0.05) / (lo + 0.05)
    }
    for (let day = 1; day <= 6; day++) {
      const bg = dayColor(day)
      const fg = contrastText(bg)
      const ratio = contrastRatio(relativeLuminance(bg), relativeLuminance(fg))
      expect(ratio).toBeGreaterThanOrEqual(4.5)
    }
  })
})

describe('rgbToCss', () => {
  it('formats an RGB tuple as a CSS rgb() string', () => {
    expect(rgbToCss([102, 0, 153])).toBe('rgb(102, 0, 153)')
  })
})
