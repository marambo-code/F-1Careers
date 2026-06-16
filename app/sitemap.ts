import type { MetadataRoute } from 'next'

const BASE = 'https://www.f-1careers.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const pages: { path: string; priority: number; freq: 'weekly' | 'monthly' }[] = [
    { path: '', priority: 1.0, freq: 'weekly' },
    { path: '/explorer', priority: 0.8, freq: 'monthly' },
    { path: '/stay-score', priority: 0.8, freq: 'monthly' },
    { path: '/for-employers', priority: 0.7, freq: 'monthly' },
    { path: '/cohort', priority: 0.6, freq: 'monthly' },
    { path: '/privacy', priority: 0.3, freq: 'monthly' },
    { path: '/terms', priority: 0.3, freq: 'monthly' },
  ]
  return pages.map(p => ({
    url: `${BASE}${p.path}`,
    lastModified: now,
    changeFrequency: p.freq,
    priority: p.priority,
  }))
}
