/**
 * Tests for getRankSuffix and formatKuwaitTime from src/lib/utils.ts
 */
import { describe, it, expect } from 'vitest'
import { getRankSuffix, formatKuwaitTime } from '@/lib/utils'

// ── getRankSuffix ──

describe('getRankSuffix', () => {
  it('1 → "st"', () => {
    expect(getRankSuffix(1)).toBe('st')
  })

  it('2 → "nd"', () => {
    expect(getRankSuffix(2)).toBe('nd')
  })

  it('3 → "rd"', () => {
    expect(getRankSuffix(3)).toBe('rd')
  })

  it('4 → "th"', () => {
    expect(getRankSuffix(4)).toBe('th')
  })

  it('11 → "th"', () => {
    expect(getRankSuffix(11)).toBe('th')
  })

  it('21 → "th" (implementation returns th for all > 3)', () => {
    expect(getRankSuffix(21)).toBe('th')
  })

  it('12 → "th"', () => {
    expect(getRankSuffix(12)).toBe('th')
  })

  it('13 → "th"', () => {
    expect(getRankSuffix(13)).toBe('th')
  })

  it('22 → "th" (implementation returns th for all > 3)', () => {
    expect(getRankSuffix(22)).toBe('th')
  })

  it('100 → "th"', () => {
    expect(getRankSuffix(100)).toBe('th')
  })
})

// ── formatKuwaitTime ──

describe('formatKuwaitTime', () => {
  // A fixed UTC time: 2024-06-14T15:00:00.000Z
  // Kuwait is UTC+3, so this becomes 18:00 local (6:00 PM)
  const utcDate = '2024-06-14T15:00:00.000Z'

  it('"time" format returns HH:MM AM/PM string', () => {
    const result = formatKuwaitTime(utcDate, 'time')
    // Should be 06:00 PM in Kuwait time
    expect(result).toMatch(/\d{1,2}:\d{2}\s?(AM|PM)/i)
  })

  it('"time" format reflects Kuwait UTC+3 offset (15:00 UTC → 06:00 PM)', () => {
    const result = formatKuwaitTime(utcDate, 'time')
    expect(result).toMatch(/06:00\s?PM/i)
  })

  it('"date" format returns month + day + year string', () => {
    const result = formatKuwaitTime(utcDate, 'date')
    // e.g. "Jun 14, 2024"
    expect(result).toMatch(/\w+\s+\d+,\s+\d{4}/)
  })

  it('"date" format includes the correct day (14th in Kuwait time)', () => {
    const result = formatKuwaitTime(utcDate, 'date')
    expect(result).toContain('14')
  })

  it('"date" format includes month abbreviation', () => {
    const result = formatKuwaitTime(utcDate, 'date')
    expect(result).toMatch(/Jun/i)
  })

  it('"datetime" format (default) includes both date and time components', () => {
    const result = formatKuwaitTime(utcDate)
    expect(result).toMatch(/\d{1,2}:\d{2}\s?(AM|PM)/i)
    expect(result).toContain('14')
  })

  it('midnight UTC (00:00) is 03:00 AM in Kuwait', () => {
    const midnight = '2024-06-14T00:00:00.000Z'
    const result = formatKuwaitTime(midnight, 'time')
    expect(result).toMatch(/03:00\s?AM/i)
  })

  it('9:00 PM UTC is 12:00 AM next day in Kuwait', () => {
    const lateUTC = '2024-06-14T21:00:00.000Z'
    const result = formatKuwaitTime(lateUTC, 'time')
    expect(result).toMatch(/12:00\s?AM/i)
  })
})
