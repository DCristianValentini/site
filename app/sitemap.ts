import type { MetadataRoute } from 'next';
import { getPaginas, getProdutos } from '@/lib/cms';

export const dynamic = 'force-static';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.SITE_URL || 'http://localhost:3010').replace(/\/+$/, '');
  const [paginas, produtos] = await Promise.all([getPaginas(), getProdutos()]);

  const rotas: MetadataRoute.Sitemap = paginas
    .filter((p) => p.publicada)
    .map((p) => ({
      url: `${base}${p.slug === 'home' ? '' : `/${p.slug}`}`,
      changeFrequency: 'monthly',
      priority: p.slug === 'home' ? 1 : 0.8,
    }));

  for (const p of produtos) {
    rotas.push({ url: `${base}/produtos/${p.slug}`, changeFrequency: 'monthly', priority: 0.7 });
  }
  return rotas;
}
