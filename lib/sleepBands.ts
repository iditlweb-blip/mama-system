// Minimal, server-safe copy of the age→nap-length table used by the tracker
// page (app/(app)/tracker/TrackerClient.tsx). Deliberately duplicated rather
// than imported: the full table lives in a large 'use client' component built
// for the on-screen sleep guidance, and this only needs one number (the upper
// end of the recommended nap length) for the "this nap is running long" push
// check. Keep the maxWeeks/napLenLabel values in sync if the tracker's table
// changes.
const NAP_LENGTH_MAP: { maxWeeks: number; napLenLabel: string }[] = [
  { maxWeeks: 12,   napLenLabel: '1-2 ש’' },      // 0-3 months
  { maxWeeks: 22,   napLenLabel: '½ ש’ - 2 ש’' },  // 3-5 months
  { maxWeeks: 26,   napLenLabel: '½ ש’ - 2 ש’' },  // 5-6 months
  { maxWeeks: 35,   napLenLabel: '1-2 ש’' },       // 6-8 months
  { maxWeeks: 43,   napLenLabel: '1-2 ש’' },       // 8-10 months
  { maxWeeks: 52,   napLenLabel: '1-2 ש’' },       // 10-12 months
  { maxWeeks: 78,   napLenLabel: '1-2½ ש’' },      // 12-18 months
  { maxWeeks: 104,  napLenLabel: '1-2 ש’' },       // 18-24 months
  { maxWeeks: 9999, napLenLabel: '1-2 ש’' },       // 24-36 months
]

// "1-2½ ש'" / "½ ש' - 2 ש'" → upper bound in minutes (2.5h → 150, 2h → 120).
function upperHoursToMinutes(label: string): number {
  const nums = label.replace(/½/g, '.5').match(/\d+(\.\d+)?/g)
  if (!nums || nums.length === 0) return 120
  return Math.round(Math.max(...nums.map(Number)) * 60)
}

export function ageInWeeks(birthdate: string | null | undefined): number | null {
  if (!birthdate) return null
  const ms = Date.now() - new Date(birthdate).getTime()
  if (Number.isNaN(ms) || ms < 0) return null
  return Math.floor(ms / (7 * 86400000))
}

// Upper bound of a "normal" nap for this age, in minutes. A running timer past
// this is a candidate for the "still asleep - want to wake her/him?" push.
export function napMaxMinutes(weeks: number): number {
  const row = NAP_LENGTH_MAP.find(r => weeks <= r.maxWeeks) ?? NAP_LENGTH_MAP[NAP_LENGTH_MAP.length - 1]
  return upperHoursToMinutes(row.napLenLabel)
}
