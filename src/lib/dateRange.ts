// Pure, dependency-free date helpers for computing "today" in a target timezone.
//
// These were extracted from getTodayFeedings so the logic can be unit-tested
// without touching Supabase. The original bug: the timezone offset was applied
// twice (once implicitly by the browser when parsing a "Z"-less datetime string,
// once explicitly), which shifted the window by the offset and made afternoon
// records in +8 timezones fall outside "today".

/**
 * Milliseconds to add to a UTC instant to get wall-clock time in `timezone`.
 * For Asia/Shanghai this is +8h = 28_800_000. Negative for the Americas.
 *
 * Both sides are formatted with toLocaleString and re-parsed in the runtime's
 * local zone, so the runtime offset cancels out and only the target-vs-UTC
 * delta remains.
 */
export function getTimezoneOffsetMs(timezone: string, at: Date = new Date()): number {
  const utcStr = at.toLocaleString('en-US', { timeZone: 'UTC' })
  const tzStr = at.toLocaleString('en-US', { timeZone: timezone })
  return new Date(tzStr).getTime() - new Date(utcStr).getTime()
}

export type DayWindow = {
  /** Local calendar date as YYYY-MM-DD, e.g. "2026-06-02". */
  localDate: string
  /** Inclusive start of the local day, as a UTC ISO string. */
  startUtc: string
  /** Inclusive end of the local day (23:59:59.999 local), as a UTC ISO string. */
  endUtc: string
}

/**
 * Compute the UTC range [startUtc, endUtc] that corresponds to a full local
 * calendar day in the given timezone.
 *
 * Pass `localDate` (YYYY-MM-DD) to query a specific day; omit to use today.
 *
 * Correct behaviour, locked by unit tests:
 *  - Asia/Shanghai 2026-06-02 → 2026-06-01T16:00:00.000Z .. 2026-06-02T15:59:59.999Z
 *  - A feeding logged at 16:00 Shanghai (08:00Z) MUST fall inside the window.
 */
export function getDayWindowUtc(timezone: string, now: Date = new Date(), localDate?: string): DayWindow {
  if (!localDate) {
    localDate = new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(now)
  }
  const tzOffset = getTimezoneOffsetMs(timezone, now)
  // Anchor local midnight in UTC (note the "Z"), then shift back by the offset
  // exactly once to get the matching UTC instant.
  const midnightUtc = new Date(`${localDate}T00:00:00Z`).getTime()
  const startMs = midnightUtc - tzOffset
  const endMs = startMs + 24 * 60 * 60 * 1000 - 1
  return {
    localDate: localDate!,
    startUtc: new Date(startMs).toISOString(),
    endUtc: new Date(endMs).toISOString(),
  }
}

/** Get today's local date string (YYYY-MM-DD) in the given timezone. */
export function getTodayLocalDate(timezone: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(new Date())
}

/** Move a local date string (YYYY-MM-DD) by `days` (positive = forward, negative = back). */
export function shiftLocalDate(localDate: string, days: number): string {
  const d = new Date(`${localDate}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/** True if a UTC ISO timestamp falls within the local day window. */
export function isWithinDayWindow(tsUtc: string, win: DayWindow): boolean {
  const t = new Date(tsUtc).getTime()
  return t >= new Date(win.startUtc).getTime() && t <= new Date(win.endUtc).getTime()
}
