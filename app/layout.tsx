import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "MamaFlow — ניהול חכם לאמא",
  description: "מערכת ניהול לאמהות טריות ועצמאיות — משימות, מעקב תינוק, התפתחות, וצ'אטבוט AI",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <link rel="preload" href="/fonts/Talent_FS-Medium.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/OHLiorAtias-Regular.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen">
        {children}
      </body>
    </html>
  )
}
