import { chavePublica, tokenValido, urlSupabase } from './admin-auth';
import { ErroBanco, listarMidias, rest } from './admin-dados';
import { bool, ErroApi, idDaRota, inteiro, normalizarDadosBloco, texto } from './normalizar';
import { sanitizarHtml } from './sanitize';
import { tipoBloco } from './blocos';
import { TEMA_PADRAO } from './cms-padroes';
import { FONTES_CORPO, FONTES_DISPLAY } from '@/app/fontes';
import { prepararImagem } from './imagem-cliente';
import type { Dados } from './tipos';

/**
 * O "backend" do painel. Cada chamada `cli.<metodo>('/api/admin/...')` dos editores cai aqui e
 * vira uma ou mais chamadas ao Supabase, no navegador, com o JWT do usuario. As regras (o que
 * recortar, o que sanitizar, quem pode excluir) seguem as das antigas rotas de servidor; o que
 * nao pode depender do navegador (quem escreve, quem exclui) esta na RLS do banco.
 */

type Entrada = Record<string, unknown>;

const ORDEM_IDS = (v: unknown): number[] => (Array.isArray(v) ? v.map(Number).filter(Number.isInteger) : []);

const slugDe = (nome: string) =>
  nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);

async function proximaOrdem(tabela: string, filtro = ''): Promise<number> {
  const r = await rest<{ ordem: number }[]>(tabela, { consulta: `select=ordem&order=ordem.desc&limit=1${filtro}` });
  return (r[0]?.ordem ?? 0) + 1;
}

async function reordenar(tabela: string, ids: number[]) {
  await Promise.all(ids.map((id, i) => rest(tabela, { metodo: 'PATCH', consulta: `id=eq.${id}`, corpo: { ordem: i + 1 } })));
}

/**
 * Troca uma lista-filha inteira. Insere o conjunto novo ANTES de apagar o antigo: se a
 * insercao falhar, nada se perde (sem transacao no navegador, esta e a ordem segura).
 */
async function substituirFilhos(tabela: string, fk: string, id: number, novos: Entrada[]) {
  const antigos = await rest<{ id: number }[]>(tabela, { consulta: `select=id&${fk}=eq.${id}` });
  if (novos.length) await rest(tabela, { metodo: 'POST', corpo: novos });
  if (antigos.length) {
    await rest(tabela, { metodo: 'DELETE', consulta: `id=in.(${antigos.map((a) => a.id).join(',')})` });
  }
}

// ---- produtos
async function produtoCriar(b: Entrada) {
  const nome = texto(b.nome, 120);
  if (!nome) throw new ErroApi('Informe o nome do produto.', 422);
  const base = texto(b.slug, 80) ?? slugDe(nome);
  let slug = base || 'produto';
  for (let i = 2; ; i++) {
    const ja = await rest<unknown[]>('produtos', { consulta: `select=id&slug=eq.${encodeURIComponent(slug)}&limit=1` });
    if (!ja.length) break;
    if (i > 50) throw new ErroApi('Não consegui gerar um endereço único.');
    slug = `${base || 'produto'}-${i}`;
  }
  const [novo] = await rest<{ id: number }[]>('produtos', {
    metodo: 'POST', retorno: true,
    corpo: { slug, nome, ordem: await proximaOrdem('produtos'), ativo: true },
  });
  return { id: novo.id, slug };
}

async function produtoSalvar(id: number, b: Entrada) {
  const nome = texto(b.nome, 120);
  if (!nome) throw new ErroApi('Informe o nome do produto.', 422);
  const slug = texto(b.slug, 80);
  if (!slug) throw new ErroApi('Informe o endereço (slug) do produto.', 422);
  const conflito = await rest<unknown[]>('produtos', { consulta: `select=id&slug=eq.${encodeURIComponent(slug)}&id=neq.${id}&limit=1` });
  if (conflito.length) throw new ErroApi('Já existe outro produto com esse endereço.', 422);

  await rest('produtos', {
    metodo: 'PATCH', consulta: `id=eq.${id}`,
    corpo: {
      slug, nome,
      sigla: texto(b.sigla, 8), categoria: texto(b.categoria, 60), linha: texto(b.linha, 60), area: texto(b.area, 60), tagline: texto(b.tagline, 200),
      resumo: texto(b.resumo, 500),
      descricao: sanitizarHtml(typeof b.descricao === 'string' ? b.descricao : ''),
      cor: texto(b.cor, 20), imagem: texto(b.imagem, 255), plataformas: texto(b.plataformas, 160),
      destaque: bool(b.destaque), ativo: bool(b.ativo),
      seo_titulo: texto(b.seo_titulo, 190), seo_descricao: texto(b.seo_descricao, 320),
    },
  });

  if (Array.isArray(b.recursos)) {
    const recursos = (b.recursos as Dados[]).slice(0, 200);
    const novos: Entrada[] = [];
    recursos.forEach((r, i) => {
      const titulo = texto(r.titulo, 160);
      if (!titulo) return;
      novos.push({
        produto_id: id, titulo, descricao: texto(r.descricao, 2000), icone: texto(r.icone, 40),
        grupo: texto(r.grupo, 60), ordem: inteiro(r.ordem, i + 1),
      });
    });
    await substituirFilhos('produto_recursos', 'produto_id', id, novos);
  }
  return { ok: true };
}

// ---- planos
async function planoCriar(b: Entrada) {
  const nome = texto(b.nome, 80);
  if (!nome) throw new ErroApi('Informe o nome do plano.', 422);
  const [novo] = await rest<{ id: number }[]>('planos', {
    metodo: 'POST', retorno: true,
    corpo: { nome, preco: 'Sob consulta', periodo: 'por mês', ordem: await proximaOrdem('planos'), ativo: true },
  });
  return { id: novo.id };
}

async function planoSalvar(id: number, b: Entrada) {
  const nome = texto(b.nome, 80);
  if (!nome) throw new ErroApi('Informe o nome do plano.', 422);
  await rest('planos', {
    metodo: 'PATCH', consulta: `id=eq.${id}`,
    corpo: {
      nome, descricao: texto(b.descricao, 300), preco: texto(b.preco, 40), periodo: texto(b.periodo, 40),
      observacao: texto(b.observacao, 200), cta_texto: texto(b.cta_texto, 60), cta_url: texto(b.cta_url, 255),
      destaque: bool(b.destaque), ativo: bool(b.ativo),
    },
  });
  if (Array.isArray(b.itens)) {
    const novos: Entrada[] = [];
    (b.itens as Dados[]).slice(0, 100).forEach((it, i) => {
      const t = texto(it.texto, 200);
      if (t) novos.push({ plano_id: id, texto: t, incluso: bool(it.incluso), ordem: i + 1 });
    });
    await substituirFilhos('plano_itens', 'plano_id', id, novos);
  }
  return { ok: true };
}

// ---- blocos
async function blocoCriar(b: Entrada) {
  const paginaId = inteiro(b.pagina_id);
  const tipo = String(b.tipo ?? '');
  const t = tipoBloco(tipo);
  if (!t) throw new ErroApi('Tipo de bloco inválido.');
  const pag = await rest<unknown[]>('paginas', { consulta: `select=id&id=eq.${paginaId}&limit=1` });
  if (!pag.length) throw new ErroApi('Página não encontrada.', 404);
  const [novo] = await rest<{ id: number }[]>('blocos', {
    metodo: 'POST', retorno: true,
    corpo: {
      pagina_id: paginaId, tipo, dados: normalizarDadosBloco(tipo, t.padroes),
      ordem: await proximaOrdem('blocos', `&pagina_id=eq.${paginaId}`), visivel: true,
    },
  });
  return { id: novo.id };
}

async function blocoSalvar(id: number, b: Entrada) {
  const bl = await rest<{ tipo: string }[]>('blocos', { consulta: `select=tipo&id=eq.${id}&limit=1` });
  if (!bl.length) throw new ErroApi('Bloco não encontrado.', 404);
  const dados = normalizarDadosBloco(bl[0].tipo, b.dados);
  await rest('blocos', { metodo: 'PATCH', consulta: `id=eq.${id}`, corpo: { dados, visivel: bool(b.visivel) } });
  return { ok: true, dados };
}

// ---- paginas / leads / midias
async function paginaSalvar(id: number, b: Entrada) {
  await rest('paginas', {
    metodo: 'PATCH', consulta: `id=eq.${id}`,
    corpo: {
      titulo: texto(b.titulo, 160) ?? 'Sem título', seo_titulo: texto(b.seo_titulo, 190),
      seo_descricao: texto(b.seo_descricao, 320), seo_imagem: texto(b.seo_imagem, 255), publicada: bool(b.publicada),
    },
  });
  return { ok: true };
}

async function midiaEnviar(fd: FormData) {
  const file = fd.get('arquivo');
  if (!(file instanceof File) || !file.size) throw new ErroApi('Nenhuma imagem enviada.', 422);
  if (!/^image\//.test(file.type)) throw new ErroApi('O arquivo precisa ser uma imagem.', 422);
  const alt = String(fd.get('alt') ?? '').slice(0, 200) || null;

  const img = await prepararImagem(file);
  const token = await tokenValido();
  const res = await fetch(`${urlSupabase()}/storage/v1/object/site-midias/${img.arquivo}`, {
    method: 'POST',
    headers: { apikey: chavePublica(), Authorization: `Bearer ${token}`, 'Content-Type': 'image/webp', 'x-upsert': 'true' },
    body: img.blob,
  });
  if (!res.ok) {
    const j = (await res.json().catch(() => ({}))) as { message?: string };
    throw new ErroBanco(res.status === 403 ? 'Você não tem permissão para enviar imagens.' : `Falha no envio da imagem: ${j.message ?? res.status}`, res.status);
  }
  const [novo] = await rest<{ id: number }[]>('midias', {
    metodo: 'POST', retorno: true,
    corpo: {
      arquivo: img.arquivo, nome: file.name.slice(0, 190) || img.arquivo, alt,
      largura: img.largura, altura: img.altura, bytes: img.bytes,
    },
  });
  return { id: novo.id, arquivo: img.arquivo, largura: img.largura, altura: img.altura, bytes: img.bytes };
}

async function midiaApagar(id: number) {
  const m = await rest<{ arquivo: string }[]>('midias', { consulta: `select=arquivo&id=eq.${id}&limit=1` });
  if (!m.length) throw new ErroApi('Imagem não encontrada.', 404);
  await rest('midias', { metodo: 'DELETE', consulta: `id=eq.${id}` });
  // o arquivo so sai do Storage se o nome tiver o formato que o proprio painel gera
  if (/^\d{4}-\d{2}\/[a-f0-9]{16}\.webp$/.test(m[0].arquivo)) {
    const token = await tokenValido();
    await fetch(`${urlSupabase()}/storage/v1/object/site-midias/${m[0].arquivo}`, {
      method: 'DELETE',
      headers: { apikey: chavePublica(), Authorization: `Bearer ${token}` },
    }).catch(() => undefined);
  }
  return { ok: true };
}

// ---- config / tema
const CHAVES_CONFIG = new Set(['identidade', 'contato', 'redes', 'seo', 'nav']);

async function configSalvar(b: Entrada) {
  const chave = String(b.chave ?? '');
  if (!CHAVES_CONFIG.has(chave)) throw new ErroApi('Chave de configuração inválida.');
  if (typeof b.valor !== 'object' || b.valor === null) throw new ErroApi('Valor inválido.');
  const valor: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(b.valor as Record<string, unknown>)) {
    valor[k] = typeof v === 'string' ? v.slice(0, 2000) : Array.isArray(v) ? v.slice(0, 40) : v;
  }
  await rest('config', { metodo: 'POST', consulta: 'on_conflict=chave', upsert: 'chave', corpo: { chave, valor } });
  return { ok: true };
}

const COR = /^(#[0-9a-fA-F]{3,8}|rgba?\([\d.,\s%]+\))$/;
const MEDIDA = /^\d{1,4}(px|rem|%)$/;
const cor = (v: unknown, p: string) => (typeof v === 'string' && COR.test(v.trim()) ? v.trim() : p);
const medida = (v: unknown, p: string) => (typeof v === 'string' && MEDIDA.test(v.trim()) ? v.trim() : p);
const fonte = (v: unknown, ok: string[], p: string) => (typeof v === 'string' && ok.includes(v) ? v : p);

async function temaSalvar(b: Entrada) {
  const p = TEMA_PADRAO;
  await rest('tema', {
    metodo: 'POST', consulta: 'on_conflict=id', upsert: 'id',
    corpo: {
      id: 1,
      cor_fundo: cor(b.cor_fundo, p.cor_fundo), cor_superficie: cor(b.cor_superficie, p.cor_superficie),
      cor_superficie_2: cor(b.cor_superficie_2, p.cor_superficie_2), cor_texto: cor(b.cor_texto, p.cor_texto),
      cor_texto_suave: cor(b.cor_texto_suave, p.cor_texto_suave), cor_acento: cor(b.cor_acento, p.cor_acento),
      cor_acento_texto: cor(b.cor_acento_texto, p.cor_acento_texto), cor_acento_2: cor(b.cor_acento_2, p.cor_acento_2),
      cor_linha: cor(b.cor_linha, p.cor_linha),
      fonte_display: fonte(b.fonte_display, FONTES_DISPLAY, p.fonte_display),
      fonte_corpo: fonte(b.fonte_corpo, FONTES_CORPO, p.fonte_corpo),
      raio: medida(b.raio, p.raio), largura: medida(b.largura, p.largura),
      grao: bool(b.grao), grade: bool(b.grade),
    },
  });
  return { ok: true };
}

/** Ponto de entrada: o mesmo contrato das antigas rotas `/api/admin/*`. */
export async function despachar(metodo: string, url: string, corpo?: unknown): Promise<unknown> {
  const m = /^\/api\/admin\/([a-z]+)(?:\/(\d+))?$/.exec(url);
  if (!m) throw new ErroApi(`Rota desconhecida: ${url}`, 404);
  const recurso = m[1];
  const id = m[2] ? idDaRota(m[2]) : 0;
  const b = (corpo ?? {}) as Entrada;
  const eh = (met: string, comId: boolean) => metodo === met && Boolean(id) === comId;

  switch (recurso) {
    case 'produtos':
      if (eh('POST', false)) return produtoCriar(b);
      if (eh('PATCH', false)) { await reordenar('produtos', ORDEM_IDS(b.ids)); return { ok: true }; }
      if (eh('PUT', true)) return produtoSalvar(id, b);
      if (eh('DELETE', true)) { await rest('produtos', { metodo: 'DELETE', consulta: `id=eq.${id}` }); return { ok: true }; }
      break;
    case 'planos':
      if (eh('POST', false)) return planoCriar(b);
      if (eh('PATCH', false)) { await reordenar('planos', ORDEM_IDS(b.ids)); return { ok: true }; }
      if (eh('PUT', true)) return planoSalvar(id, b);
      if (eh('DELETE', true)) { await rest('planos', { metodo: 'DELETE', consulta: `id=eq.${id}` }); return { ok: true }; }
      break;
    case 'blocos':
      if (eh('POST', false)) return blocoCriar(b);
      if (eh('PATCH', false)) {
        const ids = ORDEM_IDS(b.ids).filter(Boolean);
        if (!ids.length) throw new ErroApi('Nenhum bloco informado.');
        await reordenar('blocos', ids);
        return { ok: true };
      }
      if (eh('PUT', true)) return blocoSalvar(id, b);
      if (eh('DELETE', true)) { await rest('blocos', { metodo: 'DELETE', consulta: `id=eq.${id}` }); return { ok: true }; }
      break;
    case 'paginas':
      if (eh('PUT', true)) return paginaSalvar(id, b);
      break;
    case 'leads':
      if (eh('PATCH', true)) { await rest('leads', { metodo: 'PATCH', consulta: `id=eq.${id}`, corpo: { lido: bool(b.lido) } }); return { ok: true }; }
      if (eh('DELETE', true)) { await rest('leads', { metodo: 'DELETE', consulta: `id=eq.${id}` }); return { ok: true }; }
      break;
    case 'midias':
      if (eh('GET', false)) return { itens: await listarMidias() };
      if (eh('POST', false)) return midiaEnviar(corpo as FormData);
      if (eh('PATCH', true)) { await rest('midias', { metodo: 'PATCH', consulta: `id=eq.${id}`, corpo: { alt: texto(b.alt, 200) } }); return { ok: true }; }
      if (eh('DELETE', true)) return midiaApagar(id);
      break;
    case 'config':
      if (eh('PUT', false)) return configSalvar(b);
      break;
    case 'tema':
      if (eh('PUT', false)) return temaSalvar(b);
      break;
  }
  throw new ErroApi(`Operação não suportada: ${metodo} ${url}`, 405);
}
