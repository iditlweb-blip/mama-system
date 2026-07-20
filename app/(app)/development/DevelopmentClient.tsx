'use client'

import { useState } from 'react'
import { stages } from '@/lib/milestones'
import {
  CheckCircle2, Circle, ChevronDown, ChevronUp, Info, AlertTriangle, Lightbulb, ChevronRight,
  Dumbbell, Brain, Heart, MessageCircle, Sprout, Smile, PartyPopper, Footprints, Cake,
  AlertOctagon, Sparkles,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

// Local icon mapping for age-stage tabs (replaces raw emoji stored in lib/milestones.ts)
const STAGE_ICONS: Record<string, React.ElementType> = {
  '0-1': Sprout,
  '1-3': Smile,
  '3-6': PartyPopper,
  '6-9': Footprints,
  '9-12': Cake,
}

export default function DevelopmentClient() {
  const router = useRouter()
  const [activeStage, setActiveStage] = useState(stages[0].id)
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [expanded, setExpanded] = useState<string | null>(null)

  const stage = stages.find(s => s.id === activeStage)!
  const CurrentStageIcon = STAGE_ICONS[stage.id] ?? Sprout

  function toggleCheck(id: string) {
    setChecked(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const allMilestones = [...stage.motor, ...stage.cognitive, ...stage.social, ...stage.language]
  const progress = allMilestones.filter(m => checked.has(`${activeStage}-${m.id}`)).length
  const total = allMilestones.length

  const sections = [
    { label: 'מוטורי', icon: Dumbbell, items: stage.motor, color: '#7F5268' },
    { label: 'קוגניטיבי', icon: Brain, items: stage.cognitive, color: '#5C7A6A' },
    { label: 'חברתי-רגשי', icon: Heart, items: stage.social, color: '#C4A0B4' },
    { label: 'שפה ותקשורת', icon: MessageCircle, items: stage.language, color: '#4A7C59' },
  ]

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex justify-end">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs"
          style={{ color: 'var(--text-muted)', background: 'var(--surface-2)', border: '1px solid var(--border)' }}
        >
          <ChevronRight className="w-3.5 h-3.5" />
          חזרה
        </button>
      </div>
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>התפתחות התינוק</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>מידע מפורט לפי שלב גיל — 0 עד 12 חודשים</p>
      </div>

      {/* Stage Tabs */}
      <div className="flex gap-2 flex-wrap">
        {stages.map(s => {
          const StageIcon = STAGE_ICONS[s.id] ?? Sprout
          return (
            <button key={s.id} onClick={() => { setActiveStage(s.id); setExpanded(null) }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all"
              style={activeStage === s.id
                ? { background: 'var(--primary)', color: 'white' }
                : { background: 'var(--surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }
              }
            >
              <StageIcon className="w-4 h-4" />
              {s.label}
            </button>
          )
        })}
      </div>

      {/* Summary card */}
      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(192,132,252,0.12), rgba(249,168,212,0.12))' }}>
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1">
            <h2 className="font-bold text-lg mb-1 flex items-center gap-1.5" style={{ color: 'var(--text)' }}>
              <CurrentStageIcon className="w-5 h-5" />
              {stage.label}
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{stage.summary}</p>
          </div>
          <div className="text-center flex-shrink-0">
            <p className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>{progress}/{total}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>השגנו</p>
          </div>
        </div>
        <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${total > 0 ? (progress / total) * 100 : 0}%`, background: 'linear-gradient(90deg, #7F5268, #C4A0B4)' }}
          />
        </div>
      </div>

      {/* Milestone Sections */}
      {sections.map(({ label, icon: SectionIcon, items, color }) => (
        <div key={label} className="card">
          <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text)' }}>
            <SectionIcon className="w-5 h-5" style={{ color }} />
            {label}
          </h3>
          <div className="space-y-2">
            {items.map(item => {
              const key = `${activeStage}-${item.id}`
              const isChecked = checked.has(key)
              const isExpanded = expanded === key
              return (
                <div key={key}>
                  <div className="flex items-start gap-3 p-3 rounded-xl cursor-pointer"
                    style={{ background: isChecked ? `${color}12` : 'var(--bg)' }}
                    onClick={() => setExpanded(isExpanded ? null : key)}
                  >
                    <button onClick={e => { e.stopPropagation(); toggleCheck(key) }} className="mt-0.5 flex-shrink-0">
                      {isChecked
                        ? <CheckCircle2 className="w-5 h-5" style={{ color }} />
                        : <Circle className="w-5 h-5" style={{ color: 'var(--border)' }} />
                      }
                    </button>
                    <div className="flex-1">
                      <p className="text-sm font-medium" style={{ color: isChecked ? color : 'var(--text)' }}>
                        {item.title}
                        {isChecked && (
                          <span className="text-xs mr-2 inline-flex items-center gap-0.5" style={{ color }}>
                            <CheckCircle2 className="w-3 h-3" />השגנו!
                          </span>
                        )}
                      </p>
                    </div>
                    {isExpanded
                      ? <ChevronUp className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                      : <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                    }
                  </div>
                  {isExpanded && (
                    <div className="px-4 pb-3 pt-1 mx-3 text-sm rounded-b-xl" style={{ background: 'var(--bg)', color: 'var(--text-muted)' }}>
                      {item.description}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Tips */}
      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(96,165,250,0.08), rgba(52,211,153,0.08))' }}>
        <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text)' }}>
          <Lightbulb className="w-5 h-5" style={{ color: '#B8860B' }} />
          טיפים לשלב זה
        </h3>
        <ul className="space-y-2">
          {stage.tips.map((tip, i) => (
            <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
              <span className="text-xs mt-1 flex-shrink-0" style={{ color: '#B8860B' }}>◆</span>
              {tip}
            </li>
          ))}
        </ul>
      </div>

      {/* Did you know */}
      <div className="card">
        <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text)' }}>
          <Info className="w-5 h-5" style={{ color: '#5C7A6A' }} />
          האם ידעת?
        </h3>
        <div className="grid gap-2">
          {stage.didYouKnow.map((fact, i) => (
            <div key={i} className="p-3 rounded-xl text-sm flex items-start gap-2" style={{ background: 'var(--bg)', color: 'var(--text-muted)' }}>
              <Sparkles className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: '#5C7A6A' }} />
              {fact}
            </div>
          ))}
        </div>
      </div>

      {/* Red flags */}
      <div className="card" style={{ border: '1px solid #FEE2E2', background: '#FFF5F5' }}>
        <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: '#DC2626' }}>
          <AlertTriangle className="w-5 h-5" />
          מתי לפנות לרופא
        </h3>
        <p className="text-xs mb-2" style={{ color: '#9CA3AF' }}>
          אלו סימני דגל — לא אוטומטי שמשהו לא בסדר, אבל כדאי לאמת עם רופא ילדים.
        </p>
        <ul className="space-y-1">
          {stage.redFlags.map((flag, i) => (
            <li key={i} className="flex items-start gap-2 text-sm" style={{ color: '#DC2626' }}>
              <AlertOctagon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              {flag}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
