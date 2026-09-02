'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

// Mobile-only fixed bottom navigation, 5 items with "בית" in the middle.
// The active tab is marked two ways at once: the bar swells into a dome behind
// it, and its icon grows from 22px to 44px so it rises into that dome. Both
// move to whichever tab you are on.
//
// The dome is drawn as its own fixed-size SVG sitting flush on the bar's top
// edge, in the same fill - so the two read as the single merged shape the
// design is built from, while the bar itself stays a plain responsive box.
// Positioning it by percentage means no width measurement and no layout
// flash on hydration.
//
// The icons are the exported Figma artwork, inlined so they take their colour
// from `currentColor` and can be resized per state without extra requests.
// Each keeps its own viewBox, so they scale cleanly at both sizes.

const BAR_COLOR = '#7F5268'
const ICON_COLOR = '#F2E6DC'
const ICON_SIZE_ACTIVE = 44
const BAR_HEIGHT = 49
// How far the dome rises above the bar, and how wide it is where it meets it.
const DOME_RISE = 17.9297
const DOME_WIDTH = 70.56
// Every icon is bottom-aligned this far above the bar's lower edge, so the
// 44px active one grows upward into the dome instead of shifting the row.
const ICON_BASELINE = 12

type IconProps = { size: number }

function ProductsIcon({ size }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 25 26" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M13.0208 23.8335H10.4167C6.97917 23.8335 5.26042 23.8335 4.19271 22.7231C3.125 21.6127 3.125 19.8252 3.125 16.2502V11.9168C3.125 9.87366 3.125 8.85316 3.73542 8.21833C4.34583 7.5835 5.32708 7.5835 7.29167 7.5835H15.625C17.5896 7.5835 18.5708 7.5835 19.1812 8.21833C19.7917 8.85316 19.7917 9.87366 19.7917 11.9168V14.0835" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15.6253 10.2917C15.6253 6.10358 13.7607 2.16675 11.4587 2.16675C9.15658 2.16675 7.29199 6.10358 7.29199 10.2917M18.2295 23.8334C18.2295 23.8334 14.5837 21.5389 14.5837 19.3192C14.5837 18.2228 15.3514 17.3334 16.4066 17.3334C16.9535 17.3334 17.5003 17.5252 18.2295 18.2889C18.9587 17.5241 19.5055 17.3334 20.0524 17.3334C21.1076 17.3334 21.8753 18.2217 21.8753 19.3192C21.8753 21.54 18.2295 23.8334 18.2295 23.8334Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function TrackIcon({ size }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M13.0007 13.0001C15.9922 13.0001 18.4173 10.575 18.4173 7.58342C18.4173 4.59187 15.9922 2.16675 13.0007 2.16675C10.0091 2.16675 7.58398 4.59187 7.58398 7.58342C7.58398 10.575 10.0091 13.0001 13.0007 13.0001Z" stroke="currentColor" strokeWidth="2" />
      <path d="M18.4171 15.1667H18.7984C19.5904 15.167 20.3551 15.4564 20.9487 15.9806C21.5424 16.5049 21.9242 17.2279 22.0224 18.0137L22.446 21.3981C22.4841 21.703 22.4569 22.0125 22.3662 22.306C22.2756 22.5996 22.1235 22.8705 21.9202 23.1009C21.7168 23.3312 21.4668 23.5156 21.1867 23.6419C20.9066 23.7682 20.6028 23.8335 20.2956 23.8334H5.70522C5.39797 23.8335 5.09422 23.7682 4.81412 23.6419C4.53403 23.5156 4.284 23.3312 4.08063 23.1009C3.87726 22.8705 3.7252 22.5996 3.63455 22.306C3.54389 22.0125 3.51671 21.703 3.55481 21.3981L3.97731 18.0137C4.07556 17.2275 4.45767 16.5042 5.05179 15.9799C5.64591 15.4556 6.4111 15.1664 7.20347 15.1667H7.58372" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function HomeIcon({ size }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M40.6703 21.6993L24.0672 5.1048L22.9543 3.99191C22.7007 3.74001 22.3578 3.59863 22.0004 3.59863C21.643 3.59863 21.3 3.74001 21.0465 3.99191L3.33045 21.6993C3.07062 21.9581 2.86528 22.2664 2.72653 22.6059C2.58779 22.9453 2.51846 23.3092 2.52264 23.6759C2.53983 25.1884 3.79881 26.3958 5.31131 26.3958H7.13748V40.3907H36.8633V26.3958H38.7281C39.4629 26.3958 40.1547 26.1079 40.6746 25.588C40.9306 25.3328 41.1334 25.0294 41.2714 24.6953C41.4093 24.3611 41.4796 24.003 41.4781 23.6415C41.4781 22.911 41.1902 22.2192 40.6703 21.6993ZM24.4066 37.297H19.5941V28.5314H24.4066V37.297ZM33.7695 23.3021V37.297H27.1566V27.5001C27.1566 26.5505 26.3875 25.7814 25.4379 25.7814H18.5629C17.6133 25.7814 16.8441 26.5505 16.8441 27.5001V37.297H10.2312V23.3021H6.10623L22.0047 7.41651L22.9972 8.40909L37.8988 23.3021H33.7695Z" fill="currentColor" />
    </svg>
  )
}

function ChatIcon({ size }: IconProps) {
  // The exported file wrapped this in a clipPath identical to the viewBox, so
  // it clipped nothing - dropped here to avoid a duplicate id on the page.
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2.5 1.25C2.16848 1.25 1.85054 1.3817 1.61612 1.61612C1.3817 1.85054 1.25 2.16848 1.25 2.5V12.5C1.25 12.8315 1.3817 13.1495 1.61612 13.3839C1.85054 13.6183 2.16848 13.75 2.5 13.75H14.4825C15.1455 13.7501 15.7813 14.0136 16.25 14.4825L18.75 16.9825V2.5C18.75 2.16848 18.6183 1.85054 18.3839 1.61612C18.1495 1.3817 17.8315 1.25 17.5 1.25H2.5ZM17.5 0C18.163 0 18.7989 0.263392 19.2678 0.732233C19.7366 1.20107 20 1.83696 20 2.5V18.4913C20 18.6149 19.9633 18.7358 19.8945 18.8386C19.8257 18.9414 19.728 19.0215 19.6138 19.0687C19.4995 19.116 19.3737 19.1282 19.2525 19.104C19.1312 19.0797 19.0198 19.0201 18.9325 18.9325L15.3663 15.3663C15.1319 15.1318 14.814 15.0001 14.4825 15H2.5C1.83696 15 1.20107 14.7366 0.732233 14.2678C0.263392 13.7989 0 13.163 0 12.5V2.5C0 1.83696 0.263392 1.20107 0.732233 0.732233C1.20107 0.263392 1.83696 0 2.5 0L17.5 0Z" fill="currentColor" />
      <path d="M9.99968 4.99119C12.0797 2.85244 17.2809 6.59494 9.99968 11.4062C2.71843 6.59369 7.91968 2.85244 9.99968 4.99119Z" fill="currentColor" />
    </svg>
  )
}

function CommunityIcon({ size }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14.6667 7.33341H18.3333C18.5764 7.33341 18.8096 7.42999 18.9815 7.6019C19.1534 7.77381 19.25 8.00697 19.25 8.25008V18.3334L16.1948 15.7952C16.03 15.6582 15.8224 15.5833 15.6081 15.5834H8.25C8.00688 15.5834 7.77373 15.4868 7.60182 15.3149C7.42991 15.143 7.33333 14.9099 7.33333 14.6667V11.9167M14.6667 7.33341V4.58341C14.6667 4.3403 14.5701 4.10714 14.3982 3.93523C14.2263 3.76333 13.9931 3.66675 13.75 3.66675H3.66667C3.42355 3.66675 3.19039 3.76333 3.01849 3.93523C2.84658 4.10714 2.75 4.3403 2.75 4.58341V14.6667L5.80525 12.1276C5.97025 11.9919 6.17742 11.9167 6.39192 11.9167H7.33333M14.6667 7.33341V11.0001C14.6667 11.2432 14.5701 11.4764 14.3982 11.6483C14.2263 11.8202 13.9931 11.9167 13.75 11.9167H7.33333" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function BottomNav({ trackingType }: { trackingType: 'pregnancy' | 'baby' }) {
  const pathname = usePathname()

  // "מעקב" always follows the profile - a baby profile never shows a pregnancy
  // tab (it would be empty) and vice versa.
  const isPregnancy = trackingType === 'pregnancy'

  // Laid out right-to-left (the page is RTL), so the first entry sits on the
  // right and "בית" lands dead centre - matching the design's left-to-right
  // run of chat, community, home, tracker, products.
  //
  // `size` is the resting size from the design; the chat glyph is drawn a
  // little larger inside its own viewBox, so it sits at 18 to look the same
  // weight as the 22px ones beside it.
  const items = [
    { href: '/products', label: 'מוצרים', Icon: ProductsIcon, size: 22 },
    { href: isPregnancy ? '/pregnancy' : '/tracker', label: isPregnancy ? 'הריון' : 'מעקב', Icon: TrackIcon, size: 22 },
    { href: '/dashboard', label: 'בית', Icon: HomeIcon, size: 22 },
    { href: '/content/community', label: 'קהילה', Icon: CommunityIcon, size: 22 },
    { href: '/chat', label: "צ'אט AI", Icon: ChatIcon, size: 18 },
  ]

  const activeIndex = items.findIndex(
    it => pathname === it.href || (it.href !== '/dashboard' && pathname.startsWith(it.href)),
  )
  // Slot centres measured from the LEFT edge, since CSS `left` is not mirrored
  // by RTL: the first item (rightmost) is at 90%, the middle one at 50%.
  const domeLeft = activeIndex >= 0 ? (items.length - activeIndex - 0.5) * (100 / items.length) : null

  return (
    <>
      {/* spacer so content isn't hidden behind the nav on mobile */}
      <div className="bottom-nav-spacer" />
      <nav
        aria-label="ניווט ראשי"
        className="bottom-nav"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          background: BAR_COLOR,
          borderRadius: '10px 10px 0 0',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {/* The dome. Sits flush on the bar's top edge in the same fill, so the
            straight edge closing its bottom disappears into the bar and the
            two read as one shape. */}
        {domeLeft !== null && (
          <svg
            className="bottom-nav-dome"
            aria-hidden="true"
            width={DOME_WIDTH}
            height={DOME_RISE}
            viewBox={`0 0 ${DOME_WIDTH} ${DOME_RISE}`}
            style={{
              position: 'absolute',
              bottom: '100%',
              left: `${domeLeft}%`,
              transform: 'translateX(-50%)',
              display: 'block',
            }}
          >
            <path
              d="M0 17.9297C4.135 17.9297 7.71 15.2608 10.181 11.9442C15.541 4.75055 24.781 0 35.28 0C45.779 0 55.019 4.75055 60.379 11.9442C62.85 15.2608 66.425 17.9297 70.56 17.9297Z"
              fill={BAR_COLOR}
            />
          </svg>
        )}

        <div style={{ display: 'flex', alignItems: 'flex-end', height: BAR_HEIGHT, paddingBottom: ICON_BASELINE }}>
          {items.map(({ href, label, Icon, size }, i) => {
            const isActive = i === activeIndex
            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                aria-current={isActive ? 'page' : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'center',
                  flex: 1,
                  color: ICON_COLOR,
                  textDecoration: 'none',
                }}
              >
                <Icon size={isActive ? ICON_SIZE_ACTIVE : size} />
              </Link>
            )
          })}
        </div>
      </nav>
      <style>{`
        @media (min-width: 768px) {
          .bottom-nav { display: none !important; }
          .bottom-nav-spacer { display: none !important; }
        }
        .bottom-nav-spacer { height: calc(${BAR_HEIGHT}px + env(safe-area-inset-bottom)); }
        /* Animate the icon growing and the dome sliding, so switching tab reads
           as one shape moving rather than two things snapping. */
        .bottom-nav svg { transition: width 0.22s ease, height 0.22s ease; }
        .bottom-nav svg.bottom-nav-dome { transition: left 0.22s ease; }
        @media (prefers-reduced-motion: reduce) {
          .bottom-nav svg, .bottom-nav svg.bottom-nav-dome { transition: none; }
        }
      `}</style>
    </>
  )
}
