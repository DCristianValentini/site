// Valores do tema que viram CSS dentro de um <style>.
//
// O /admin valida cor e medida ao salvar, mas isso roda no NAVEGADOR de quem edita: quem tem papel de admin
// grava no banco direto pela API (a tabela `tema` so exige id=1). Um valor como `red}</style><script>...`
// fecharia o <style> e executaria no site publico. Por isso a regra vale tambem na hora de RENDERIZAR, e
// um valor invalido cai para o padrao em vez de ir para o CSS.

export const COR = /^(#[0-9a-fA-F]{3,8}|rgba?\([\d.,\s%]+\))$/;
export const MEDIDA = /^\d{1,4}(px|rem|%)$/;

export const corSegura = (v: unknown, padrao: string): string =>
  typeof v === 'string' && COR.test(v.trim()) ? v.trim() : padrao;

export const medidaSegura = (v: unknown, padrao: string): string =>
  typeof v === 'string' && MEDIDA.test(v.trim()) ? v.trim() : padrao;

/** `:root{--a:1;--b:2}` — chave so com [a-z0-9-]; o valor nunca tem `<`, `>`, `{`, `}`, `;` nem `\`. */
export function cssDeVariaveis(vars: Record<string, string>): string {
  const corpo = Object.entries(vars)
    .filter(([k, v]) => /^--[a-z0-9-]+$/.test(k) && !/[<>{};\\]/.test(v))
    .map(([k, v]) => `${k}:${v}`)
    .join(';');
  return `:root{${corpo}}`;
}
