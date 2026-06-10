import type { MetadataRoute } from 'next'

const BASE = 'https://www.f-1careers.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Keep private app, API, and auth routes out of the index.
      disallow: [
        '/api/', '/admin', '/dashboard', '/profile', '/strategy', '/rfe',
        '/petition-builder', '/career-moves', '/subscribe', '/filing-guide',
        '/print', '/login', '/signup',
      ],
    },
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  }
}
