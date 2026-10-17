import { ErroAuth, chavePublica, tokenValido, urlSupabase } from './admin-auth';
import { montarConfig, TEMA_PADRAO } from './cms-padroes';
import type { Bloco, ConfigSite, Lead, Midia, Pagina, Plano, PlanoItem, Produto, ProdutoRecurso, Tema } from './tipos';

/**
 * Acesso ao banco pelo painel: PostgREST do Supabase com o JWT do usuario logado. A RLS decide
 * o que passa — aqui nao ha filtro de seguranca, so conveniencia. Leituras devolvem boolean
 * como 1/0 (o resto do codigo, herdado do MySQL, trabalha assim).
 */

const BOOLEANAS = new Set(['ativo', 'publicada', 'sistema', 'destaque', 'incluso', 'grao', 'grade', 'visivel', 'lido']);

export class ErroBanco extends Error {
  status: number;
  constructor(mensagem: string, status = 400) {
    super(mensagem);
    this.status = status;
  }
}

function normaliza<T>(linha: Record<string, unknown>): T {
  const o: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(linha)) o[k] = BOOLEANAS.has(k) && typeof v === 'boolean' ? (v ? 1 : 0) : v;
  return o as T;
}

function mensagemDoErro(status: number, j: { message?: string; code?: string }): string {
  if (j.code === '23505') return 'Já existe um registro com esse valor.';
  if (j.code === '23503') return 'Esse registro é usado em outro lugar.';
  if (j.code === '42501' || status === 403) return 'Você não tem permissão para isso.';
  if (status === 401 || j.code === 'PGRST301') return 'Sessão expirada. Entre novamente.';
  return j.message ? `Erro do banco: ${j.message}` : `Falha na requisição (${status}).`;
}

export async function rest<T = unknown>(
  tabela: string,
  op: { metodo?: 'GET' | 'POST' | 'PATCH' | 'DELETE'; consulta?: string; corpo?: unknown; retorno?: boolean; upsert?: string } = {},
): Promise<T> {
  const token = await tokenValido();
  const metodo = op.metodo ?? 'GET';
  const prefer: string[] = [];
  if (op.retorno) prefer.push('return=representation');
  if (op.upsert) prefer.push('resolution=merge-duplicates');
  const url = `${urlSupabase()}/rest/v1/${tabela}${op.consulta ? '?' + op.consulta : ''}`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: metodo,
      headers: {
        apikey: chavePublica(),
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(prefer.length ? { Prefer: prefer.join(',') } : {}),
      },
      body: op.corpo === undefined ? undefined : JSON.stringify(op.corpo),
      cache: 'no-store',
    });
  } catch (e) {
    if (e instanceof ErroAuth) throw e;
    throw new ErroBanco('Sem conexão com o servidor. Tente de novo.', 0);
  }
  if (!res.ok) {
    const j = (await res.json().catch(() => ({}))) as { message?: string; code?: string };
    throw new ErroBanco(mensagemDoErro(res.status, j), res.status);
  }
  if (res.status === 204) return undefined as T;
  const txt = await res.text();
  return (txt ? JSON.parse(txt) : undefined) as T;
}

async function lerLinhas<T>(tabela: string, consulta = ''): Promise<T[]> {
  const rows = await rest<Record<string, unknown>[]>(tabela, { consulta: `select=*${consulta ? '&' + consulta : ''}` });
  return rows.map((l) => normaliza<T>(l));
}

export async function listarPaginas(): Promise<Pagina[]> {
  return lerLinhas<Pagina>('paginas', 'order=ordem.asc,id.asc');
}

export async function paginaPorId(id: number): Promise<Pagina | null> {
  return (await lerLinhas<Pagina>('paginas', `id=eq.${id}&limit=1`))[0] ?? null;
}

/** Todos os blocos da pagina, inclusive os ocultos. */
export async function listarBlocos(paginaId: number): Promise<Bloco[]> {
  const rows = await lerLinhas<Bloco>('blocos', `pagina_id=eq.${paginaId}&order=ordem.asc,id.asc`);
  return rows.map((b) => ({ ...b, dados: (typeof b.dados === 'string' ? JSON.parse(b.dados as unknown as string) : b.dados) ?? {} }));
}

export async function listarProdutos(): Promise<Produto[]> {
  const [produtos, recursos] = await Promise.all([
    lerLinhas<Produto>('produtos', 'order=ordem.asc,id.asc'),
    lerLinhas<ProdutoRecurso>('produto_recursos', 'order=ordem.asc,id.asc'),
  ]);
  return produtos.map((p) => ({ ...p, recursos: recursos.filter((r) => r.produto_id === p.id) }));
}

export async function listarPlanos(): Promise<Plano[]> {
  const [planos, itens] = await Promise.all([
    lerLinhas<Plano>('planos', 'order=ordem.asc,id.asc'),
    lerLinhas<PlanoItem>('plano_itens', 'order=ordem.asc,id.asc'),
  ]);
  return planos.map((p) => ({ ...p, itens: itens.filter((i) => i.plano_id === p.id) }));
}

export async function listarMidias(): Promise<Midia[]> {
  return lerLinhas<Midia>('midias', 'order=criado_em.desc,id.desc&limit=300');
}

export async function listarLeads(): Promise<Lead[]> {
  return lerLinhas<Lead>('leads', 'order=criado_em.desc,id.desc&limit=500');
}

export async function contarNaoLidas(): Promise<number> {
  const rows = await rest<{ id: number }[]>('leads', { consulta: 'select=id&lido=eq.false' });
  return rows.length;
}

export async function configAdmin(): Promise<ConfigSite> {
  return montarConfig(await rest<{ chave: string; valor: unknown }[]>('config', { consulta: 'select=chave,valor' }));
}

export async function temaAdmin(): Promise<Tema> {
  const [row] = await lerLinhas<Tema>('tema', 'id=eq.1');
  return { ...TEMA_PADRAO, ...(row ?? {}) };
}
