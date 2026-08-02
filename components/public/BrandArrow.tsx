// The exact arrow used on the landing page buttons (public/landing.html .btn),
// so the blog/community buttons match the home header.
export default function BrandArrow({ size = 26 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 36 21"
      width={size}
      height={(size * 21) / 36}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flex: 'none' }}
      aria-hidden="true"
    >
      <path d="M12 0C12 1.113 10.9005 2.775 9.7875 4.17C8.3565 5.97 6.6465 7.5405 4.686 8.739C3.216 9.6375 1.434 10.5 0 10.5M0 10.5C1.434 10.5 3.2175 11.3625 4.686 12.261C6.6465 13.461 8.3565 15.0315 9.7875 16.8285C10.9005 18.225 12 19.89 12 21M0 10.5H36" />
    </svg>
  )
}
