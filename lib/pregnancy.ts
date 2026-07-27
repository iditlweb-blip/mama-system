// Shared pregnancy helpers used by the pregnancy tracker, the dashboard
// (pregnancy mode) and the weekly-development page.

export interface StandardTest {
  week: number         // recommended week to do the test
  until: number        // last week of the recommended window (drives reminders)
  name: string
  explanation: string  // plain, calm explanation of what the test is
}

// Standard pregnancy tests by week (Israeli routine schedule). Windows and
// explanations are general guidance - the exact timing is set by the treating
// doctor/midwife.
export const STANDARD_TESTS: StandardTest[] = [
  { week: 6,  until: 10, name: 'בדיקת דם ראשונה (HCG, TSH, ספירת דם)',
    explanation: 'בדיקות דם ראשוניות לתחילת ההריון: רמת HCG לאישוש ההריון, תפקודי בלוטת התריס (TSH), ספירת דם וסוג דם. אלו מהוות בסיס למעקב לאורך ההריון.' },
  { week: 10, until: 13, name: 'בדיקת שקיפות עורפית',
    explanation: 'סקירת אולטרסאונד המודדת את עובי העורף של העובר, יחד עם בדיקת דם, להערכת סיכון לתסמונות כרומוזומליות. מתבצעת לרוב בשבועות 11-13.' },
  { week: 11, until: 13, name: 'בדיקת סיסי שליה (CVS)',
    explanation: 'דגימת רקמה מהשליה לבדיקה גנטית מדויקת. מוצעת בעיקר כשקיים סיכון מוגבר - אינה בדיקה שגרתית לכל אישה.' },
  { week: 12, until: 14, name: 'בדיקת טרי-טסט / ביוכימיה',
    explanation: 'בדיקת דם ביוכימית שמשולבת עם השקיפות העורפית להערכת סיכון לתסמונת דאון ולמומים. חלק מסקר הטרימסטר הראשון.' },
  { week: 16, until: 20, name: 'בדיקת מי שפיר (אמניוצנטזה)',
    explanation: 'דיקור עדין לשאיבת מעט מי שפיר לבדיקה גנטית מקיפה. מוצעת בעיקר כשהסקר מצביע על סיכון או לפי גיל - אינה שגרתית.' },
  { week: 19, until: 24, name: 'אקו מורפולוגי מפורט',
    explanation: 'סקירת מערכות מפורטת שבודקת את מבנה האיברים של העובר: לב, מוח, כליות, עמוד שדרה ועוד. מהבדיקות החשובות בהריון.' },
  { week: 24, until: 28, name: 'העמסת סוכר (OGTT)',
    explanation: 'בדיקה לאיתור סוכרת הריון: שותים תמיסת סוכר ובודקים את רמת הסוכר בדם לאורך זמן.' },
  { week: 28, until: 30, name: 'בדיקת GBS + אנטיגלובולין',
    explanation: 'ספירת דם חוזרת ובדיקת נוגדנים. לנשים עם סוג דם Rh שלילי ניתנת זריקת אנטי-D להגנה על ההריון.' },
  { week: 32, until: 34, name: 'אקו גדילה',
    explanation: 'אולטרסאונד להערכת קצב הגדילה של העובר, כמות מי השפיר ומיקום השליה לקראת הלידה.' },
  { week: 36, until: 37, name: 'בדיקה וגינלית, תרבית GBS',
    explanation: 'תרבית לנשאות חיידק GBS (סטרפטוקוק מקבוצה B) ובדיקה לקראת הלידה, כדי להיערך למתן אנטיביוטיקה בלידה במידת הצורך.' },
  { week: 38, until: 40, name: 'NST (מוניטור)',
    explanation: 'מעקב אחר דופק העובר והצירים, כדי לוודא שהעובר מרגיש טוב לקראת הלידה.' },
  { week: 40, until: 42, name: 'ביקור אחרון + תיאום לידה',
    explanation: 'ביקור סיכום לקראת הלידה: בדיקת מצב, תיאום המשך והנחיות לגבי מתי לגשת לבית החולים.' },
]

// Precise gestational age from the due date, as completed weeks + extra days
// (the obstetric "34+2" convention). The due date is 40+0; we count backwards
// in whole days and FLOOR the weeks — never round up — so week 34 + 2 days
// reads as "34+2", not "35". Clamped to 1+0 .. 42+0.
export function calcGestationalAge(dueDate: string | null | undefined): { week: number; days: number } {
  if (!dueDate) return { week: 0, days: 0 }
  const due = new Date(dueDate)
  const now = new Date()
  const daysLeft = Math.round((due.getTime() - now.getTime()) / 86400000)
  const totalDays = 280 - daysLeft // 280 = 40 weeks to the due date
  const clamped = Math.max(7, Math.min(294, totalDays))
  return { week: Math.floor(clamped / 7), days: clamped % 7 }
}

// Current pregnancy week as a whole number (floored) — used for the fetal-week
// lookup, the test schedule and size-by-week. For display prefer
// formatGestational(), which also shows the extra days.
export function calcPregnancyWeek(dueDate: string | null | undefined): number {
  return calcGestationalAge(dueDate).week
}

// Display string: "34+2" (or just "34" on an exact week boundary). Empty when
// there's no due date yet.
export function formatGestational(dueDate: string | null | undefined): string {
  const { week, days } = calcGestationalAge(dueDate)
  if (week <= 0) return ''
  return days > 0 ? `${week}+${days}` : `${week}`
}

// The next few standard tests due from the current week onward.
export function upcomingTests(currentWeek: number, count = 3): StandardTest[] {
  const from = Math.max(0, currentWeek - 1)
  return STANDARD_TESTS.filter(t => t.week >= from).slice(0, count)
}

// Whole weeks left until the due date (0 once week 40 is reached).
export function weeksRemaining(currentWeek: number): number {
  return Math.max(0, 40 - currentWeek)
}

// Fruit-size-per-week, as a plain name + emoji so it can be shown anywhere
// (dashboard, tracker) without pulling in icon components.
const BABY_SIZE_TABLE: Record<number, { name: string; emoji: string }> = {
  6:  { name: 'גרגיר אפון', emoji: '🫛' },
  8:  { name: 'פטל',        emoji: '🫐' },
  10: { name: 'תות',        emoji: '🍓' },
  12: { name: 'ליים',       emoji: '🟢' },
  14: { name: 'תפוח',       emoji: '🍎' },
  16: { name: 'אגס',        emoji: '🍐' },
  18: { name: 'מנגו',       emoji: '🥭' },
  20: { name: 'בננה',       emoji: '🍌' },
  22: { name: 'פפאיה',      emoji: '🫐' },
  24: { name: 'תירס',       emoji: '🌽' },
  26: { name: 'בצל',        emoji: '🧅' },
  28: { name: 'ברוקולי',     emoji: '🥦' },
  30: { name: 'כרוב',       emoji: '🥬' },
  32: { name: 'קוקוס',      emoji: '🥥' },
  34: { name: 'כרובית',     emoji: '🥬' },
  36: { name: 'אבוקדו',     emoji: '🥑' },
  38: { name: 'אבטיח קטן',  emoji: '🍈' },
  40: { name: 'תינוק!',     emoji: '👶' },
}

// The baby's size for the given week (rounds down to the nearest listed week).
export function babySizeForWeek(week: number): { name: string; emoji: string } | null {
  if (week <= 0) return null
  const keys = Object.keys(BABY_SIZE_TABLE).map(Number).sort((a, b) => b - a)
  for (const k of keys) if (week >= k) return BABY_SIZE_TABLE[k]
  return null
}
