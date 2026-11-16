// Rodar: node --test test/   (Node 22+ le TypeScript direto)
//
// Planos por produto: agrupamento, aba inicial (?produto= / #plano-), teclado, link do botao e ?interesse=.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  abaPorTecla, agruparPlanos, comProduto, hrefCta, idGrupo, interessePorSlug, lerParametro, parseHashPlano, parseProdutoParam, produtoInicial,
} from '../lib/planos.ts';
import type { Plano } from '../lib/tipos.ts';

const plano = (id: number, ordem: number, produto: string | null, extra: Partial<Plano> = {}): Plano => ({
  id, nome: `Plano ${id}`, descricao: null, preco: 'Sob consulta', periodo: 'por mês', observacao: null, cta_texto: null, cta_url: null,
  destaque: 0, ativo: 1, ordem, produto_slug: produto, ...extra,
});
const PRODUTOS = [
  { slug: 'erp', nome: 'ERP Comercial', ordem: 1 },
  { slug: 'comanda', nome: 'Comanda', ordem: 2 },
  { slug: 'kanban', nome: 'Kanban de Projetos', ordem: 3 },
  { slug: 'ruralgestor', nome: 'RuralGestor', ordem: 49 },
];

// ---------- agrupamento ----------

test('agrupa por produto na ordem dos produtos e, dentro do grupo, na ordem dos planos', () => {
  const g = agruparPlanos(
    [plano(5, 1, 'ruralgestor'), plano(3, 3, 'erp'), plano(1, 1, 'erp'), plano(2, 2, 'erp'), plano(4, 1, 'comanda')],
    PRODUTOS,
  );
  assert.deepEqual(g.map((x) => x.slug), ['erp', 'comanda', 'ruralgestor']);
  assert.deepEqual(g[0].planos.map((p) => p.id), [1, 2, 3]);
  assert.equal(g[0].nome, 'ERP Comercial');
});

test('produto sem plano nao vira grupo (nao existe aba vazia)', () => {
  const g = agruparPlanos([plano(1, 1, 'erp')], PRODUTOS);
  assert.deepEqual(g.map((x) => x.slug), ['erp']);
});

test('plano sem produto, ou de produto que nao esta no ar, cai em "Planos gerais", por ultimo', () => {
  const g = agruparPlanos([plano(1, 1, null), plano(2, 2, 'suite-mes'), plano(3, 3, 'erp'), plano(4, 4, '  ')], PRODUTOS);
  assert.deepEqual(g.map((x) => x.slug), ['erp', null]);
  assert.deepEqual(g[1].planos.map((p) => p.id), [1, 2, 4]);
  assert.equal(idGrupo(g[1]), 'geral');
});

test('nao muta a entrada e aceita lista vazia', () => {
  const entrada = [plano(2, 2, 'erp'), plano(1, 1, 'erp')];
  agruparPlanos(entrada, PRODUTOS);
  assert.deepEqual(entrada.map((p) => p.id), [2, 1]);
  assert.deepEqual(agruparPlanos([], PRODUTOS), []);
});

// ---------- ?produto= , #plano- e aba inicial ----------

test('parse de ?produto=: so aceita slug; o resto vira null (nunca lanca)', () => {
  assert.equal(parseProdutoParam('?produto=comanda'), 'comanda');
  assert.equal(parseProdutoParam('produto=RuralGestor'), 'ruralgestor');
  assert.equal(parseProdutoParam('?x=1&produto=agua&y=2'), 'agua');
  for (const ruim of ['', '?', '?produto=', '?produto=../x', '?produto=a b', '?produto=<script>', '?produto=%00', '?outro=erp', null, undefined, '?produto=' + 'a'.repeat(81)]) {
    assert.equal(parseProdutoParam(ruim as string), null, String(ruim));
  }
  assert.equal(parseProdutoParam('?produto=%E0%A4%A'), null);
});

test('hash #plano-<slug> escolhe a aba', () => {
  assert.equal(parseHashPlano('#plano-kanban'), 'kanban');
  assert.equal(parseHashPlano('plano-erp'), 'erp');
  for (const ruim of ['', '#', '#outra', '#plano-', '#plano-../x', null, undefined]) assert.equal(parseHashPlano(ruim as string), null);
});

test('aba inicial: o 1o candidato que existe; senao ERP; senao o 1o grupo', () => {
  const ids = ['erp', 'comanda', 'ruralgestor'];
  assert.equal(produtoInicial(ids, 'ruralgestor', 'comanda'), 'ruralgestor');
  assert.equal(produtoInicial(ids, 'inexistente', 'comanda'), 'comanda');
  assert.equal(produtoInicial(ids, null, undefined), 'erp');
  assert.equal(produtoInicial(ids, 'nao-existe'), 'erp');
  assert.equal(produtoInicial(['comanda', 'kanban'], 'erp'), 'comanda', 'sem ERP, cai no primeiro');
  assert.equal(produtoInicial([], 'erp'), null);
});

test('comProduto preserva os outros parametros e troca so o produto', () => {
  assert.equal(comProduto('', 'agua'), '?produto=agua');
  assert.equal(comProduto('?produto=erp&utm=x', 'kanban'), '?produto=kanban&utm=x');
});

// ---------- teclado (abas) ----------

test('teclado: setas, Home e End dao a volta; outras teclas nao navegam', () => {
  assert.equal(abaPorTecla('ArrowRight', 0, 3), 1);
  assert.equal(abaPorTecla('ArrowRight', 2, 3), 0);
  assert.equal(abaPorTecla('ArrowLeft', 0, 3), 2);
  assert.equal(abaPorTecla('ArrowLeft', 2, 3), 1);
  assert.equal(abaPorTecla('Home', 2, 3), 0);
  assert.equal(abaPorTecla('End', 0, 3), 2);
  assert.equal(abaPorTecla('Tab', 0, 3), null);
  assert.equal(abaPorTecla('Enter', 0, 3), null);
  assert.equal(abaPorTecla('ArrowRight', 0, 0), null);
  assert.equal(abaPorTecla('ArrowRight', 0, 1), 0);
});

// ---------- botao "Pedir proposta" e ?interesse= ----------

test('botao do plano de produto leva a /contato?interesse=<slug>; link personalizado e respeitado', () => {
  assert.equal(hrefCta({ cta_url: '/contato', produto_slug: 'comanda' }), '/contato?interesse=comanda');
  assert.equal(hrefCta({ cta_url: null, produto_slug: 'ruralgestor' }), '/contato?interesse=ruralgestor');
  assert.equal(hrefCta({ cta_url: '', produto_slug: 'erp' }), '/contato?interesse=erp');
  assert.equal(hrefCta({ cta_url: '/contato', produto_slug: null }), '/contato');
  assert.equal(hrefCta({ cta_url: null, produto_slug: null }), '/contato');
  assert.equal(hrefCta({ cta_url: 'https://exemplo.com/proposta', produto_slug: 'erp' }), 'https://exemplo.com/proposta');
  assert.equal(hrefCta({ cta_url: '/contato', produto_slug: 'a b&c' }), '/contato', 'slug estranho nao vira query');
});

test('?interesse= vira o nome do produto no campo do formulario; slug desconhecido e ignorado', () => {
  assert.equal(interessePorSlug('?interesse=comanda', PRODUTOS), 'Comanda');
  assert.equal(interessePorSlug('?interesse=ruralgestor', PRODUTOS), 'RuralGestor');
  assert.equal(interessePorSlug('?interesse=nao-existe', PRODUTOS), null);
  assert.equal(interessePorSlug('?interesse=<b>', PRODUTOS), null);
  assert.equal(interessePorSlug('', PRODUTOS), null);
  assert.equal(lerParametro('?interesse=ERP', 'interesse'), 'erp');
});

// ---------- ligacao com o codigo (o que a leitura de arquivos pega) ----------

test('o painel valida e grava produto_slug; o tipo e a pagina conhecem o campo', () => {
  const api = readFileSync(new URL('../lib/admin-api.ts', import.meta.url), 'utf8');
  assert.match(api, /produto_slug/);
  const tipos = readFileSync(new URL('../lib/tipos.ts', import.meta.url), 'utf8');
  assert.match(tipos, /produto_slug/);
});
