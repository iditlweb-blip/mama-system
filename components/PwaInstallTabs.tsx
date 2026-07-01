'use client'

import { useState } from 'react'
import { Apple, Smartphone, ArrowUp, Heart } from 'lucide-react'

const steps = {
  android: [
    { icon: '1', text: 'פתחי את הדפדפן Chrome בטלפון Android' },
    { icon: '2', text: 'לחצי על תפריט שלוש הנקודות בפינה הימנית העליונה' },
    { icon: '3', text: 'בחרי "הוסף למסך הבית" מהרשימה' },
    { icon: '4', text: 'בחרי שם לאפליקציה (למשל "אמא בסדר") ולחצי הוסף' },
    { icon: '5', text: 'האפליקציה תופיע על מסך הבית — לחצי עליה לפתיחה!' },
  ],
  iphone: [
    { icon: '1', text: 'פתחי את דפדפן Safari (חשוב! רק Safari תומך בהוספה לדף הבית)' },
    { icon: '2', text: 'גשי לאתר mama-system.vercel.app' },
    { icon: '3', text: 'לחצי על כפתור השיתוף בתחתית המסך' },
    { icon: '4', text: 'גללי מטה ברשימה ובחרי "הוסף למסך הבית"' },
    { icon: '5', text: 'לחצי "הוסף" — האפליקציה תופיע על מסך הבית שלך!' },
  ],
}

export default function PwaInstallTabs() {
  const [tab, setTab] = useState<'android' | 'iphone'>('iphone')

  return (
    <div className="reveal">
      {/* Tab buttons */}
      <div className="flex rounded-2xl overflow-hidden border mb-6" style={{ borderColor: 'rgba(127,82,104,0.2)' }}>
        {([['iphone', Apple, 'iPhone / iPad'], ['android', Smartphone, 'Android']] as const).map(([id, Icon, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className="flex-1 py-3 text-sm font-semibold transition-all flex items-center justify-center gap-1.5"
            style={tab === id
              ? { background: '#7F5268', color: '#fff' }
              : { background: '#fff', color: '#7F5268' }
            }
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* Video placeholder */}
      <div
        className="w-full rounded-2xl mb-6 flex flex-col items-center justify-center gap-3"
        style={{
          background: 'rgba(127,82,104,0.06)',
          border: '2px dashed rgba(127,82,104,0.25)',
          minHeight: 180,
        }}
      >
        {tab === 'iphone' ? <Apple size={40} color="#7F5268" strokeWidth={1.4} /> : <Smartphone size={40} color="#7F5268" strokeWidth={1.4} />}
        <p className="text-sm font-medium" style={{ color: '#7F5268' }}>
          סרטון הדרכה — {tab === 'iphone' ? 'iPhone' : 'Android'}
        </p>
        <p className="text-xs font-light" style={{ color: 'rgba(127,82,104,0.6)' }}>בקרוב</p>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {steps[tab].map((step) => (
          <div
            key={step.icon}
            className="flex items-start gap-4 p-4 rounded-2xl"
            style={{ background: '#fff', border: '1px solid rgba(127,82,104,0.1)' }}
          >
            <div
              className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold text-white"
              style={{ background: '#7F5268' }}
            >
              {step.icon}
            </div>
            <p className="text-sm leading-relaxed pt-0.5 flex items-center gap-1.5 flex-wrap" style={{ color: '#111' }}>
              {step.text}
              {tab === 'iphone' && step.icon === '3' && <ArrowUp size={14} style={{ color: '#7F5268' }} />}
            </p>
          </div>
        ))}
      </div>

      {/* tip */}
      <p className="text-xs text-center mt-5 font-light flex items-center justify-center gap-1" style={{ color: 'rgba(127,82,104,0.7)' }}>
        לא הצלחת? אפשר להשתמש ישירות מהדפדפן — זה עובד בדיוק אותו דבר <Heart size={12} />
      </p>
    </div>
  )
}
