import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getBlocos, getConfig, getPagina, getPlanos, getProdutos } from '@/lib/cms';
import { urlMidia } from '@/lib/cms';
import { RenderBlocos } from './blocos';

/**
 * Renderiza uma pagina do CMS pelo slug. As rotas fixas do site (/, /sobre,
 * /produtos, /planos, /contato) sao so uma casca chamando isto — o conteudo
 * inteiro vem do banco e e editavel em /admin/paginas.
 */
export async function PaginaCms({ slug }: { slug: string }) {
  const pagina = await getPagina(slug);
  if (!pagina || !pagina.publicada) notFound();

  const [blocos, produtos, planos, config] = await Promise.all([
    getBlocos(pagina.id),
    getProdutos(),
    getPlanos(),
    getConfig(),
  ]);

  return <RenderBlocos blocos={blocos} produtos={produtos} planos={planos} config={config} />;
}

/** Metadata (SEO) da pagina do CMS. */
export async function metadataCms(slug: string): Promise<Metadata> {
  const pagina = await getPagina(slug);
  if (!pagina) return {};
  const imagem = urlMidia(pagina.seo_imagem);
  return {
    title: pagina.seo_titulo || pagina.titulo,
    description: pagina.seo_descricao || undefined,
    alternates: { canonical: slug === 'home' ? '/' : `/${slug}` },
    openGraph: {
      title: pagina.seo_titulo || pagina.titulo,
      description: pagina.seo_descricao || undefined,
      images: imagem ? [imagem] : undefined,
    },
  };
}
