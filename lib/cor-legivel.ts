// Cor cadastrada no CMS (a cor de um produto) usada como TEXTO.
//
// O site e escuro e a cor do produto e escolhida num seletor livre: um azul ou roxo escuro vira texto
// quase invisivel sobre o cartao (3:1). Aqui a cor e CLAREADA so o necessario para chegar a 4,5:1
// (WCAG AA) contra o fundo em que o texto fica. Cor que ja passa nao muda; a cor de identidade (a
// barra do cartao, o icone) segue exatamente a cadastrada.

type RGB = [number, number, number];

export function hexParaRgb(hex: string): RGB | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(hex ?? '').trim());
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as RGB;
}

const rgbParaHex = (c: RGB) =>
  `#${c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')}`;

const luminancia = ([r, g, b]: RGB) => {
  const f = (v: number) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};

export function razaoDeContraste(a: RGB, b: RGB) {
  const x = luminancia(a);
  const y = luminancia(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

const misturar = (a: RGB, b: RGB, t: number): RGB => [
  a[0] * (1 - t) + b[0] * t, a[1] * (1 - t) + b[1] * t, a[2] * (1 - t) + b[2] * t,
];

/**
 * `fundo`: cor da superficie atras do texto (padrao: o cartao do site, #14161c).
 * `tinta`: quanto da propria cor tinge o fundo (0 = texto solto no cartao; 0.12 = selo com fundo
 * translucido da cor). Devolve `undefined` para cor invalida, e o chamador cai no acento do tema.
 */
export function corLegivel(
  cor: string | null | undefined,
  { fundo = '#14161c', tinta = 0, minimo = 4.5 }: { fundo?: string; tinta?: number; minimo?: number } = {},
): string | undefined {
  const rgb = hexParaRgb(cor ?? '');
  const base = hexParaRgb(fundo);
  if (!rgb || !base) return undefined;
  const fundoEfetivo = misturar(base, rgb, tinta);
  if (razaoDeContraste(rgb, fundoEfetivo) >= minimo) return String(cor).startsWith('#') ? String(cor) : `#${cor}`;
  const branco: RGB = [255, 255, 255];
  for (let t = 0.04; t <= 1.0001; t += 0.04) {
    const candidata = misturar(rgb, branco, t);
    if (razaoDeContraste(candidata, fundoEfetivo) >= minimo) return rgbParaHex(candidata);
  }
  return '#ffffff';
}
