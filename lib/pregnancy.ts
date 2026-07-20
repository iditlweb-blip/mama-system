// Shared pregnancy helpers used by the pregnancy tracker, the dashboard
// (pregnancy mode) and the weekly-development page.

export interface StandardTest {
  week: number
  name: string
}

// Standard pregnancy tests by week (Israeli routine schedule).
export const STANDARD_TESTS: StandardTest[] = [
  { week: 6,  name: 'בדיקת דם ראשונה (HCG, TSH, ספירת דם)' },
  { week: 10, name: 'בדיקת שקיפות עורפית' },
  { week: 11, name: 'בדיקת סיסי שליה (CVS)' },
  { week: 12, name: 'בדיקת טרי-טסט / ביוכימיה' },
  { week: 16, name: 'בדיקת מי שפיר (אמניוצנטזה)' },
  { week: 19, name: 'אקו מורפולוגי מפורט' },
  { week: 24, name: 'העמסת סוכר (OGTT)' },
  { week: 28, name: 'בדיקת GBS + אנטיגלובולין' },
  { week: 32, name: 'אקו גדילה' },
  { week: 36, name: 'בדיקה וגינלית, תרבית GBS' },
  { week: 38, name: 'NST (מוניטור)' },
  { week: 40, name: 'ביקור אחרון + תיאום לידה' },
]

// Current pregnancy week from the due date (clamped to 1–42).
export function calcPregnancyWeek(dueDate: string | null | undefined): number {
  if (!dueDate) return 0
  const due = new Date(dueDate)
  const now = new Date()
  const daysLeft = Math.round((due.getTime() - now.getTime()) / 86400000)
  const weeksPregnant = Math.round(40 - daysLeft / 7)
  return Math.max(1, Math.min(42, weeksPregnant))
}

// The next few standard tests due from the current week onward.
export function upcomingTests(currentWeek: number, count = 3): StandardTest[] {
  const from = Math.max(0, currentWeek - 1)
  return STANDARD_TESTS.filter(t => t.week >= from).slice(0, count)
}
