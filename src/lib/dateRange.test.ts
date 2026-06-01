import { describe, it, expect } from 'vitest'
import { getTimezoneOffsetMs, getDayWindowUtc, isWithinDayWindow } from './dateRange'

describe('getTimezoneOffsetMs', () => {
  it('returns +8h for Asia/Shanghai (no DST)', () => {
    const off = getTimezoneOffsetMs('Asia/Shanghai', new Date('2026-06-02T08:00:00Z'))
    expect(off).toBe(8 * 60 * 60 * 1000)
  })

  it('returns 0 for UTC', () => {
    const off = getTimezoneOffsetMs('UTC', new Date('2026-06-02T08:00:00Z'))
    expect(off).toBe(0)
  })

  it('returns a negative offset for America/New_York', () => {
    // EDT in June = -4h
    const off = getTimezoneOffsetMs('America/New_York', new Date('2026-06-02T08:00:00Z'))
    expect(off).toBe(-4 * 60 * 60 * 1000)
  })
})

describe('getDayWindowUtc — Asia/Shanghai (the original bug)', () => {
  // "now" = 2026-06-02 16:30 Shanghai = 2026-06-02T08:30:00Z
  const now = new Date('2026-06-02T08:30:00Z')

  it('uses the correct local calendar date', () => {
    expect(getDayWindowUtc('Asia/Shanghai', now).localDate).toBe('2026-06-02')
  })

  it('maps the local day to the exact UTC window', () => {
    const win = getDayWindowUtc('Asia/Shanghai', now)
    expect(win.startUtc).toBe('2026-06-01T16:00:00.000Z')
    expect(win.endUtc).toBe('2026-06-02T15:59:59.999Z')
  })

  it('REGRESSION: an afternoon feeding (16:00 Shanghai) is inside today', () => {
    // 16:00 Shanghai on 2026-06-02 = 08:00Z. The old double-offset bug pushed
    // the window so this fell OUT of "today" and the record "vanished".
    const win = getDayWindowUtc('Asia/Shanghai', now)
    const afternoonFeeding = '2026-06-02T08:00:00.000Z'
    expect(isWithinDayWindow(afternoonFeeding, win)).toBe(true)
  })

  it('a feeding at 00:01 Shanghai is inside today', () => {
    const win = getDayWindowUtc('Asia/Shanghai', now)
    const justAfterMidnight = '2026-06-01T16:01:00.000Z' // 00:01 Shanghai 06-02
    expect(isWithinDayWindow(justAfterMidnight, win)).toBe(true)
  })

  it('a feeding at 23:59 Shanghai is inside today', () => {
    const win = getDayWindowUtc('Asia/Shanghai', now)
    const lateNight = '2026-06-02T15:59:00.000Z' // 23:59 Shanghai 06-02
    expect(isWithinDayWindow(lateNight, win)).toBe(true)
  })

  it('yesterday 23:59 Shanghai is OUTSIDE today', () => {
    const win = getDayWindowUtc('Asia/Shanghai', now)
    const yesterday = '2026-06-01T15:59:00.000Z' // 23:59 Shanghai 06-01
    expect(isWithinDayWindow(yesterday, win)).toBe(false)
  })

  it('tomorrow 00:00 Shanghai is OUTSIDE today', () => {
    const win = getDayWindowUtc('Asia/Shanghai', now)
    const tomorrow = '2026-06-02T16:00:00.000Z' // 00:00 Shanghai 06-03
    expect(isWithinDayWindow(tomorrow, win)).toBe(false)
  })
})

describe('getDayWindowUtc — window is exactly 24h minus 1ms', () => {
  it('spans 86_399_999 ms', () => {
    const win = getDayWindowUtc('Asia/Shanghai', new Date('2026-06-02T08:30:00Z'))
    const span = new Date(win.endUtc).getTime() - new Date(win.startUtc).getTime()
    expect(span).toBe(24 * 60 * 60 * 1000 - 1)
  })
})

describe('getDayWindowUtc — UTC timezone', () => {
  it('window equals the calendar day', () => {
    const win = getDayWindowUtc('UTC', new Date('2026-06-02T12:00:00Z'))
    expect(win.localDate).toBe('2026-06-02')
    expect(win.startUtc).toBe('2026-06-02T00:00:00.000Z')
    expect(win.endUtc).toBe('2026-06-02T23:59:59.999Z')
  })
})

describe('getDayWindowUtc — America/New_York (negative offset)', () => {
  // 2026-06-02 20:00 EDT = 2026-06-03T00:00:00Z. Local date is still 06-02.
  const now = new Date('2026-06-03T00:00:00Z')

  it('uses local date 2026-06-02 even though UTC is already 06-03', () => {
    expect(getDayWindowUtc('America/New_York', now).localDate).toBe('2026-06-02')
  })

  it('maps the local day to the correct UTC window (EDT = -4h)', () => {
    const win = getDayWindowUtc('America/New_York', now)
    expect(win.startUtc).toBe('2026-06-02T04:00:00.000Z')
    expect(win.endUtc).toBe('2026-06-03T03:59:59.999Z')
  })

  it('a 20:00 EDT feeding (00:00Z next day) is still inside today', () => {
    const win = getDayWindowUtc('America/New_York', now)
    expect(isWithinDayWindow('2026-06-03T00:00:00.000Z', win)).toBe(true)
  })
})
