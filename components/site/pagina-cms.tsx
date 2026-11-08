import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getBlocos, getConfig, getPagina, getPlanos, getProdutos } from '@/lib/cms';
import { urlMidia } from '@/lib/cms';
import { RenderBlocos } from './blocos';
import { descricaoSeo, tituloSeo } from '@/lib/seo';

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

  // Toda pagina tem UM h1. O heroi o traz; pagina montada so com outros blocos (ex.: Contato) ficaria sem
  // titulo para o leitor de tela e para o buscador, entao ganha um h1 invisivel com o titulo da pagina.
  const temHeroi = blocos.some((b) => b.tipo === 'hero');
  return (
    <>
      {!temHeroi && <h1 className="sr-only">{pagina.titulo}</h1>}
      <RenderBlocos blocos={blocos} produtos={produtos} planos={planos} config={config} />
    </>
  );
}

/** Metadata (SEO) da pagina do CMS. */
export async function metadataCms(slug: string): Promise<Metadata> {
  const pagina = await getPagina(slug);
  if (!pagina) return {};
  const imagem = urlMidia(pagina.seo_imagem);
  return {
    title: tituloSeo({ seoTitulo: pagina.seo_titulo, nome: pagina.titulo }),
    description: descricaoSeo(pagina.seo_descricao) || undefined,
    alternates: { canonical: slug === 'home' ? '/' : `/${slug}` },
    openGraph: {
      title: tituloSeo({ seoTitulo: pagina.seo_titulo, nome: pagina.titulo }),
      description: descricaoSeo(pagina.seo_descricao) || undefined,
      images: imagem ? [imagem] : undefined,
    },
  };
}
