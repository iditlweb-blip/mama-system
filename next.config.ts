import type { NextConfig } from "next";

// ── Legacy-domain redirect ──────────────────────────────────────────────────
// Once the app moves to a custom domain, set NEXT_PUBLIC_PRIMARY_DOMAIN in
// Vercel (e.g. "mamabeseder.co.il"). Any visitor who still opens the old
// mama-system.vercel.app URL is permanently (308) redirected to the new
// domain, keeping the exact path they tried to reach. Until the env var is
// set, redirects() returns [] and nothing changes.
const primaryDomain = process.env.NEXT_PUBLIC_PRIMARY_DOMAIN
const legacyHost = 'mama-system.vercel.app'

const nextConfig: NextConfig = {
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
