// Funcoes PURAS dos planos por produto (sem React, sem banco): agrupamento, produto inicial do seletor,
// leitura de `?produto=` / `?interesse=` e o link do botao "Pedir proposta". Testadas em test/planos.test.mts.
import type { Plano } from './tipos';

export interface ProdutoMin {
  slug: string;
  nome: string;
  ordem?: number;
}

export interface GrupoPlanos {
  /** slug do produto; `null` = planos sem produto (ou de produto que nao esta no ar) */
  slug: string | null;
  nome: string;
  planos: Plano[];
}

export const GRUPO_GERAL = 'geral';
export const PRODUTO_PADRAO = 'erp';
const SLUG = /^[a-z0-9][a-z0-9-]{0,79}$/i;

/**
 * Agrupa os planos por produto, na ordem dos produtos (ordem asc, depois a do cadastro). So entra produto que
 * tem plano; plano sem produto, ou de um slug que nao e produto ativo, cai em "Planos gerais" (sempre por ultimo).
 * Dentro do grupo vale a ordem dos planos. Nao muta a entrada.
 */
export function agruparPlanos(planos: Plano[], produtos: ProdutoMin[]): GrupoPlanos[] {
  const porSlug = new Map(produtos.map((p, i) => [p.slug, { ...p, pos: i }]));
  const ordenados = [...planos].sort((a, b) => (a.ordem - b.ordem) || (a.id - b.id));
  const grupos = new Map<string, GrupoPlanos>();
  const gerais: Plano[] = [];
  for (const pl of ordenados) {
    const slug = (pl.produto_slug ?? '').trim();
    const produto = slug ? porSlug.get(slug) : undefined;
    if (!produto) {
      gerais.push(pl);
      continue;
    }
    const g = grupos.get(slug) ?? { slug, nome: produto.nome, planos: [] };
    g.planos.push(pl);
    grupos.set(slug, g);
  }
  const lista = [...grupos.values()].sort((a, b) => (porSlug.get(a.slug!)!.pos) - (porSlug.get(b.slug!)!.pos));
  if (gerais.length) lista.push({ slug: null, nome: 'Planos gerais', planos: gerais });
  return lista;
}

/** Identificador do grupo no HTML (ancora e abas): slug do produto ou "geral". */
export const idGrupo = (g: Pick<GrupoPlanos, 'slug'>): string => g.slug ?? GRUPO_GERAL;

/** Valor de um parametro da query string (`?a=b`), so se parecer um slug; senao `null`. Nunca lanca. */
export function lerParametro(search: string | null | undefined, nome: string): string | null {
  try {
    const v = new URLSearchParams(String(search ?? '')).get(nome);
    if (v === null) return null;
    const t = v.trim();
    return SLUG.test(t) ? t.toLowerCase() : null;
  } catch {
    return null;
  }
}

/** `?produto=` -> slug valido ou null. */
export const parseProdutoParam = (search: string | null | undefined): string | null => lerParametro(search, 'produto');

/** `#plano-<slug>` -> slug ou null (a ancora do HTML sem JavaScript tambem escolhe a aba). */
export function parseHashPlano(hash: string | null | undefined): string | null {
  const m = /^#?plano-([a-z0-9][a-z0-9-]{0,79})$/i.exec(String(hash ?? '').trim());
  return m ? m[1].toLowerCase() : null;
}

/**
 * Aba inicial: o primeiro candidato (ex.: `?produto=`, depois `#plano-...`) que existe entre os grupos; senao o ERP;
 * senao o primeiro grupo. Candidato desconhecido e ignorado (nunca deixa a pagina sem aba).
 */
export function produtoInicial(ids: string[], ...candidatos: Array<string | null | undefined>): string | null {
  if (!ids.length) return null;
  for (const c of candidatos) if (c && ids.includes(c)) return c;
  return ids.includes(PRODUTO_PADRAO) ? PRODUTO_PADRAO : ids[0];
}

/** Proxima aba por teclado (padrao WAI-ARIA, ativacao automatica). `null` = tecla que nao navega. */
export function abaPorTecla(tecla: string, atual: number, total: number): number | null {
  if (total <= 0) return null;
  switch (tecla) {
    case 'ArrowRight':
    case 'ArrowDown':
      return (atual + 1) % total;
    case 'ArrowLeft':
    case 'ArrowUp':
      return (atual - 1 + total) % total;
    case 'Home':
      return 0;
    case 'End':
      return total - 1;
    default:
      return null;
  }
}

/** Query string da pagina com o produto escolhido, preservando os outros parametros. */
export function comProduto(search: string | null | undefined, slug: string): string {
  const p = new URLSearchParams(String(search ?? ''));
  p.set('produto', slug);
  return `?${p.toString()}`;
}

/**
 * Destino do botao do plano. Plano de produto cujo link e o padrao ("/contato" ou vazio) leva a `/contato?interesse=<slug>`:
 * o formulario pre-seleciona o campo "Interesse". Link personalizado no cadastro e respeitado como esta.
 */
export function hrefCta(plano: Pick<Plano, 'cta_url' | 'produto_slug'>): string {
  const url = (plano.cta_url ?? '').trim();
  const slug = (plano.produto_slug ?? '').trim();
  if ((!url || url === '/contato') && SLUG.test(slug)) return `/contato?interesse=${encodeURIComponent(slug)}`;
  return url || '/contato';
}

/** Valor do campo "Interesse" (nome do produto) para um `?interesse=<slug>`; `null` se o slug nao e de um produto da lista. */
export function interessePorSlug(search: string | null | undefined, produtos: ProdutoMin[]): string | null {
  const slug = lerParametro(search, 'interesse');
  if (!slug) return null;
  return produtos.find((p) => p.slug === slug)?.nome ?? null;
}
