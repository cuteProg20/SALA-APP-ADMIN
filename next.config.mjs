const api = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';
const supa = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const csp = [
  "default-src 'self'", "img-src 'self' data: https:", "style-src 'self' 'unsafe-inline'",
  // Next.js needs inline scripts for hydration; tighten with nonces once on a stable deployment.
  "script-src 'self' 'unsafe-inline'" + (process.env.NODE_ENV === 'production' ? '' : " 'unsafe-eval'"),
  `connect-src 'self' ${api} ${supa}`, "frame-ancestors 'none'", "base-uri 'self'", "form-action 'self'",
].join('; ');

export default {
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: [
      { key: 'Content-Security-Policy', value: csp },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'same-origin' },
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
    ] }];
  },
};
