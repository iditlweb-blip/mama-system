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
  { week: 6,  until: 10, name: 'בדיקות דם ראשונות',
    explanation: 'סדרת בדיקות דם בתחילת ההריון שבודקת שהכל תקין - אישור ההריון, סוג הדם, ספירת דם ותפקוד בלוטת התריס. הבדיקות הראשונות שמלוות אותך לאורך כל הדרך.' },
  { week: 10, until: 13, name: 'בדיקת שקיפות עורפית',
    explanation: 'בדיקת אולטרסאונד קצרה שמודדת את העורף של העובר, יחד עם בדיקת דם. ביחד הן עוזרות להעריך את הסיכון לתסמונת דאון. בדרך כלל עושים אותה בשבועות 11-13.' },
  { week: 11, until: 13, name: 'בדיקת סיסי שליה',
    explanation: 'בדיקה גנטית מדויקת שבה לוקחים דגימה קטנה מהשליה. לא כל אישה עושה אותה - מוצעת בעיקר כשיש חשד לסיכון מוגבר.' },
  { week: 12, until: 14, name: 'בדיקת סקר משולבת',
    explanation: 'בדיקת דם שמשלימה את בדיקת השקיפות העורפית, וביחד הן נותנות תמונה מלאה יותר של הסיכון לתסמונת דאון ולמומים מסוימים.' },
  { week: 16, until: 20, name: 'בדיקת מי שפיר',
    explanation: 'בדיקה גנטית מקיפה שבה לוקחים מעט מי שפיר בעזרת מחט דקה. לא בדיקה שגרתית - מוצעת בעיקר אם בדיקת הסקר הראתה סיכון מוגבר או לפי גיל.' },
  { week: 19, until: 24, name: 'סקירת מערכות מפורטת',
    explanation: 'בדיקת אולטרסאונד יסודית שבודקת שכל האיברים של העובר מתפתחים כמו שצריך - הלב, המוח, הכליות, עמוד השדרה ועוד. אחת הבדיקות החשובות ביותר בהריון.' },
  { week: 24, until: 28, name: 'בדיקת סוכר בהריון',
    explanation: 'שותים תמיסת סוכר ובודקים איך הגוף מגיב אליה, כדי לוודא שאין סוכרת הריון.' },
  { week: 28, until: 30, name: 'בדיקת דם ונוגדנים',
    explanation: 'בדיקת דם חוזרת שכוללת גם בדיקת נוגדנים. אם סוג הדם שלך שלילי (Rh-), תקבלי בשלב הזה זריקה שמגנה על ההריון הזה ועל הריונות עתידיים.' },
  { week: 32, until: 34, name: 'אקו גדילה',
    explanation: 'בדיקת אולטרסאונד שבודקת שהעובר גדל בקצב תקין, כמה מי שפיר יש, ואיפה השליה נמצאת.' },
  { week: 36, until: 37, name: 'בדיקת GBS',
    explanation: 'בדיקה פשוטה ולא כואבת (מריחה) שבודקת נשאות של חיידק נפוץ בשם GBS. אם יימצא, פשוט תקבלי אנטיביוטיקה בזמן הלידה כדי להגן על התינוק - זה שכיח מאוד ולא מדאיג.' },
  { week: 38, until: 40, name: 'מוניטור',
    explanation: 'בדיקה נוחה ולא פולשנית שבה מחברים רצועה לבטן ובודקים את הדופק של העובר ואת הצירים, כדי לוודא שהכל תקין לקראת הלידה.' },
  { week: 40, until: 42, name: 'ביקור אחרון לפני הלידה',
    explanation: 'ביקור סיכום שבו בודקים את המצב, מתאמים את ההמשך, ומקבלים הנחיות מתי לגשת לבית החולים.' },
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
