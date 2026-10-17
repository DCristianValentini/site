import 'server-only';
import type { Bloco, ConfigSite, Pagina, Plano, PlanoItem, Produto, ProdutoRecurso, Tema } from './tipos';
import { TEMA_PADRAO, montarConfig, urlMidia } from './cms-padroes';

export { TEMA_PADRAO, urlMidia };

/**
 * Leitura do conteudo para o SITE PUBLICO ESTATICO (GitHub Pages). Roda so na hora do
 * build: le o Supabase pela chave PUBLICAVEL (a RLS so deixa passar o que o site mostra) e
 * o HTML sai pronto. Este arquivo substitui `cms.ts` no pacote publico (ver
 * `scripts/montar-publico.mjs`); o painel, que usa o banco por `pg`, nao passa por aqui.
 *
 * Boolean volta do PostgREST como true/false; o resto do codigo foi escrito para 1/0
 * (herdado do MySQL), entao converte-se aqui — e so aqui.
 */

const BOOLEANAS = new Set(['ativo', 'publicada', 'sistema', 'destaque', 'incluso', 'grao', 'grade', 'visivel', 'lido']);

function base(): { url: string; chave: string } {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/+$/, '');
  const chave = process.env.NEXT_PUBLIC_SUPABASE_KEY || '';
  if (!url || !chave) throw new Error('NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_KEY sao necessarias para gerar o site.');
  return { url, chave };
}

function normaliza<T>(linha: Record<string, unknown>): T {
  const o: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(linha)) o[k] = BOOLEANAS.has(k) && typeof v === 'boolean' ? (v ? 1 : 0) : v;
  return o as T;
}

async function ler<T>(tabela: string, consulta = ''): Promise<T[]> {
  const { url, chave } = base();
  const res = await fetch(`${url}/rest/v1/${tabela}?select=*${consulta ? '&' + consulta : ''}`, {
    headers: { apikey: chave, Authorization: `Bearer ${chave}` },
    cache: 'force-cache', // so roda no build estatico; `no-store` e recusado em rota force-static
  });
  if (!res.ok) throw new Error(`Supabase respondeu ${res.status} em ${tabela}: ${(await res.text()).slice(0, 200)}`);
  return ((await res.json()) as Record<string, unknown>[]).map((l) => normaliza<T>(l));
}

export async function getTema(): Promise<Tema> {
  const [row] = await ler<Tema>('tema', 'id=eq.1');
  return { ...TEMA_PADRAO, ...(row ?? {}) };
}

export async function getConfig(): Promise<ConfigSite> {
  return montarConfig(await ler<{ chave: string; valor: unknown }>('config'));
}

export async function getPagina(slug: string): Promise<Pagina | null> {
  const [p] = await ler<Pagina>('paginas', `slug=eq.${encodeURIComponent(slug)}&limit=1`);
  return p ?? null;
}

export async function getPaginas(): Promise<Pagina[]> {
  return ler<Pagina>('paginas', 'order=ordem.asc,id.asc');
}

export async function getBlocos(paginaId: number): Promise<Bloco[]> {
  const rows = await ler<Bloco>('blocos', `pagina_id=eq.${paginaId}&order=ordem.asc,id.asc`);
  return rows.map((b) => ({ ...b, dados: (typeof b.dados === 'string' ? JSON.parse(b.dados as unknown as string) : b.dados) ?? {} }));
}

export async function getProdutos(): Promise<Produto[]> {
  return ler<Produto>('produtos', 'order=ordem.asc,id.asc');
}

export async function getRecursos(produtoId: number): Promise<ProdutoRecurso[]> {
  return ler<ProdutoRecurso>('produto_recursos', `produto_id=eq.${produtoId}&order=ordem.asc,id.asc`);
}

export async function getProduto(slug: string): Promise<Produto | null> {
  const [p] = await ler<Produto>('produtos', `slug=eq.${encodeURIComponent(slug)}&limit=1`);
  if (!p) return null;
  p.recursos = await getRecursos(p.id);
  return p;
}

export async function getPlanos(): Promise<Plano[]> {
  const planos = await ler<Plano>('planos', 'order=ordem.asc,id.asc');
  if (!planos.length) return [];
  const itens = await ler<PlanoItem>('plano_itens', `plano_id=in.(${planos.map((p) => p.id).join(',')})&order=ordem.asc,id.asc`);
  return planos.map((p) => ({ ...p, itens: itens.filter((i) => i.plano_id === p.id) }));
}
