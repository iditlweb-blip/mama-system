import type { NextConfig } from "next";

// ── Legacy-domain redirect ──────────────────────────────────────────────────
// Once the app moves to a custom domain, set NEXT_PUBLIC_PRIMARY_DOMAIN in
// Vercel (e.g. "mamabeseder.co.il"). Any visitor who still opens the old
// mama-system.vercel.app URL is permanently (308) redirected to the new
// domain, keeping the exact path they tried to reach. Until the env var is
// set, redirects() returns [] and nothing changes.
const primaryDomain = process.env.NEXT_PUBLIC_PRIMARY_DOMAIN
const legacyHost = 'mama-system.vercel.app'

// ── Security headers (every response) ──────────────────────────────────────
// HSTS forces HTTPS; frame-ancestors / X-Frame-Options block clickjacking (the
// site can only be framed by itself - the admin landing editor needs that);
// nosniff stops MIME-type confusion; the CSP locks down plugins, <base> and
// form targets without restricting scripts, since the landing page and Next
// both rely on inline scripts.
const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(self), microphone=(self), geolocation=(), payment=(), usb=(), interest-cohort=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
  {
    key: 'Content-Security-Policy',
    value: "frame-ancestors 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests",
  },
]

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      // Signed-in and admin data must never sit in a shared/proxy cache.
      { source: '/api/:path*', headers: [{ key: 'Cache-Control', value: 'no-store' }] },
      { source: '/admin/:path*', headers: [{ key: 'Cache-Control', value: 'no-store' }, { key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
    ]
  },
  async redirects() {
    if (!primaryDomain) return []
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: legacyHost }],
        destination: `https://${primaryDomain}/:path*`,
        permanent: true,
      },
    ]
  },
};

export default nextConfig;
