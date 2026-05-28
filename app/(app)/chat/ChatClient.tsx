'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Baby, Clock, Briefcase, Heart, Loader2, Bot } from 'lucide-react'
import { ChatMode, ChatMessage } from '@/types/database'

const modes: { id: ChatMode; label: string; icon: React.ElementType; color: string; description: string; prompts: string[] }[] = [
  {
    id: 'baby', label: 'תינוק', icon: Baby, color: '#7F5268',
    description: 'שאלות על שינה, האכלה, התפתחות',
    prompts: ['למה התינוק שלי בוכה הרבה בלילה?', 'מתי להתחיל מזון מוצק?', 'כמה שינה התינוק צריך?', 'איך מלמדים שינה עצמאית?'],
  },
  {
    id: 'time', label: 'ניהול זמן', icon: Clock, color: '#B8860B',
    description: 'תכנון יום, עדיפויות, פרודוקטיביות',
    prompts: ['עזרי לי לתכנן את היום שלי', 'איך עובדים בנמנום קצר?', 'איך קובעים עדיפויות?', 'שיטת Pomodoro לאמא'],
  },
  {
    id: 'business', label: 'עסק', icon: Briefcase, color: '#4A7C59',
    description: 'פרילנס, לקוחות, שיווק, תמחור',
    prompts: ['איך לתמחר שירות?', 'איך להגדיר גבולות עם לקוחות?', 'שיווק בסושיאל עם תינוק', 'איך לחפש לקוחות חדשים?'],
  },
  {
    id: 'emotional', label: 'תמיכה', icon: Heart, color: '#C4A0B4',
    description: 'הקשבה, חיזוק, רגשות',
    prompts: ['אני מרגישה אובדת ועייפה', 'מרגישה אשמה שאני עובדת', 'לא מצליחה לאהנות מהתינוק', 'צריכה לשחרר קצת'],
  },
]

interface Message { role: 'user' | 'assistant'; content: string }

export default function ChatClient({ history }: { history: ChatMessage[] }) {
  const [mode, setMode] = useState<ChatMode>('baby')
  const [messages, setMessages] = useState<Message[]>(
    history.map(h => ({ role: h.role, content: h.content }))
  )
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streaming, setStreaming] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streaming])

  const currentMode = modes.find(m => m.id === mode)!

  async function send(text?: string) {
    const content = (text || input).trim()
    if (!content || loading) return
    setInput('')
    const newMessages: Message[] = [...messages, { role: 'user', content }]
    setMessages(newMessages)
    setLoading(true)
    setStreaming('')

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, mode }),
      })

      if (!res.ok) throw new Error('שגיאה בחיבור לצ\'אט')
      if (!res.body) throw new Error('No response body')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let full = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        full += chunk
        setStreaming(full)
      }

      setMessages([...newMessages, { role: 'assistant', content: full }])
      setStreaming('')
    } catch (e) {
      setMessages([...newMessages, { role: 'assistant', content: 'אירעה שגיאה. אנא נסי שוב.' }])
      setStreaming('')
    }
    setLoading(false)
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-130px)] max-w-3xl">
      {/* Mode Selector */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {modes.map(m => {
          const Icon = m.icon
          const active = mode === m.id
          return (
            <button key={m.id} onClick={() => setMode(m.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all"
              style={active
                ? { background: m.color, color: 'white' }
                : { background: 'var(--surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }
              }
            >
              <Icon className="w-3.5 h-3.5" />
              {m.label}
            </button>
          )
        })}
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.length === 0 && !streaming && (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{ background: `${currentMode.color}20` }}>
              <currentMode.icon className="w-8 h-8" style={{ color: currentMode.color }} />
            </div>
            <h3 className="font-bold mb-1" style={{ color: 'var(--text)' }}>
              {currentMode.label} — {currentMode.description}
            </h3>
            <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
              שאלי אותי כל מה שעל הלב
            </p>
            <div className="grid grid-cols-2 gap-2 max-w-md mx-auto">
              {currentMode.prompts.map(p => (
                <button key={p} onClick={() => send(p)}
                  className="text-right text-sm p-3 rounded-xl border transition-all hover:opacity-80"
                  style={{ borderColor: `${currentMode.color}40`, color: 'var(--text)', background: `${currentMode.color}08` }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble key={i} role={msg.role} content={msg.content} modeColor={currentMode.color} />
        ))}

        {streaming && (
          <MessageBubble role="assistant" content={streaming} modeColor={currentMode.color} />
        )}

        {loading && !streaming && (
          <div className="flex items-center gap-2 px-4">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${currentMode.color}20` }}>
              <Bot className="w-4 h-4" style={{ color: currentMode.color }} />
            </div>
            <div className="flex gap-1">
              {[0, 1, 2].map(n => (
                <div key={n} className="w-2 h-2 rounded-full animate-bounce" style={{ background: currentMode.color, animationDelay: `${n * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="card p-3 flex items-end gap-2" style={{ marginTop: 'auto' }}>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder={`שאלי על ${currentMode.description}...`}
          rows={1}
          className="flex-1 bg-transparent outline-none resize-none text-sm leading-relaxed max-h-32"
          style={{ color: 'var(--text)' }}
        />
        <button
          onClick={() => send()}
          disabled={loading || !input.trim()}
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-40"
          style={{ background: loading || !input.trim() ? 'var(--border)' : currentMode.color }}
        >
          {loading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" style={{ transform: 'rotate(180deg)' }} />}
        </button>
      </div>
    </div>
  )
}

function MessageBubble({ role, content, modeColor }: { role: 'user' | 'assistant'; content: string; modeColor: string }) {
  const isUser = role === 'user'
  return (
    <div className={`flex items-start gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${modeColor}20` }}>
          <Bot className="w-4 h-4" style={{ color: modeColor }} />
        </div>
      )}
      <div
        className="max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
        style={isUser
          ? { background: modeColor, color: 'white', borderBottomLeftRadius: '0.25rem' }
          : { background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', borderBottomRightRadius: '0.25rem' }
        }
      >
        {content}
      </div>
    </div>
  )
}
