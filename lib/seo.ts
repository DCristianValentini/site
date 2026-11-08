// Titulo e descricao de SEO a partir do que o CMS guarda.
//
// O buscador corta o titulo em ~60 caracteres e a descricao em ~160. Texto de produto vem do banco e
// pode passar disso (o titulo montado "Nome — chamada" chegou a 100 caracteres, a descricao a 246): o
// resultado da busca fica truncado no meio da frase. Aqui o titulo escolhe a primeira forma que cabe e a
// descricao e cortada na ultima PALAVRA inteira.

export const MAX_TITULO = 65;
export const MAX_DESCRICAO = 160;

const limpo = (v: string | null | undefined) => String(v ?? '').replace(/\s+/g, ' ').trim();

/** Primeira forma do titulo que cabe em `max`; se nenhuma couber, corta a ultima na palavra. */
export function tituloSeo(
  { seoTitulo, nome, complemento }: { seoTitulo?: string | null; nome: string; complemento?: string | null },
  max = MAX_TITULO,
): string {
  const candidatos = [
    limpo(seoTitulo),
    complemento ? `${limpo(nome)} — ${limpo(complemento)}` : '',
    limpo(nome),
  ].filter(Boolean);
  const cabe = candidatos.find((c) => c.length <= max);
  return cabe ?? cortarNaPalavra(candidatos[candidatos.length - 1] ?? '', max);
}

/** Descricao no limite do buscador, cortada numa palavra inteira, com reticencias. */
export function descricaoSeo(texto: string | null | undefined, max = MAX_DESCRICAO): string {
  const t = limpo(texto);
  return t.length <= max ? t : cortarNaPalavra(t, max);
}

function cortarNaPalavra(t: string, max: number): string {
  if (t.length <= max) return t;
  const corte = t.slice(0, max - 1);
  const ultimoEspaco = corte.lastIndexOf(' ');
  const base = ultimoEspaco > max * 0.6 ? corte.slice(0, ultimoEspaco) : corte;
  return `${base.replace(/[\s,;:.\-—]+$/, '')}…`;
}
