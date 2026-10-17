/**
 * Login do painel (/admin), feito no navegador contra o Supabase Auth (e-mail + senha).
 * Sem supabase-js: sao tres chamadas REST. A sessao fica no localStorage; o token de acesso
 * dura 1h e e renovado com o refresh token. Quem manda de verdade e o banco: sem o JWT de
 * um usuario listado em `public.admins`, a RLS nega toda escrita (e a leitura do que e privado).
 */

export interface Sessao {
  id: string;
  email: string;
  papel: 'admin' | 'editor';
}

interface Guardada {
  access_token: string;
  refresh_token: string;
  expira_em: number; // epoch, segundos
  id: string;
  email: string;
}

const CHAVE_LS = 'site_admin_sessao';

export function urlSupabase(): string {
  return (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/+$/, '');
}
export function chavePublica(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_KEY || '';
}

export class ErroAuth extends Error {
  status: number;
  constructor(mensagem: string, status = 401) {
    super(mensagem);
    this.status = status;
  }
}

function ler(): Guardada | null {
  try {
    const s = localStorage.getItem(CHAVE_LS);
    return s ? (JSON.parse(s) as Guardada) : null;
  } catch {
    return null;
  }
}
function gravar(g: Guardada | null) {
  try {
    if (g) localStorage.setItem(CHAVE_LS, JSON.stringify(g));
    else localStorage.removeItem(CHAVE_LS);
  } catch {
    /* navegador sem storage: a sessao vale so ate recarregar */
  }
}

async function autenticar(corpo: Record<string, string>, tipo: 'password' | 'refresh_token'): Promise<Guardada> {
  const res = await fetch(`${urlSupabase()}/auth/v1/token?grant_type=${tipo}`, {
    method: 'POST',
    headers: { apikey: chavePublica(), 'Content-Type': 'application/json' },
    body: JSON.stringify(corpo),
  });
  const j = (await res.json().catch(() => ({}))) as {
    access_token?: string; refresh_token?: string; expires_at?: number; expires_in?: number;
    user?: { id: string; email?: string }; error_code?: string; msg?: string; error_description?: string;
  };
  if (!res.ok || !j.access_token || !j.refresh_token || !j.user) {
    if (res.status === 400 || res.status === 401) {
      throw new ErroAuth(tipo === 'password' ? 'E-mail ou senha incorretos.' : 'Sessão expirada. Entre novamente.', 401);
    }
    throw new ErroAuth(j.msg || j.error_description || `Falha ao autenticar (${res.status}).`, res.status);
  }
  return {
    access_token: j.access_token,
    refresh_token: j.refresh_token,
    expira_em: j.expires_at ?? Math.floor(Date.now() / 1000) + (j.expires_in ?? 3600),
    id: j.user.id,
    email: j.user.email ?? '',
  };
}

/** Token de acesso valido (renova se faltar menos de 1 min). Lanca ErroAuth se nao ha sessao. */
export async function tokenValido(): Promise<string> {
  const g = ler();
  if (!g) throw new ErroAuth('Sessão expirada. Entre novamente.');
  if (g.expira_em - 60 > Math.floor(Date.now() / 1000)) return g.access_token;
  try {
    const nova = await autenticar({ refresh_token: g.refresh_token }, 'refresh_token');
    gravar(nova);
    return nova.access_token;
  } catch (e) {
    gravar(null);
    throw e;
  }
}

async function papelDe(token: string, id: string): Promise<'admin' | 'editor' | null> {
  const res = await fetch(`${urlSupabase()}/rest/v1/admins?select=papel&user_id=eq.${encodeURIComponent(id)}`, {
    headers: { apikey: chavePublica(), Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const rows = (await res.json().catch(() => [])) as { papel: 'admin' | 'editor' }[];
  return rows[0]?.papel ?? null;
}

/** Sessao atual conferida no banco (papel vem de `admins`); null se nao logado ou sem acesso. */
export async function sessaoAtual(): Promise<Sessao | null> {
  const g = ler();
  if (!g) return null;
  try {
    const token = await tokenValido();
    const atual = ler() ?? g;
    const papel = await papelDe(token, atual.id);
    if (!papel) return null;
    return { id: atual.id, email: atual.email, papel };
  } catch {
    return null;
  }
}

export async function entrar(email: string, senha: string): Promise<Sessao> {
  const g = await autenticar({ email: email.trim(), password: senha }, 'password');
  const papel = await papelDe(g.access_token, g.id);
  if (!papel) {
    // credencial valida no Auth, mas fora da lista de quem edita o site
    gravar(null);
    throw new ErroAuth('Este usuário não tem acesso ao painel do site.', 403);
  }
  gravar(g);
  return { id: g.id, email: g.email, papel };
}

export async function sair(): Promise<void> {
  const g = ler();
  gravar(null);
  if (!g) return;
  try {
    await fetch(`${urlSupabase()}/auth/v1/logout`, {
      method: 'POST',
      headers: { apikey: chavePublica(), Authorization: `Bearer ${g.access_token}` },
    });
  } catch {
    /* sem rede: a sessao local ja foi apagada */
  }
}
