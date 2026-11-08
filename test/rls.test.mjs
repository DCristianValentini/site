// ============================================================================
// Seguranca do banco, DE FORA PARA DENTRO. O site publico embute a chave publica do Supabase no
// navegador (por desenho): TODA a seguranca esta nas permissoes e nas politicas RLS. Este teste
// usa essa mesma chave e prova o que um visitante consegue e o que NAO consegue fazer.
//
//   npm test   (o RLS so roda com NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_KEY; sem elas, pula)
//
// So inclui tentativas que DEVEM falhar, para nunca criar nem alterar dado em producao. O envio
// valido do formulario (que cria uma mensagem de verdade) nao e exercitado aqui.
// ============================================================================
import test from 'node:test';
import assert from 'node:assert/strict';

const BASE = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/\/+$/, '');
const KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY ?? '';
const pular = !BASE || !KEY
  ? 'defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_KEY (node --env-file=.env.local --test test/)'
  : false;

const TABELAS = ['config', 'tema', 'paginas', 'blocos', 'produtos', 'produto_recursos', 'planos',
  'plano_itens', 'midias', 'admins', 'leads'];
const CONTEUDO_PUBLICO = ['config', 'tema', 'paginas', 'blocos', 'produtos', 'produto_recursos', 'planos',
  'plano_itens', 'midias'];

async function rest(tabela, { metodo = 'GET', consulta = '', corpo, headers = {} } = {}) {
  const res = await fetch(`${BASE}/rest/v1/${tabela}${consulta ? `?${consulta}` : ''}`, {
    method: metodo,
    headers: {
      apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', ...headers,
    },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  });
  const texto = await res.text();
  let json = null;
  try { json = texto ? JSON.parse(texto) : null; } catch { json = texto; }
  return { status: res.status, json };
}

const negado = (r) => r.status === 401 || r.status === 403;

// --------------------------------------------------------------- leitura publica
test('o visitante le conteudo publicado, e SO o publicado', { skip: pular }, async () => {
  const paginas = await rest('paginas', { consulta: 'select=slug,publicada' });
  assert.equal(paginas.status, 200);
  assert.ok(paginas.json.length > 0, 'o site precisa ter pagina publicada');
  assert.ok(paginas.json.every((p) => p.publicada === true), 'pagina rascunho vazou');

  const produtos = await rest('produtos', { consulta: 'select=slug,ativo' });
  assert.ok(produtos.json.every((p) => p.ativo === true), 'produto inativo vazou');

  const planos = await rest('planos', { consulta: 'select=ativo' });
  assert.ok(planos.json.every((p) => p.ativo === true), 'plano inativo vazou');

  const blocos = await rest('blocos', { consulta: 'select=visivel' });
  assert.ok(blocos.json.every((b) => b.visivel === true), 'bloco oculto vazou');
});

test('bloco de pagina NAO publicada nao aparece, mesmo que o bloco esteja visivel', { skip: pular }, async () => {
  const publicadas = new Set((await rest('paginas', { consulta: 'select=id' })).json.map((p) => p.id));
  const blocos = await rest('blocos', { consulta: 'select=pagina_id' });
  assert.ok(blocos.json.every((b) => publicadas.has(b.pagina_id)), 'bloco de pagina rascunho vazou');
});

// ------------------------------------------------------ o que o visitante NAO le
test('mensagens (leads) e administradores sao ilegiveis para o visitante', { skip: pular }, async () => {
  for (const tabela of ['leads', 'admins']) {
    const r = await rest(tabela, { consulta: 'select=*' });
    assert.ok(negado(r) || (r.status === 200 && Array.isArray(r.json) && r.json.length === 0),
      `${tabela}: o visitante conseguiu ler (${r.status} ${JSON.stringify(r.json).slice(0, 80)})`);
  }
});

// --------------------------------------------------------- o que o visitante NAO escreve
// Uma chave e uma coluna REAIS de cada tabela: com coluna inexistente o PostgREST responde 400 antes
// de checar permissao, e o teste passaria sem provar nada. O filtro nao casa com linha nenhuma:
// mesmo que um dia a permissao exista, nada e alterado.
const ALVOS = {
  config: { filtro: 'chave=eq.__nao_existe__', corpo: { valor: {} } },
  tema: { filtro: 'id=eq.-1', corpo: { cor_fundo: '#000000' } },
  paginas: { filtro: 'id=eq.-1', corpo: { titulo: 'x' } },
  blocos: { filtro: 'id=eq.-1', corpo: { ordem: 0 } },
  produtos: { filtro: 'id=eq.-1', corpo: { nome: 'x' } },
  produto_recursos: { filtro: 'id=eq.-1', corpo: { titulo: 'x' } },
  planos: { filtro: 'id=eq.-1', corpo: { nome: 'x' } },
  plano_itens: { filtro: 'id=eq.-1', corpo: { texto: 'x' } },
  midias: { filtro: 'id=eq.-1', corpo: { nome: 'x' } },
  admins: { filtro: 'user_id=eq.00000000-0000-0000-0000-000000000000', corpo: { papel: 'editor' } },
  leads: { filtro: 'id=eq.-1', corpo: { nome: 'x' } },
};

test('todas as tabelas do banco estao cobertas por este teste', { skip: pular }, async (t) => {
  const res = await fetch(`${BASE}/rest/v1/`, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } });
  // O schema NAO e legivel para o visitante (401) — e isso e bom. Sem ele nao ha como descobrir tabela nova de
  // fora; marca como PULADO em vez de passar sem verificar nada.
  if (!res.ok) return t.skip(`schema inacessivel ao visitante (${res.status}): ao criar tabela, inclua-a em ALVOS`);
  const spec = await res.json();
  const expostas = Object.keys(spec.paths ?? {}).filter((c) => /^\/[a-z_]+$/.test(c)).map((c) => c.slice(1));
  const novas = expostas.filter((t) => !(t in ALVOS) && !t.startsWith('rpc'));
  assert.deepEqual(novas, [], 'tabela nova exposta ao visitante e sem teste: ' + novas.join(', '));
});

test('o visitante nao tem permissao de ESCRITA em nenhuma tabela (nem alterar nem apagar)', { skip: pular }, async () => {
  const falhas = [];
  for (const [tabela, { filtro, corpo }] of Object.entries(ALVOS)) {
    const alterar = await rest(tabela, { metodo: 'PATCH', consulta: filtro, corpo });
    const apagar = await rest(tabela, { metodo: 'DELETE', consulta: filtro });
    if (!negado(alterar)) falhas.push(`PATCH ${tabela} -> ${alterar.status} ${JSON.stringify(alterar.json).slice(0, 90)}`);
    if (!negado(apagar)) falhas.push(`DELETE ${tabela} -> ${apagar.status} ${JSON.stringify(apagar.json).slice(0, 90)}`);
  }
  assert.deepEqual(falhas, [], `o visitante tem permissao de escrita onde nao deveria:\n${falhas.join('\n')}`);
});

test('o visitante nao CRIA registro em tabela de conteudo, nem em admins', { skip: pular }, async () => {
  const falhas = [];
  for (const tabela of [...CONTEUDO_PUBLICO, 'admins']) {
    // Corpo invalido de proposito: se a permissao existisse, ainda assim nao cria nada.
    const r = await rest(tabela, { metodo: 'POST', corpo: {} });
    if (!negado(r)) falhas.push(`POST ${tabela} -> ${r.status}`);
  }
  assert.deepEqual(falhas, [], falhas.join('\n'));
});

// ----------------------------------------------------- formulario de contato (leads)
test('no formulario o visitante nao consegue forjar "lido", "id" nem "criado_em"', { skip: pular }, async () => {
  for (const extra of [{ lido: true }, { id: 987654321 }, { criado_em: '2000-01-01T00:00:00Z' }]) {
    const r = await rest('leads', {
      metodo: 'POST', headers: { Prefer: 'return=minimal' },
      corpo: { nome: 'Teste de seguranca', email: 'teste@exemplo.invalid', mensagem: 'nao deve gravar', ...extra },
    });
    assert.ok(!(r.status >= 200 && r.status < 300),
      `leads aceitou a coluna ${Object.keys(extra)[0]} vinda do visitante (${r.status})`);
  }
});

test('o banco recusa texto maior que o limite da coluna (nao grava lixo gigante)', { skip: pular }, async () => {
  const r = await rest('leads', {
    metodo: 'POST', headers: { Prefer: 'return=minimal' },
    corpo: { nome: 'x'.repeat(141), email: 'teste@exemplo.invalid', mensagem: 'nao deve gravar' },
  });
  assert.ok(r.status >= 400 && r.status < 500, `esperava recusa, veio ${r.status}`);
});

// ------------------------------------------------------------------ funcoes e schemas
test('as funcoes internas de administracao nao sao chamaveis pelo visitante', { skip: pular }, async () => {
  for (const nome of ['eh_admin', 'eh_papel_admin']) {
    const r = await rest(`rpc/${nome}`, { metodo: 'POST', corpo: {} });
    assert.ok(r.status === 404 || negado(r), `rpc/${nome} respondeu ${r.status} ao visitante`);
  }
});

test('o visitante nao lista arquivos do bucket de midias (so le por URL publica)', { skip: pular }, async () => {
  const res = await fetch(`${BASE}/storage/v1/object/list/site-midias`, {
    method: 'POST',
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prefix: '', limit: 5 }),
  });
  const json = await res.json().catch(() => null);
  assert.ok(res.status >= 400 || (Array.isArray(json) && json.length === 0),
    `o visitante conseguiu listar o bucket: ${JSON.stringify(json).slice(0, 100)}`);
});
