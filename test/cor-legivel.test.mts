// Rodar: node --test test/   (Node 22+ le TypeScript direto)
import test from 'node:test';
import assert from 'node:assert/strict';
import { corLegivel, hexParaRgb, razaoDeContraste } from '../lib/cor-legivel.ts';

const FUNDO = hexParaRgb('#14161c')!;
const COM_TINTA = (hex: string, t: number) => {
  const c = hexParaRgb(hex)!;
  return [0, 1, 2].map((i) => FUNDO[i] * (1 - t) + c[i] * t) as [number, number, number];
};

test('hexParaRgb aceita 3 e 6 digitos, com e sem #, e recusa lixo', () => {
  assert.deepEqual(hexParaRgb('#fff'), [255, 255, 255]);
  assert.deepEqual(hexParaRgb('ff7a2f'), [255, 122, 47]);
  assert.equal(hexParaRgb('laranja'), null);
  assert.equal(hexParaRgb(''), null);
});

test('cor escura e CLAREADA ate 4,5:1, solta no cartao e como selo', () => {
  for (const hex of ['#1e3a8a', '#4f46e5', '#6d28d9', '#065f46', '#7c2d12', '#000000']) {
    for (const tinta of [0, 0.12]) {
      const v = corLegivel(hex, { tinta })!;
      assert.ok(razaoDeContraste(hexParaRgb(v)!, COM_TINTA(hex, tinta)) >= 4.5, `${hex} tinta ${tinta} -> ${v}`);
    }
  }
});

test('cor que ja tem contraste suficiente nao muda', () => {
  assert.equal(corLegivel('#ffb347'), '#ffb347');
  assert.equal(corLegivel('#FF7A2F', { tinta: 0 }), '#FF7A2F');
});

test('cor invalida ou ausente devolve undefined (o chamador usa o acento do tema)', () => {
  assert.equal(corLegivel(null), undefined);
  assert.equal(corLegivel(undefined), undefined);
  assert.equal(corLegivel('var(--sf-acento)'), undefined);
  assert.equal(corLegivel('verde'), undefined);
});

test('cor sem # volta com #', () => {
  assert.equal(corLegivel('ffb347'), '#ffb347');
});
