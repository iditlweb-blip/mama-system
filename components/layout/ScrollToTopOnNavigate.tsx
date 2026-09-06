'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Puts the app's scroll container back to the top on every navigation.
 *
 * The layout scrolls inside `<main id="app-scroll">` rather than on the
 * document, which the router's built-in scroll restoration doesn't know about -
 * so without this, opening a new page leaves you at whatever offset the
 * previous page was scrolled to, with the top bar and the page's own top
 * padding out of view.
 */
export default function ScrollToTopOnNavigate() {
  const pathname = usePathname()

  useEffect(() => {
    const el = document.getElementById('app-scroll')
    // 'instant' rather than smooth: this is a page change, not a jump within
    // one, and animating it reads as the old page sliding away.
    el?.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])

  return null
}
