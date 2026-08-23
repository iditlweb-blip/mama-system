'use client'

import { useState, useRef, useEffect } from 'react'
import { Moon, Play, Pause, Music, Volume2 } from 'lucide-react'

interface Track {
  id: string
  label: string
  file: string
}

const SLEEP_TRACKS: Track[] = [
  { id: 'white-noise', label: 'רעש לבן', file: '/sounds/white-noise.mp3' },
  { id: 'shush',       label: 'ששש',     file: '/sounds/shush.mp3' },
  { id: 'lullaby',     label: 'שיר ערש', file: '/sounds/lullaby.mp3' },
]
const PLAY_TRACKS: Track[] = [
  { id: 'play-upbeat',        label: 'מוזיקת פעילות',      file: '/sounds/play-upbeat.mp3' },
  { id: 'israeli-style-baby', label: 'מוזיקת תינוקות',     file: '/sounds/israeli-style-baby.mp3' },
  { id: 'melodies',           label: 'מנגינות',             file: '/sounds/melodies.mp3' },
]

// Ambient sound / music player for sleep (white noise / shushing / lullaby)
// and playtime (upbeat / gentle melodies). Static looping tracks, no
// server round-trip - just an <audio> element swapped between sources.
export default function MusicPlayer() {
  const [mode, setMode] = useState<'sleep' | 'play'>('sleep')
  const [activeTrack, setActiveTrack] = useState<Track | null>(null)
  const [playing, setPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const tracks = mode === 'sleep' ? SLEEP_TRACKS : PLAY_TRACKS

  useEffect(() => {
    // Switching mode stops whatever was playing from the other list.
    setActiveTrack(null)
    setPlaying(false)
  }, [mode])

  function toggleTrack(track: Track) {
    if (activeTrack?.id === track.id && playing) {
      audioRef.current?.pause()
      setPlaying(false)
      return
    }
    setActiveTrack(track)
    // Let the <audio> element pick up the new src before playing.
    setTimeout(() => {
      audioRef.current?.play().catch(() => {})
      setPlaying(true)
    }, 0)
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-medium text-sm flex items-center gap-2" style={{ color: 'var(--text)' }}>
          <Volume2 className="w-3.5 h-3.5" style={{ color: 'var(--primary)' }} />
          מוזיקה והרגעה
        </h2>
        <div className="flex gap-1 p-0.5 rounded-lg" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
          {([['sleep', 'שינה', Moon], ['play', 'פעילות', Music]] as const).map(([val, lbl, Icon]) => (
            <button key={val} onClick={() => setMode(val)}
              className="px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-all"
              style={mode === val ? { background: '#7F5268', color: '#fff' } : { color: 'var(--text-muted)' }}>
              <Icon className="w-3 h-3" />{lbl}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {tracks.map(track => {
          const isActive = activeTrack?.id === track.id && playing
          return (
            <button key={track.id} onClick={() => toggleTrack(track)}
              className="flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all"
              style={isActive
                ? { background: '#7F5268', color: '#fff' }
                : { background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)' }
              }>
              {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span className="text-xs font-medium text-center">{track.label}</span>
            </button>
          )
        })}
      </div>

      {activeTrack && (
        <audio
          ref={audioRef}
          src={activeTrack.file}
          loop
          autoPlay
          onEnded={() => setPlaying(false)}
          onPause={() => setPlaying(false)}
        />
      )}
    </div>
  )
}
