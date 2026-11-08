// Rodar: node --test test/   (Node 22+ le TypeScript direto)
import test from 'node:test';
import assert from 'node:assert/strict';
import { descricaoSeo, tituloSeo, MAX_DESCRICAO, MAX_TITULO } from '../lib/seo.ts';

test('titulo curto e mantido como o CMS definiu', () => {
  assert.equal(tituloSeo({ seoTitulo: 'ERP Comercial para a sua empresa', nome: 'ERP' }), 'ERP Comercial para a sua empresa');
  assert.equal(tituloSeo({ nome: 'ERP', complemento: 'Gestao completa' }), 'ERP — Gestao completa');
});

test('titulo montado grande demais cai para o nome', () => {
  const t = tituloSeo({
    nome: 'Gestao de Agua', complemento: 'Cobranca, leitura de hidrometro, financeiro e atendimento do associado em um so lugar',
  });
  assert.equal(t, 'Gestao de Agua');
  assert.ok(t.length <= MAX_TITULO);
});

test('seo_titulo explicito grande demais tambem cede, em vez de ser cortado no meio', () => {
  const longo = 'Aplicativo do leiturista de agua: leitura offline, recibo na impressora termica e sincronizacao';
  assert.ok(longo.length > MAX_TITULO);
  assert.equal(tituloSeo({ seoTitulo: longo, nome: 'App do Leiturista', complemento: 'Leitura offline' }), 'App do Leiturista — Leitura offline');
});

test('se nem o nome cabe, corta na palavra com reticencias', () => {
  const t = tituloSeo({ nome: 'Um nome de produto absurdamente comprido que nao cabe em nenhum titulo de resultado de busca' });
  assert.ok(t.length <= MAX_TITULO, `${t.length}`);
  assert.ok(t.endsWith('…'));
  assert.ok(!/\s…$/.test(t));
});

test('descricao curta nao muda; longa e cortada na ultima palavra inteira', () => {
  assert.equal(descricaoSeo('Texto curto.'), 'Texto curto.');
  const longa = 'O aplicativo Android do leiturista funciona sem internet: ele calcula o consumo, o valor da conta e imprime o recibo na hora, e sincroniza com o servidor quando a rede volta, sem perder nenhuma leitura feita em campo.';
  const d = descricaoSeo(longa);
  assert.ok(d.length <= MAX_DESCRICAO, `${d.length}`);
  assert.ok(d.endsWith('…'));
  assert.ok(longa.startsWith(d.slice(0, -1)), 'o corte preserva o inicio do texto');
  assert.ok(!/\S…$/.test(d) || longa.includes(d.slice(0, -1) + ' '), 'nao corta no meio de uma palavra');
});

test('espacos e quebras de linha do CMS sao normalizados', () => {
  assert.equal(descricaoSeo('  Linha um\n\n   linha   dois  '), 'Linha um linha dois');
  assert.equal(tituloSeo({ nome: '  ERP \n Comercial ' }), 'ERP Comercial');
});

test('vazio nao quebra', () => {
  assert.equal(descricaoSeo(null), '');
  assert.equal(descricaoSeo(undefined), '');
  assert.equal(tituloSeo({ nome: '' }), '');
});
