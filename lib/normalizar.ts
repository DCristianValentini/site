import { sanitizarHtml } from './sanitize';
import { camposRich, tipoBloco } from './blocos';
import type { Dados } from './tipos';

/**
 * Normalizacao dos dados que o painel grava. Roda no navegador, antes de cada escrita:
 * recorta tamanhos, converte tipos e passa o HTML dos editores pelo sanitizador.
 * (O banco ainda confere o que importa — RLS e restricoes — porque o navegador nao e
 * fronteira de seguranca.)
 */

export class ErroApi extends Error {
  status: number;
  constructor(mensagem: string, status = 400) {
    super(mensagem);
    this.status = status;
  }
}

export function texto(v: unknown, max = 255): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t ? t.slice(0, max) : null;
}

export function bool(v: unknown): boolean {
  return v === true || v === 1 || v === '1' || v === 'true';
}

export function inteiro(v: unknown, padrao = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : padrao;
}

export function idDaRota(v: string | undefined): number {
  const n = Number(v);
  if (!Number.isInteger(n) || n <= 0) throw new ErroApi('Identificador inválido.', 404);
  return n;
}

/**
 * Normaliza o JSON de um bloco: mantem so as chaves declaradas no tipo e passa
 * os campos rich pelo sanitizador (o HTML vem do editor e vai pro site publico).
 */
export function normalizarDadosBloco(tipo: string, entrada: unknown): Dados {
  const t = tipoBloco(tipo);
  if (!t) throw new ErroApi(`Tipo de bloco desconhecido: ${tipo}`);
  const bruto = (entrada ?? {}) as Dados;
  const out: Dados = {};

  for (const c of t.campos) {
    const v = bruto[c.chave];
    if (c.tipo === 'lista') {
      const itens = Array.isArray(v) ? (v as Dados[]) : [];
      out[c.chave] = itens.slice(0, 60).map((item) => {
        const limpo: Dados = {};
        for (const ic of c.itemCampos ?? []) {
          const iv = (item ?? {})[ic.chave];
          limpo[ic.chave] =
            ic.tipo === 'bool' ? bool(iv)
            : ic.tipo === 'numero' ? inteiro(iv)
            : typeof iv === 'string' ? iv.slice(0, 8000)
            : iv ?? '';
        }
        return limpo;
      });
    } else if (c.tipo === 'bool') {
      out[c.chave] = bool(v);
    } else if (c.tipo === 'numero') {
      out[c.chave] = inteiro(v);
    } else {
      out[c.chave] = typeof v === 'string' ? v.slice(0, 20000) : v ?? '';
    }
  }

  // sanitiza todo campo rich (inclusive dentro de listas)
  for (const alvo of camposRich(tipo)) {
    if (alvo.dentroDeLista) {
      const arr = out[alvo.dentroDeLista];
      if (Array.isArray(arr)) {
        out[alvo.dentroDeLista] = (arr as Dados[]).map((item) => ({
          ...item,
          [alvo.chave]: sanitizarHtml(String(item[alvo.chave] ?? '')),
        }));
      }
    } else {
      out[alvo.chave] = sanitizarHtml(String(out[alvo.chave] ?? ''));
    }
  }

  return out;
}
