// Rodar: node --test test/   (Node 22+ le TypeScript direto)
//
// O HTML do editor rico vai para o site PUBLICO via dangerouslySetInnerHTML: o sanitizador e a unica
// barreira entre quem edita o conteudo e o navegador do visitante (e do outro admin). Estes testes
// atacam com payloads de XSS conhecidos e conferem INVARIANTES sobre a saida, nao so exemplos.
import test from 'node:test';
import assert from 'node:assert/strict';
import { htmlParaTexto, sanitizarHtml } from '../lib/sanitize.ts';

const PAYLOADS = [
  '<script>alert(1)</script>',
  '<SCRIPT SRC=//evil.example/x.js></SCRIPT>',
  '<ScRiPt>alert(1)</sCrIpT>',
  '<scr<script>ipt>alert(1)</scr</script>ipt>',
  '<script/x>alert(1)</script>',
  '<img src=x onerror=alert(1)>',
  '<img src="x" onerror="alert(1)">',
  '<svg onload=alert(1)>',
  '<svg><script>alert(1)</script></svg>',
  '<math><mi xlink:href="javascript:alert(1)">x</mi></math>',
  '<iframe src="javascript:alert(1)"></iframe>',
  '<iframe srcdoc="<script>alert(1)</script>"></iframe>',
  '<object data="javascript:alert(1)"></object>',
  '<embed src="javascript:alert(1)">',
  '<link rel=stylesheet href=//evil.example/x.css>',
  '<meta http-equiv="refresh" content="0;url=javascript:alert(1)">',
  '<base href="//evil.example/">',
  '<details open ontoggle=alert(1)>x</details>',
  '<body onload=alert(1)>',
  '<video><source onerror=alert(1)></video>',
  '<input autofocus onfocus=alert(1)>',
  '<button onclick=alert(1)>x</button>',
  '<form action="javascript:alert(1)"><input type=submit></form>',
  '<a href="javascript:alert(1)">x</a>',
  '<a href="JaVaScRiPt:alert(1)">x</a>',
  '<a href="  javascript:alert(1)">x</a>',
  '<a href="jav&#x09;ascript:alert(1)">x</a>',
  '<a href="javascript&colon;alert(1)">x</a>',
  '<a href="vbscript:msgbox(1)">x</a>',
  '<a href="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">x</a>',
  '<a href=javascript:alert(1)>x</a>',
  '<a href="https://ok.example" onclick="alert(1)">x</a>',
  '<a href="https://ok.example" onmouseover=alert(1)>x</a>',
  '<p onclick="alert(1)">x</p>',
  '<span style="background-image:url(javascript:alert(1))">x</span>',
  '<span style="color: expression(alert(1))">x</span>',
  '<span style=\'color: red" onmouseover="alert(1)\'>x</span>',
  '<span style="color: red; x:y" onmouseover="alert(1)">x</span>',
  '<a href=\'https://ok.example" onmouseover="alert(1)\'>x</a>',
  '<p style="color:red;"><script>alert(1)</script></p>',
  '<!--[if IE]><script>alert(1)</script><![endif]-->',
  '<div><<script>alert(1)//<</script></div>',
  '<a href="https://ok.example" title=">" onmouseover="alert(1)">x</a>',
];

// Dentro de aspas, "onmouseover=" e so texto do valor (o navegador nao o trata como atributo, desde que as
// aspas nao se fechem antes da hora). Por isso o manipulador e procurado FORA dos valores entre aspas.
const semValores = (s: string) => s.replace(/"[^"]*"/g, '""');

const AMEACAS: [RegExp, string, (s: string) => string?][] = [
  [/<\s*script/i, 'script'],
  [/<\s*(iframe|object|embed|svg|math|img|link|meta|base|form|input|button|video|source|body|details)\b/i, 'tag fora da lista'],
  [/<[^>]*\son[a-z]+\s*=/i, 'manipulador de evento (on*=) como atributo da tag', semValores],
  [/<[^>]*(javascript|vbscript|data)\s*:/i, 'URL perigosa dentro de uma tag'],
  [/<[^>]*expression\s*\(/i, 'expression() em CSS'],
  [/<[^>]*url\s*\(/i, 'url() em CSS'],
];

test('nenhum payload de XSS conhecido sobrevive (invariantes sobre a saida)', () => {
  const falhas: string[] = [];
  for (const entrada of PAYLOADS) {
    const saida = sanitizarHtml(entrada);
    for (const [padrao, nome, prepara] of AMEACAS) {
      // a regra de "on*=" olha cada tag com os valores entre aspas ja removidos
      const alvo = prepara ? (saida.match(/<[^>]+>/g) ?? []).map(prepara).join('') : saida;
      if (padrao.test(alvo)) falhas.push(`${nome}\n    entrada: ${entrada}\n    saida:   ${saida}`);
    }
  }
  assert.deepEqual(falhas, [], '\n' + falhas.join('\n'));
});

test('a saida de um atributo nunca fecha as aspas do proprio atributo', () => {
  for (const entrada of [
    '<span style=\'color: red" onmouseover="alert(1)\'>x</span>',
    '<a href=\'https://ok.example" onmouseover="alert(1)\'>x</a>',
    '<a href="https://ok.example/a&quot; onmouseover=&quot;alert(1)">x</a>',
  ]) {
    const saida = sanitizarHtml(entrada);
    // todo atributo emitido tem aspas balanceadas e nenhum "on*=" fora delas
    for (const tag of saida.match(/<[^>]+>/g) ?? []) {
      const semValores = tag.replace(/"[^"]*"/g, '""');
      assert.ok(!/\bon[a-z]+\s*=/i.test(semValores), `atributo injetado: ${tag}`);
      assert.equal((tag.match(/"/g) ?? []).length % 2, 0, `aspas desbalanceadas: ${tag}`);
    }
  }
});

test('o que o editor gera continua passando: formatacao, links e cores', () => {
  const html = '<h2>Titulo</h2><p style="text-align: center; color: #ff7a2f">Texto <strong>forte</strong> e <em>enfase</em></p>'
    + '<ul><li>um</li><li>dois</li></ul><blockquote>citacao</blockquote>';
  assert.equal(sanitizarHtml(html), html.replace('style="text-align: center; color: #ff7a2f"', 'style="text-align: center; color: #ff7a2f"'));
  assert.match(sanitizarHtml('<a href="https://exemplo.invalid/x?a=1&b=2">ok</a>'), /^<a href="https:\/\/exemplo\.invalid\/x\?a=1&b=2">ok<\/a>$/);
  assert.match(sanitizarHtml('<a href="mailto:a@b.invalid">m</a>'), /href="mailto:a@b\.invalid"/);
  assert.match(sanitizarHtml('<a href="tel:+5563999999999">t</a>'), /href="tel:\+5563999999999"/);
  assert.match(sanitizarHtml('<a href="/produtos/">p</a>'), /href="\/produtos\/"/);
  assert.match(sanitizarHtml('<a href="#topo">h</a>'), /href="#topo"/);
});

test('cor em rgb(), hsl() e hex, e tamanhos, sao aceitos no style', () => {
  for (const css of ['color: rgb(255, 122, 47)', 'background-color: hsl(20, 100%, 59%)', 'font-size: 1.25rem', 'font-weight: 700', 'letter-spacing: -0.02em', 'line-height: 1.4']) {
    assert.equal(sanitizarHtml(`<span style="${css}">x</span>`), `<span style="${css}">x</span>`, css);
  }
});

test('propriedade CSS fora da lista e descartada, e a tag fica sem style', () => {
  assert.equal(sanitizarHtml('<span style="position: fixed; top: 0; z-index: 9999">x</span>'), '<span>x</span>');
  assert.equal(sanitizarHtml('<p style="background-image: url(x.png)">x</p>'), '<p>x</p>');
});

test('escape CSS ("\\75rl(") nao contrabandeia url() para dentro do style', () => {
  assert.equal(sanitizarHtml('<span style="background-color: \\75rl(javascript:alert(1))">x</span>'), '<span>x</span>');
  assert.equal(sanitizarHtml('<span style="color: red&#59; background-image: x">x</span>'), '<span>x</span>');
});

test('target=_blank ganha rel="noopener noreferrer" (nada de window.opener)', () => {
  const s = sanitizarHtml('<a href="https://ok.example" target="_blank">x</a>');
  assert.match(s, /target="_blank"/);
  assert.match(s, /rel="noopener noreferrer"/);
  assert.doesNotMatch(sanitizarHtml('<a href="https://ok.example" target="_top">x</a>'), /target=/);
});

test('tag fora da lista perde a marcacao e mantem o texto', () => {
  assert.equal(sanitizarHtml('<font color="red">texto</font>'), 'texto');
  assert.equal(sanitizarHtml('<table><tr><td>celula</td></tr></table>'), 'celula');
});

test('script e style perdem o CONTEUDO tambem, nao so a tag', () => {
  assert.equal(sanitizarHtml('antes<script>alert(1)</script>depois'), 'antesdepois');
  assert.equal(sanitizarHtml('a<style>body{display:none}</style>b'), 'ab');
});

test('entrada vazia ou nula devolve texto vazio', () => {
  assert.equal(sanitizarHtml(null), '');
  assert.equal(sanitizarHtml(undefined), '');
  assert.equal(sanitizarHtml(''), '');
});

test('htmlParaTexto tira a marcacao, decodifica entidades basicas e respeita o limite', () => {
  assert.equal(htmlParaTexto('<p>Ol&aacute; <strong>mundo</strong> &amp; todos</p>'), 'Ol&aacute; mundo & todos');
  assert.equal(htmlParaTexto('<p>a</p><p>b</p>'), 'a b');
  const longo = htmlParaTexto('<p>' + 'palavra '.repeat(100) + '</p>', 50);
  assert.ok(longo.length <= 50 && longo.endsWith('…'));
  assert.equal(htmlParaTexto(null), '');
});
