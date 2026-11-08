// Rodar: node --test test/   (Node 22+ le TypeScript direto)
//
// Motor do CMS: o que o /admin grava (normalizar), o catalogo de blocos (blocos.ts), o tema que vira CSS
// (tema-css.ts) e a ligacao entre o catalogo e o renderizador (blocos.tsx).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { sanitizarHtml } from '../lib/sanitize.ts';
import { COR, MEDIDA, corSegura, cssDeVariaveis, medidaSegura } from '../lib/tema-css.ts';
import { ErroApi, bool, idDaRota, inteiro, normalizarDadosBloco, texto } from '../lib/normalizar.ts';
import { TIPOS_BLOCO, camposRich, tipoBloco } from '../lib/blocos.ts';

// ---------- tema -> CSS ----------

test('cor e medida validas passam; qualquer outra coisa cai para o padrao', () => {
  for (const v of ['#fff', '#FF7A2F', '#ff7a2fcc', 'rgb(1, 2, 3)', 'rgba(255,255,255,0.09)']) assert.equal(corSegura(v, '#000'), v);
  assert.equal(corSegura('  #abc  ', '#000'), '#abc');
  for (const v of ['red', 'var(--x)', '#12', '#ggg', 'rgb(1,2,3);color:red', 'url(x)', '', null, undefined, 7, {}]) {
    assert.equal(corSegura(v, '#000'), '#000', String(v));
  }
  for (const v of ['14px', '1.2rem'.replace('.', ''), '100%', '1200px']) assert.equal(medidaSegura(v, '1px'), v);
  for (const v of ['14', '14px;x:y', 'calc(1px)', '-1px', '99999px', '1.5rem', '', null]) assert.equal(medidaSegura(v, '1px'), '1px', String(v));
});

test('valor de tema que tenta fechar o <style> nunca chega ao CSS', () => {
  const ataques = ['red}</style><script>alert(1)</script>', '#fff;}</style><img src=x onerror=alert(1)>', 'rgb(1,2,3)}body{display:none', '#fff\\7d '];
  for (const a of ataques) {
    assert.equal(corSegura(a, '#0A0B0E'), '#0A0B0E', a);
    assert.equal(medidaSegura(a, '14px'), '14px', a);
  }
  // segunda barreira: mesmo que um valor ruim chegasse a cssDeVariaveis, ele e descartado
  const css = cssDeVariaveis({ '--ok': '#fff', '--mau': 'red}</style><script>', '--"x': '1', '--barra': 'a\\b' });
  assert.equal(css, ':root{--ok:#fff}');
  assert.ok(!/[<>]/.test(css));
});

test('o regex de cor/medida e ancorado (nao aceita lixo depois do valor valido)', () => {
  assert.ok(!COR.test('#fff\n}</style>'));
  assert.ok(!MEDIDA.test('14px\n}</style>'));
});

// ---------- sanitizador: propriedades que o resto do motor assume ----------

test('sanitizarHtml e idempotente (e rodado ao salvar E ao renderizar)', () => {
  const amostras = [
    '<p style="text-align: center; color: #ff7a2f">Ola <strong>mundo</strong></p>',
    '<a href="https://ok.example/x?a=1&b=2" target="_blank">link</a>',
    '<p>5 &lt; 6 &amp; 7 &gt; 3 &quot;aspas&quot;</p>',
    '<a href=\'https://ok.example" onmouseover="alert(1)\'>x</a>',
    '<ul><li>um</li><li>dois</li></ul><br />',
    '<script>alert(1)</script><p>ok</p>',
    'texto solto <b>negrito</b>',
  ];
  for (const a of amostras) {
    const uma = sanitizarHtml(a);
    assert.equal(sanitizarHtml(uma), uma, `nao idempotente: ${a}`);
  }
});

// ---------- normalizar ----------

test('texto(): corta no limite, tira espacos e devolve null para vazio ou nao-string', () => {
  assert.equal(texto('  abc  '), 'abc');
  assert.equal(texto('x'.repeat(300))?.length, 255);
  assert.equal(texto('x'.repeat(300), 10), 'xxxxxxxxxx');
  assert.equal(texto('   '), null);
  assert.equal(texto(42), null);
  assert.equal(texto(null), null);
});

test('bool() e inteiro()', () => {
  for (const v of [true, 1, '1', 'true']) assert.equal(bool(v), true, String(v));
  for (const v of [false, 0, '0', 'false', '', null, undefined, 'sim', 2]) assert.equal(bool(v), false, String(v));
  assert.equal(inteiro('12'), 12);
  assert.equal(inteiro('12.9'), 12);
  assert.equal(inteiro('abc', 5), 5);
  assert.equal(inteiro(undefined), 0);
  assert.equal(inteiro(Infinity, 3), 3);
});

test('idDaRota(): so inteiro positivo; o resto vira 404', () => {
  assert.equal(idDaRota('7'), 7);
  for (const v of ['0', '-1', '1.5', 'abc', '', undefined]) {
    assert.throws(() => idDaRota(v as string | undefined), (e: unknown) => e instanceof ErroApi && e.status === 404, String(v));
  }
});

test('bloco desconhecido e recusado', () => {
  assert.throws(() => normalizarDadosBloco('nao_existe', {}), ErroApi);
});

test('normalizarDadosBloco mantem so as chaves do tipo e nunca falha com entrada vazia ou lixo', () => {
  for (const t of TIPOS_BLOCO) {
    const chaves = new Set(t.campos.map((c) => c.chave));
    for (const entrada of [undefined, null, {}, 'texto', 42, [], { __proto__: { x: 1 }, intruso: '<script>x</script>' }]) {
      const out = normalizarDadosBloco(t.tipo, entrada);
      for (const k of Object.keys(out)) assert.ok(chaves.has(k), `${t.tipo}: chave "${k}" nao declarada`);
      assert.ok(!('intruso' in out), `${t.tipo}: chave de fora passou`);
    }
  }
});

test('campo rich e sanitizado, inclusive dentro de lista; texto simples nao e tocado', () => {
  const comRich = TIPOS_BLOCO.filter((t) => camposRich(t.tipo).length > 0);
  assert.ok(comRich.length >= 2, 'o catalogo deveria ter campos rich');
  const ruim = '<p onclick="alert(1)">oi</p><script>alert(2)</script>';
  for (const t of comRich) {
    const bruto: Record<string, unknown> = {};
    for (const alvo of camposRich(t.tipo)) {
      if (alvo.dentroDeLista) bruto[alvo.dentroDeLista] = [{ [alvo.chave]: ruim }];
      else bruto[alvo.chave] = ruim;
    }
    const out = normalizarDadosBloco(t.tipo, bruto);
    for (const alvo of camposRich(t.tipo)) {
      const v = alvo.dentroDeLista ? (out[alvo.dentroDeLista] as Record<string, string>[])[0][alvo.chave] : (out[alvo.chave] as string);
      assert.equal(v, '<p>oi</p>', `${t.tipo}.${alvo.chave}`);
    }
  }
});

test('lista: no maximo 60 itens, texto de item cortado em 8000, bool/numero convertidos', () => {
  const t = TIPOS_BLOCO.find((x) => x.campos.some((c) => c.tipo === 'lista'))!;
  const campoLista = t.campos.find((c) => c.tipo === 'lista')!;
  const item: Record<string, unknown> = {};
  for (const ic of campoLista.itemCampos ?? []) item[ic.chave] = ic.tipo === 'bool' ? 'true' : ic.tipo === 'numero' ? '3.9' : 'x'.repeat(9000);
  const out = normalizarDadosBloco(t.tipo, { [campoLista.chave]: Array.from({ length: 100 }, () => ({ ...item })) });
  const itens = out[campoLista.chave] as Record<string, unknown>[];
  assert.equal(itens.length, 60);
  for (const ic of campoLista.itemCampos ?? []) {
    const v = itens[0][ic.chave];
    if (ic.tipo === 'bool') assert.equal(v, true, ic.chave);
    else if (ic.tipo === 'numero') assert.equal(v, 3, ic.chave);
    else if (typeof v === 'string' && ic.tipo !== 'rich') assert.equal(v.length, 8000, ic.chave);
  }
  // lista que nao e array vira lista vazia
  assert.deepEqual((normalizarDadosBloco(t.tipo, { [campoLista.chave]: 'x' })[campoLista.chave]), []);
});

// ---------- catalogo de blocos ----------

test('catalogo: tipos unicos, chaves unicas por bloco e padroes que so usam chaves declaradas', () => {
  const tipos = TIPOS_BLOCO.map((t) => t.tipo);
  assert.equal(new Set(tipos).size, tipos.length, 'tipo de bloco repetido');
  for (const t of TIPOS_BLOCO) {
    const chaves = t.campos.map((c) => c.chave);
    assert.equal(new Set(chaves).size, chaves.length, `${t.tipo}: chave de campo repetida`);
    for (const k of Object.keys(t.padroes)) assert.ok(chaves.includes(k), `${t.tipo}: padrao "${k}" sem campo`);
    for (const c of t.campos) {
      if (c.tipo === 'select') assert.ok((c.opcoes ?? []).length > 0, `${t.tipo}.${c.chave}: select sem opcoes`);
      if (c.tipo === 'lista') {
        assert.ok((c.itemCampos ?? []).length > 0, `${t.tipo}.${c.chave}: lista sem itemCampos`);
        const ik = (c.itemCampos ?? []).map((x) => x.chave);
        assert.equal(new Set(ik).size, ik.length, `${t.tipo}.${c.chave}: chave de item repetida`);
      }
    }
    assert.ok(tipoBloco(t.tipo) === t);
  }
});

test('todo tipo do catalogo tem renderizador (e o renderizador nao conhece tipo fantasma)', () => {
  const fonte = readFileSync(new URL('../components/site/blocos.tsx', import.meta.url), 'utf8');
  const renderizados = new Set([...fonte.matchAll(/case '([a-z_]+)':/g)].map((m) => m[1]));
  const catalogo = new Set(TIPOS_BLOCO.map((t) => t.tipo));
  assert.deepEqual([...catalogo].filter((t) => !renderizados.has(t)).sort(), [], 'tipo sem renderizador: a pagina some do site');
  assert.deepEqual([...renderizados].filter((t) => !catalogo.has(t)).sort(), [], 'renderizador de tipo que o /admin nao cria');
});

test('todo campo rich do catalogo e exibido por Rico (senao o HTML apareceria como texto)', () => {
  const fonte = readFileSync(new URL('../components/site/blocos.tsx', import.meta.url), 'utf8');
  for (const t of TIPOS_BLOCO) {
    for (const alvo of camposRich(t.tipo)) {
      const usos = [...fonte.matchAll(new RegExp(`<Rico[^>]*s\\([a-z]+, '${alvo.chave}'\\)|<Rico[^>]*\\.${alvo.chave}\\b`, 'g'))];
      assert.ok(usos.length > 0, `${t.tipo}.${alvo.chave}: nenhum <Rico> exibe este campo`);
    }
  }
});
