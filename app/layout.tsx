import type { Metadata, Viewport } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "אמא בסדר",
  description: "מערכת ניהול לאמהות — משימות, מעקב תינוק, התפתחות, וצ'אטבוט AI",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "אמא בסדר",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
  openGraph: {
    title: "אמא בסדר",
    description: "מערכת ניהול לאמהות עצמאיות — משימות, מעקב תינוק, התפתחות, וצ'אטבוט AI",
    siteName: "אמא בסדר",
    locale: "he_IL",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "אמא בסדר",
    description: "מערכת ניהול לאמהות עצמאיות",
  },
}

export const viewport: Viewport = {
  themeColor: "#7F5268",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <head>
        {/* Paint background BEFORE any CSS loads — kills white flash on PWA open */}
        <style dangerouslySetInnerHTML={{ __html: 'html,body{background-color:#f7ede2}' }} />

        <link rel="preload" href="/fonts/Talent_FS-Medium.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/OHLiorAtias-Regular.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />

        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="אמא בסדר" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />

        {/* iOS PWA splash screens — shown by iOS before the web app loads (eliminates white screen) */}
        <link rel="apple-touch-startup-image" href="/splash/splash-1170x2532.png"
          media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash/splash-1284x2778.png"
          media="(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash/splash-1179x2556.png"
          media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash/splash-1290x2796.png"
          media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash/splash-750x1334.png"
          media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/splash/splash-1080x1920.png"
          media="(device-width: 360px) and (device-height: 640px) and (-webkit-device-pixel-ratio: 3)" />
        {/* Fallback for any other iPhone */}
        <link rel="apple-touch-startup-image" href="/splash/splash-1170x2532.png" />
      </head>
      <body className="min-h-screen" style={{ backgroundColor: '#f7ede2' }}>
        {children}
      </body>
    </html>
  )
}
