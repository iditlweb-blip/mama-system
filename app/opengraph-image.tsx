import { ImageResponse } from 'next/og'
import { readFileSync } from 'fs'
import { join } from 'path'

export const runtime = 'nodejs'
export const alt = 'אמא בסדר'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  const fontData = readFileSync(join(process.cwd(), 'public/fonts/Talent_FS-Medium.woff'))
  const logoData = readFileSync(join(process.cwd(), 'public/icons/logo-192.png'))
  const logoSrc  = `data:image/png;base64,${logoData.toString('base64')}`

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f7ede2',
          gap: 64,
          padding: '0 80px',
          direction: 'rtl',
          fontFamily: 'TalentFS',
        }}
      >
        {/* Decorative blobs */}
        <div style={{
          position: 'absolute', top: -60, right: -60,
          width: 300, height: 300, borderRadius: '50%',
          background: 'rgba(127,82,104,0.12)',
          display: 'flex',
        }} />
        <div style={{
          position: 'absolute', bottom: -80, left: -80,
          width: 400, height: 400, borderRadius: '50%',
          background: 'rgba(127,82,104,0.08)',
          display: 'flex',
        }} />

        {/* Logo circle */}
        <div style={{
          width: 220, height: 220, borderRadius: 48,
          background: '#7F5268',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 20px 60px rgba(127,82,104,0.35)',
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} width={140} height={140} alt="logo" style={{ objectFit: 'contain' }} />
        </div>

        {/* Text block */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 16,
        }}>
          <div style={{
            fontSize: 96,
            fontWeight: 700,
            color: '#7F5268',
            lineHeight: 1,
            direction: 'rtl',
          }}>
            אמא בסדר
          </div>
          <div style={{
            fontSize: 36,
            color: '#9B7A8A',
            direction: 'rtl',
            lineHeight: 1.4,
          }}>
            מערכת ניהול לאמהות עצמאיות
          </div>
          <div style={{
            display: 'flex',
            flexDirection: 'row',
            gap: 12,
            marginTop: 8,
          }}>
            {['📋 משימות', '👶 מעקב תינוק', '💬 AI', '🌱 התפתחות'].map(tag => (
              <div key={tag} style={{
                fontSize: 22,
                color: '#7F5268',
                background: 'rgba(127,82,104,0.1)',
                borderRadius: 20,
                padding: '6px 18px',
                direction: 'rtl',
              }}>
                {tag}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'TalentFS', data: fontData, style: 'normal', weight: 500 },
      ],
    },
  )
}
