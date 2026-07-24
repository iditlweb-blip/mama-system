'use client'

// Split out of TrackerClient.tsx and loaded via next/dynamic so its sizeable
// static Hebrew weaning-guide data (and the icons it references) aren't part
// of the initial JS bundle for users who land on the default "daily" tab.
import { useState } from 'react'
import {
  Sprout, AlertTriangle, CheckCircle2, Circle, PartyPopper, Calendar,
  ChevronDown, ChevronUp, Scale, Clock3, Clock, Soup, Ban, ChefHat,
  Apple, Carrot, Salad, LeafyGreen, Drumstick, Fish, Egg, Wheat, Banana,
} from 'lucide-react'

const WEANING_STAGES = [
  {
    fromWeek: 17, toWeek: 20,
    title: 'שלב ראשון — טעימות ראשונות',
    subtitle: '4–5 חודשים',
    icon: Carrot,
    quantity: '1–3 כפיות',
    frequency: 'פעם ביום',
    timing: 'אחרי האכלת חלב',
    texture: 'פירה חלק מאוד, דק עם חלב אם / מים',
    foods: ['בטטה', 'גזר', 'תפוח', 'אגס', 'קישוא', 'דלעת'],
    avoid: ['דבש', 'מלח', 'סוכר', 'בקר (חלבון)', 'ביצה'],
    allergens: [],
    recipes: [
      { name: 'פירה בטטה', icon: Carrot, steps: 'בשלי בטטה עד לריכוך, מעכי עם מים/חלב אם לפירה חלק.' },
      { name: 'פירה גזר', icon: Carrot, steps: 'בשלי גזר, הוסיפי קצת מים לפירה דליל.' },
      { name: 'פירה תפוח', icon: Apple, steps: 'אדי/בשלי תפוח, תמעכי. אפשר גם להגיש חי (מגורר דק מאוד).' },
    ],
  },
  {
    fromWeek: 21, toWeek: 26,
    title: 'שלב שני — הרחבת תפריט',
    subtitle: '5–6 חודשים',
    icon: Salad,
    quantity: '3–6 כפות',
    frequency: 'פעם–פעמיים ביום',
    timing: 'בין האכלות חלב',
    texture: 'פירה עם קצת גושים קטנים',
    foods: ['ברוקולי', 'אפונה', 'אבוקדו', 'בננה', 'אוכמניות', 'דגני בוקר (שיבולת שועל)'],
    avoid: ['דבש', 'מלח', 'אגוזים שלמים'],
    allergens: ['ניתן להתחיל גלוטן (שיבולת שועל/חיטה)'],
    recipes: [
      { name: 'אבוקדו+בננה', icon: LeafyGreen, steps: 'מעכי אבוקדו ובננה ביחד — לא צריך בישול!' },
      { name: 'ברוקולי מאודה', icon: Salad, steps: 'אדי ברוקולי 8 דק’, מעכי עם מים לפירה.' },
      { name: 'דייסת שיבולת שועל', icon: Soup, steps: 'שיבולת שועל + חלב אם/מים, בישול 3 דק’.' },
    ],
  },
  {
    fromWeek: 27, toWeek: 34,
    title: 'שלב שלישי — מרקמים ועשיר',
    subtitle: '6.5–8 חודשים',
    icon: Drumstick,
    quantity: '1/4–1/2 כוס לארוחה',
    frequency: '2–3 ארוחות ביום',
    timing: 'ארוחת בוקר, צהריים, ערב',
    texture: 'פירה גס, מרוסק, או אצבעות מזון רכות להאכלה עצמאית',
    foods: ['עוף מבושל', 'דג (סלמון/קרפיון)', 'עדשים', 'יוגורט', 'גבינה בולגרית'],
    avoid: ['דבש', 'מלח', 'סוכר', 'אוכל ים (שרימפס/לובסטר)', 'פטריות נא'],
    allergens: ['ביצה (חלמון קודם)', 'דגים (אחת בשבוע)', 'חלב מוצרים (לא חלב פרה נוזלי)'],
    recipes: [
      { name: 'עוף וירקות', icon: Drumstick, steps: 'בשלי עוף, גזר ותפוחי אדמה, ומרסקי לפירה. אפשר להניח גם גוש עוף רך לאחיזה עצמאית.' },
      { name: 'סלמון מאודה', icon: Fish, steps: 'אדי סלמון 10 דק’, פרקי לחתיכות קטנות. בדקי עצמות!' },
      { name: 'חביתה ביצה', icon: Egg, steps: 'חלמון+חלבון, מטגנת בכפית שמן זית, חתכי לרצועות.' },
    ],
  },
  {
    fromWeek: 35, toWeek: 52,
    title: 'שלב רביעי — אוכל משפחתי',
    subtitle: '8–12 חודשים',
    icon: Wheat,
    quantity: 'כ-150–200 מ"ל לארוחה',
    frequency: '3 ארוחות + 1–2 חטיפים',
    timing: 'תבנית ארוחות קבועה',
    texture: 'גושים רכים, אצבעות, אוכל "משפחתי" מרוסק',
    foods: ['פסטה', 'אורז', 'לחם רך', 'גבינות', 'כל ירק/פרי', 'קטניות'],
    avoid: ['דבש', 'מלח מוסף', 'סוכר', 'מרגרינה', 'אגוזים שלמים (סכנת חנק)'],
    allergens: ['ניתן כבר לאכול רוב האלרגנים — כולל אגוזי קשיו (טחונים)'],
    recipes: [
      { name: 'פסטה+ציר', icon: Wheat, steps: 'פסטה קצרה + ציר ירקות/עוף ביתי. ללא מלח.' },
      { name: 'עדשות+תרד', icon: Soup, steps: 'עדשות כתומות + תרד + גזר. בישול 20 דק’.' },
      { name: 'חטיף בננה+גבינה', icon: Banana, steps: 'פרוסות בננה + גבינת שמנת = חטיף מהיר.' },
    ],
  },
]

const READINESS_CHECKLIST = [
  { id: 'head', label: 'מחזיק/ת ראש זקוף ויושב/ת עם תמיכה', detail: 'צריך ליכולת לאכול בבטחה' },
  { id: 'interest', label: 'מראה עניין באוכל — מסתכל/ת, מושיט/ה יד', detail: 'סימן לבגרות' },
  { id: 'mouth', label: 'מכניס/ה דברים לפה', detail: 'כישור יסוד לאכילה' },
  { id: 'tongue', label: 'לא מוציא/ה אוכל מהפה מיד (ירידה רפלקס דחיפה)', detail: 'מוכנות פיזיולוגית' },
]

export default function WeaningTab({ babyWeeks, babyName, genderSuffix }: {
  babyWeeks: number | null; babyName: string | null; genderSuffix: string
}) {
  const [checkedItems, setCheckedItems] = useState<string[]>([])
  const [expandedStage, setExpandedStage] = useState<number | null>(null)
  const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null)
  // Once the readiness list is fully checked it collapses into a small "done"
  // accordion so it stops taking up space; tapping it re-opens the full list.
  const [checklistOpen, setChecklistOpen] = useState(false)

  const toggleCheck = (id: string) =>
    setCheckedItems(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const allChecked = READINESS_CHECKLIST.length === checkedItems.length
  const checklistCollapsed = allChecked && !checklistOpen

  // Find current stage
  const currentStage = babyWeeks !== null
    ? WEANING_STAGES.find(s => babyWeeks >= s.fromWeek && babyWeeks <= s.toWeek)
    : null

  const notReadyYet = babyWeeks !== null && babyWeeks < 14

  if (notReadyYet) {
    const weeksLeft = 14 - babyWeeks!
    return (
      <div className="card text-center py-10">
        <Sprout className="w-12 h-12 mx-auto mb-4" style={{ color: '#4A7C59' }} />
        <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text)' }}>עוד קצת זמן</h2>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {babyName || 'התינוק'} יהי{genderSuffix} מוכן{genderSuffix} לטעימות ראשונות בעוד כ-{weeksLeft} שבועות (בגיל 4 חודשים).
        </p>
      </div>
    )
  }

  if (babyWeeks === null) {
    return (
      <div className="card text-center py-8">
        <AlertTriangle className="w-8 h-8 mx-auto mb-3" style={{ color: '#B8860B' }} />
        <p className="font-medium mb-1" style={{ color: 'var(--text)' }}>תאריך לידה חסר</p>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          עדכני תאריך לידה בהגדרות כדי לראות את מדריך הטעימות המותאם.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Current stage banner */}
      {currentStage && (
        <div className="rounded-2xl p-4"
          style={{ background: 'rgba(127,82,104,0.08)', border: '1px solid rgba(127,82,104,0.15)' }}>
          <div className="flex items-center gap-3">
            <currentStage.icon className="w-8 h-8" style={{ color: '#7F5268' }} />
            <div>
              <p className="font-bold" style={{ color: 'var(--text)' }}>
                {babyName || 'התינוק'} נמצא{genderSuffix} כעת ב{currentStage.title}
              </p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                שבוע {babyWeeks} · {currentStage.subtitle}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Readiness checklist — collapses to a compact "done" row once complete */}
      {checklistCollapsed ? (
        <button onClick={() => setChecklistOpen(true)}
          className="card w-full flex items-center justify-between gap-2"
          style={{ background: 'rgba(74,124,89,0.08)', border: '1px solid rgba(74,124,89,0.2)' }}>
          <span className="text-sm font-semibold flex items-center gap-1.5" style={{ color: '#4A7C59' }}>
            <CheckCircle2 className="w-4 h-4" /> רשימת המוכנות הושלמה — {babyName || 'התינוק'} מוכן{genderSuffix} לטעימות!
          </span>
          <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: '#4A7C59' }} />
        </button>
      ) : (
        <div className="card">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold mb-1 flex items-center gap-1.5" style={{ color: 'var(--text)' }}>
              <CheckCircle2 className="w-4 h-4" style={{ color: '#4A7C59' }} /> רשימת מוכנות לטעימות
            </h2>
            {allChecked && (
              <button onClick={() => setChecklistOpen(false)} title="מזעור">
                <ChevronUp className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              </button>
            )}
          </div>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
            מומלץ לוודא לפחות 3 מתוך 4 סימנים לפני התחלה
          </p>
          <div className="space-y-3">
            {READINESS_CHECKLIST.map(item => (
              <button key={item.id} onClick={() => toggleCheck(item.id)}
                className="w-full flex items-start gap-3 text-right">
                {checkedItems.includes(item.id)
                  ? <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#4A7C59' }} />
                  : <Circle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--border)' }} />
                }
                <div>
                  <p className="text-sm font-medium text-right" style={{ color: 'var(--text)' }}>{item.label}</p>
                  <p className="text-xs text-right" style={{ color: 'var(--text-muted)' }}>{item.detail}</p>
                </div>
              </button>
            ))}
          </div>
          {allChecked && (
            <div className="mt-4 rounded-xl p-3 text-center"
              style={{ background: 'rgba(74,124,89,0.1)', border: '1px solid rgba(74,124,89,0.2)' }}>
              <p className="text-sm font-semibold flex items-center justify-center gap-1.5" style={{ color: '#4A7C59' }}>
                <PartyPopper className="w-4 h-4" /> {babyName || 'התינוק'} מוכן{genderSuffix} לטעימות! קדימה!
              </p>
            </div>
          )}
        </div>
      )}

      {/* Stages */}
      <div className="space-y-3">
        <h2 className="font-semibold flex items-center gap-1.5" style={{ color: 'var(--text)' }}><Calendar className="w-4 h-4" /> מדריך לפי שלב גיל</h2>
        {WEANING_STAGES.map((stage, idx) => {
          const isCurrent = currentStage === stage
          const isPast = babyWeeks !== null && babyWeeks > stage.toWeek
          const isExpanded = expandedStage === idx

          return (
            <div key={idx} className="card"
              style={isCurrent ? { border: '1.5px solid #7F5268' } : {}}>
              <button onClick={() => setExpandedStage(isExpanded ? null : idx)}
                className="w-full flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <stage.icon className="w-6 h-6" style={{ color: '#7F5268' }} />
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{stage.title}</p>
                      {isCurrent && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: '#7F5268', color: '#fff' }}>עכשיו</span>
                      )}
                      {isPast && (
                        <span className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(74,124,89,0.15)', color: '#4A7C59' }}>עבר</span>
                      )}
                    </div>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{stage.subtitle}</p>
                  </div>
                </div>
                {isExpanded
                  ? <ChevronUp className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                  : <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                }
              </button>

              {isExpanded && (
                <div className="mt-4 space-y-3 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
                  {/* Info grid */}
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'כמות', icon: Scale, val: stage.quantity },
                      { label: 'תדירות', icon: Clock3, val: stage.frequency },
                      { label: 'תזמון', icon: Clock, val: stage.timing },
                      { label: 'מרקם', icon: Soup, val: stage.texture },
                    ].map(({ label, icon: Icon, val }) => (
                      <div key={label} className="rounded-xl p-2.5"
                        style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                        <p className="text-xs font-medium flex items-center gap-1" style={{ color: 'var(--text-muted)' }}><Icon className="w-3 h-3" />{label}</p>
                        <p className="text-sm font-medium mt-0.5" style={{ color: 'var(--text)' }}>{val}</p>
                      </div>
                    ))}
                  </div>

                  {/* Foods */}
                  <div>
                    <p className="text-xs font-semibold mb-2 flex items-center gap-1" style={{ color: 'var(--text)' }}><CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#4A7C59' }} /> מזונות מומלצים:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {stage.foods.map(food => (
                        <span key={food} className="text-xs px-2.5 py-1 rounded-full font-medium"
                          style={{ background: 'rgba(74,124,89,0.12)', color: '#4A7C59' }}>
                          {food}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Avoid */}
                  <div>
                    <p className="text-xs font-semibold mb-2 flex items-center gap-1" style={{ color: '#C0392B' }}><Ban className="w-3.5 h-3.5" /> להימנע:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {stage.avoid.map(food => (
                        <span key={food} className="text-xs px-2.5 py-1 rounded-full"
                          style={{ background: 'rgba(192,57,43,0.1)', color: '#C0392B' }}>
                          {food}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Allergens */}
                  {stage.allergens.length > 0 && (
                    <div className="rounded-xl p-3"
                      style={{ background: 'rgba(184,134,11,0.08)', border: '1px solid rgba(184,134,11,0.2)' }}>
                      <p className="text-xs font-semibold mb-1 flex items-center gap-1" style={{ color: '#B8860B' }}><AlertTriangle className="w-3.5 h-3.5" /> אלרגנים:</p>
                      {stage.allergens.map(a => (
                        <p key={a} className="text-xs" style={{ color: '#92400E' }}>• {a}</p>
                      ))}
                    </div>
                  )}

                  {/* Recipes */}
                  <div>
                    <p className="text-xs font-semibold mb-2 flex items-center gap-1" style={{ color: 'var(--text)' }}><ChefHat className="w-3.5 h-3.5" /> מתכונים:</p>
                    <div className="space-y-2">
                      {stage.recipes.map(recipe => (
                        <div key={recipe.name} className="rounded-xl overflow-hidden"
                          style={{ border: '1px solid var(--border)' }}>
                          <button
                            onClick={() => setExpandedRecipe(expandedRecipe === recipe.name ? null : recipe.name)}
                            className="w-full flex items-center justify-between px-3 py-2.5"
                            style={{ background: 'var(--bg)' }}>
                            <span className="text-sm font-medium flex items-center gap-1.5" style={{ color: 'var(--text)' }}>
                              <recipe.icon className="w-4 h-4" style={{ color: '#7F5268' }} />
                              {recipe.name}
                            </span>
                            {expandedRecipe === recipe.name
                              ? <ChevronUp className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                              : <ChevronDown className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                            }
                          </button>
                          {expandedRecipe === recipe.name && (
                            <div className="px-3 pb-3 pt-1"
                              style={{ background: 'var(--surface-2)' }}>
                              <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>{recipe.steps}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
