import type { ConfigSite, Contato, Identidade, Nav, Redes, Seo, Tema } from './tipos';

/**
 * Padroes e funcoes PURAS do conteudo (sem banco): usados pelo painel (`cms.ts`, via pg) e
 * pelo site publico estatico (`cms.publico.ts`, via REST). Tudo com defaults, para a pagina
 * nunca quebrar se uma chave de config ainda nao existir.
 */

export const TEMA_PADRAO: Tema = {
  cor_fundo: '#0A0B0E',
  cor_superficie: '#14161C',
  cor_superficie_2: '#1C1F27',
  cor_texto: '#F1EEE8',
  cor_texto_suave: '#9A9BA6',
  cor_acento: '#FF7A2F',
  cor_acento_texto: '#150A03',
  cor_acento_2: '#7FE7C4',
  cor_linha: 'rgba(255,255,255,0.09)',
  fonte_display: 'Bricolage Grotesque',
  fonte_corpo: 'Instrument Sans',
  raio: '14px',
  largura: '1200px',
  grao: 1,
  grade: 1,
};

const IDENTIDADE_PADRAO: Identidade = {
  nome: 'Sua Empresa',
  sigla: 'SE',
  tagline: 'Software de gestão sob medida',
  descricao: '',
  logo: null,
};

const CONTATO_PADRAO: Contato = {
  email: '', telefone: '', whatsapp: '', endereco: '', cidade: '', horario: '', cnpj: '',
};

const REDES_PADRAO: Redes = { instagram: '', linkedin: '', facebook: '', youtube: '', github: '' };

const SEO_PADRAO: Seo = { titulo: '', descricao: '', imagem: null };

const NAV_PADRAO: Nav = {
  itens: [
    { label: 'Produtos', href: '/produtos' },
    { label: 'Planos', href: '/planos' },
    { label: 'Sobre', href: '/sobre' },
    { label: 'Contato', href: '/contato' },
  ],
  cta_texto: 'Falar com especialista',
  cta_url: '/contato',
};

/** Junta as linhas de `config` (chave -> valor JSON) com os padroes. */
export function montarConfig(rows: { chave: string; valor: unknown }[]): ConfigSite {
  const mapa = new Map<string, Record<string, unknown>>();
  for (const r of rows) {
    const v = typeof r.valor === 'string' ? JSON.parse(r.valor) : r.valor;
    mapa.set(r.chave, (v ?? {}) as Record<string, unknown>);
  }
  return {
    identidade: { ...IDENTIDADE_PADRAO, ...(mapa.get('identidade') ?? {}) } as Identidade,
    contato: { ...CONTATO_PADRAO, ...(mapa.get('contato') ?? {}) } as Contato,
    redes: { ...REDES_PADRAO, ...(mapa.get('redes') ?? {}) } as Redes,
    seo: { ...SEO_PADRAO, ...(mapa.get('seo') ?? {}) } as Seo,
    nav: { ...NAV_PADRAO, ...(mapa.get('nav') ?? {}) } as Nav,
  };
}

/**
 * URL publica de um arquivo (ou o proprio valor, se ja for URL). O arquivo mora no
 * Storage do Supabase (bucket publico `site-midias`); sem `SUPABASE_URL` configurada,
 * cai na rota antiga /midia (arquivos em disco).
 */
/**
 * URL de uma tela do sistema (print real do console). Os prints moram no Storage do Supabase
 * (bucket publico `site-midias`, pasta `telas/`): trocar um print = reenviar o arquivo com o mesmo
 * nome (`node scripts/enviar-telas.mjs`), sem novo deploy. Sem a URL do Supabase no ambiente
 * (dev sem .env), cai em /telas/<arquivo> de public/, com o prefixo do Pages (SITE_BASE_PATH).
 */
export function urlTela(arquivo: string | null | undefined): string | null {
  if (!arquivo || !/^[a-z0-9._-]+$/i.test(arquivo)) return null;
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '').replace(/\/+$/, '');
  if (base) return `${base}/storage/v1/object/public/site-midias/telas/${arquivo}`;
  return `${(process.env.SITE_BASE_PATH || '').replace(/\/+$/, '')}/telas/${arquivo}`;
}

export function urlMidia(arquivo: string | null | undefined): string | null {
  if (!arquivo) return null;
  if (/^https?:\/\//i.test(arquivo)) return arquivo;
  const limpo = String(arquivo).replace(/^\/+/, '');
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '').replace(/\/+$/, '');
  return base ? `${base}/storage/v1/object/public/site-midias/${limpo}` : `/midia/${limpo}`;
}
