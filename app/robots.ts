import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  const base = (process.env.SITE_URL || 'http://localhost:3010').replace(/\/+$/, '');
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api'] }],
    sitemap: `${base}/sitemap.xml`,
  };
}
