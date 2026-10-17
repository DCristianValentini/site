/**
 * Sanitizador do HTML vindo do editor rich text do /admin.
 *
 * O conteudo e escrito por um usuario autenticado, mas ele vai pro site publico
 * via dangerouslySetInnerHTML — entao passa por uma whitelist no SERVIDOR (no
 * momento de salvar). Tag fora da lista perde as marcacoes e mantem o texto;
 * atributo fora da lista e descartado (inclui todo `on*` e `javascript:`).
 */

const TAGS_OK = new Set([
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'a', 'ul', 'ol', 'li',
  'h2', 'h3', 'h4', 'blockquote', 'span', 'div', 'mark', 'small', 'code',
]);

// atributo -> validador do valor
const ATTRS_OK: Record<string, Set<string>> = {
  a: new Set(['href', 'target', 'rel', 'style']),
  span: new Set(['style']),
  div: new Set(['style']),
  p: new Set(['style']),
  h2: new Set(['style']),
  h3: new Set(['style']),
  h4: new Set(['style']),
  li: new Set(['style']),
  ul: new Set(['style']),
  ol: new Set(['style']),
  mark: new Set(['style']),
  strong: new Set(['style']),
  em: new Set(['style']),
  blockquote: new Set(['style']),
};

// Propriedades CSS liberadas no atributo style (o editor gera essas).
const CSS_OK = new Set([
  'color', 'background-color', 'font-size', 'font-weight', 'font-style',
  'text-align', 'text-decoration', 'line-height', 'letter-spacing',
]);

function limparStyle(valor: string): string {
  return valor
    .split(';')
    .map((d) => d.trim())
    .filter(Boolean)
    .map((d) => {
      const i = d.indexOf(':');
      if (i < 0) return '';
      const prop = d.slice(0, i).trim().toLowerCase();
      const val = d.slice(i + 1).trim();
      if (!CSS_OK.has(prop)) return '';
      // corta url(), expression(), etc.
      if (/url\s*\(|expression|javascript:/i.test(val)) return '';
      return `${prop}: ${val}`;
    })
    .filter(Boolean)
    .join('; ');
}

function limparHref(valor: string): string | null {
  const v = valor.trim();
  if (/^(https?:|mailto:|tel:|\/|#)/i.test(v)) return v;
  return null;
}

export function sanitizarHtml(entrada: string | null | undefined): string {
  if (!entrada) return '';
  let html = String(entrada);

  // fora antes de tudo: comentarios, script/style/iframe com conteudo
  html = html.replace(/<!--[\s\S]*?-->/g, '');
  html = html.replace(/<(script|style|iframe|object|embed|form|input|button)\b[\s\S]*?<\/\1\s*>/gi, '');
  html = html.replace(/<(script|style|iframe|object|embed|form|input|button)\b[^>]*\/?>/gi, '');

  // reescreve cada tag restante
  html = html.replace(/<(\/?)([a-zA-Z][a-zA-Z0-9]*)((?:\s+[^>]*)?)\/?>/g, (_m, fecha, nomeRaw, attrsRaw) => {
    const nome = String(nomeRaw).toLowerCase();
    if (!TAGS_OK.has(nome)) return '';
    if (fecha) return `</${nome}>`;
    if (nome === 'br') return '<br />';

    const permitidos = ATTRS_OK[nome];
    if (!permitidos) return `<${nome}>`;

    const attrs: string[] = [];
    const re = /([a-zA-Z-]+)\s*=\s*("([^"]*)"|'([^']*)')/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(String(attrsRaw))) !== null) {
      const chave = m[1].toLowerCase();
      const valor = m[3] ?? m[4] ?? '';
      if (chave.startsWith('on')) continue;
      if (!permitidos.has(chave)) continue;
      if (chave === 'style') {
        const st = limparStyle(valor);
        if (st) attrs.push(`style="${st}"`);
      } else if (chave === 'href') {
        const h = limparHref(valor);
        if (h) attrs.push(`href="${h.replace(/"/g, '&quot;')}"`);
      } else if (chave === 'target') {
        if (valor === '_blank') attrs.push('target="_blank"', 'rel="noopener noreferrer"');
      } else if (chave === 'rel') {
        continue; // ja tratado junto do target
      } else {
        attrs.push(`${chave}="${valor.replace(/"/g, '&quot;')}"`);
      }
    }
    return `<${nome}${attrs.length ? ' ' + attrs.join(' ') : ''}>`;
  });

  return html.trim();
}

/** Texto puro a partir do HTML (usado em meta description / preview). */
export function htmlParaTexto(html: string | null | undefined, limite = 300): string {
  if (!html) return '';
  const txt = String(html)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
  return txt.length > limite ? `${txt.slice(0, limite - 1)}…` : txt;
}
