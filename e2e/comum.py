"""Utilitarios comuns dos testes de navegador (Playwright/Chromium).

Credencial vem de variaveis de ambiente (E2E_LOGIN e E2E_SENHA): nada de senha
no repositorio. Veja o README desta pasta.
"""
import argparse
import os
import sys

VIEWPORTS = [(360, 740), (390, 844), (430, 932), (768, 1024), (1024, 768), (1440, 900), (844, 390)]

# Medicao por pagina: scroll horizontal, controles de toque < 44 px (links que
# envolvem um botao nao contam: o toque cai no botao) e texto cortado com
# reticencias.
JS_MEDICAO = """() => {
  const vis = (e) => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e);
    return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
  const nome = (e) => (e.getAttribute('aria-label') || e.innerText || e.title || e.tagName).trim().slice(0, 28);
  const alvos = [...document.querySelectorAll(
    "button, a[href]:not(:has(button)), select, input:not([type=hidden]):not([type=checkbox]):not([type=radio]), [role=button]"
  )].filter(vis);
  // Botao/campo: 44 x 44. Link de TEXTO (a[href]): so a altura conta; a largura de um link
  // de uma palavra e a da palavra.
  const pequenos = alvos.filter(e => { const r = e.getBoundingClientRect();
    return e.tagName === 'A' ? r.height < 44 : (r.height < 44 || r.width < 44); })
    .map(e => { const r = e.getBoundingClientRect(); return nome(e) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height); });
  const cortados = [...document.querySelectorAll('body *')].filter(e => {
    const s = getComputedStyle(e); return vis(e) && !e.closest('[data-truncar-ok]') && s.textOverflow === 'ellipsis' && e.scrollWidth > e.clientWidth + 1 && e.innerText.trim(); })
    .map(e => e.innerText.trim().slice(0, 40));
  return { sh: document.documentElement.scrollWidth - document.documentElement.clientWidth,
           alvos: alvos.length, pequenos, cortados };
}"""

# Contraste de texto (WCAG): cor do texto contra o fundo EFETIVO (compondo a
# transparencia dos ancestrais). Fundo com imagem/gradiente e ignorado.
JS_CONTRASTE = """() => {
  const parse = (c) => { const m = c.match(/rgba?\\(([^)]+)\\)/); if (!m) return null;
    const p = m[1].split(/[ ,\\/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const sobre = (f, b) => ({ r: f.r * f.a + b.r * (1 - f.a), g: f.g * f.a + b.g * (1 - f.a), b: f.b * f.a + b.b * (1 - f.a), a: 1 });
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const razao = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const fundo = (el) => {
    const pilha = [];
    for (let e = el; e; e = e.parentElement) {
      const s = getComputedStyle(e);
      if (s.backgroundImage && s.backgroundImage !== 'none') return null;
      const c = parse(s.backgroundColor); if (c && c.a > 0) pilha.push(c);
      if (c && c.a >= 1) break;
    }
    let base = { r: 255, g: 255, b: 255, a: 1 };
    const cs = getComputedStyle(document.documentElement).colorScheme;
    if (!pilha.length || pilha[pilha.length - 1].a < 1) {
      const bb = parse(getComputedStyle(document.body).backgroundColor);
      base = bb && bb.a > 0 ? bb : (cs.includes('dark') && matchMedia('(prefers-color-scheme: dark)').matches ? { r: 0, g: 0, b: 0, a: 1 } : base);
    }
    for (let i = pilha.length - 1; i >= 0; i--) base = sobre(pilha[i], base);
    return base;
  };
  const achados = [];
  const vistos = new Set();
  for (const el of document.querySelectorAll('body *')) {
    if (!el.childNodes.length) continue;
    const temTexto = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
    if (!temTexto) continue;
    const s = getComputedStyle(el); const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0 || s.visibility === 'hidden' || s.display === 'none' || Number(s.opacity) === 0) continue;
    if (el.closest('nextjs-portal, [data-nextjs-toast], [data-nextjs-dev-tools-button]')) continue;
    // Controle desabilitado e isento de contraste minimo (WCAG 1.4.3).
    if (el.closest('button:disabled, [aria-disabled=true], input:disabled, select:disabled')) continue;
    const fg = parse(s.color); const bg = fundo(el); if (!fg || !bg) continue;
    const efetivo = sobre({ ...fg, a: fg.a * (Number(s.opacity) || 1) }, bg);
    const tam = parseFloat(s.fontSize); const negrito = parseInt(s.fontWeight, 10) >= 700;
    const grande = tam >= 24 || (tam >= 18.66 && negrito);
    const min = grande ? 3 : 4.5; const rz = razao(efetivo, bg);
    if (rz < min) {
      const texto = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join(' ').slice(0, 40);
      const chave = el.tagName + '|' + String(el.className).slice(0, 60) + '|' + texto;
      if (vistos.has(chave)) continue; vistos.add(chave);
      achados.push({ razao: Math.round(rz * 100) / 100, min, texto, classe: String(el.className).slice(0, 70), tag: el.tagName.toLowerCase() });
    }
  }
  return achados;
}"""


def argumentos(descricao, extra=None):
    ap = argparse.ArgumentParser(description=descricao)
    ap.add_argument("--base", required=True, help="ex.: http://localhost:3040")
    ap.add_argument("--rota-login", default="login", help="rota da tela de login (sem barra)")
    ap.add_argument("--campo-login", default="identificador", help="chave de E2E_LOGIN: so documentacao")
    ap.add_argument("--paginas", required=True, help="rotas separadas por virgula; vazio = inicio")
    ap.add_argument("--saida", default="e2e/saida", help="pasta de capturas e relatorio")
    ap.add_argument("--sem-login", action="store_true", help="paginas publicas: nao faz login")
    if extra:
        extra(ap)
    return ap.parse_args()


def credenciais():
    login, senha = os.environ.get("E2E_LOGIN"), os.environ.get("E2E_SENHA")
    if not login or not senha:
        sys.exit("Defina E2E_LOGIN e E2E_SENHA (conta de teste) no ambiente.")
    return login, senha


def entrar(pg, base, rota_login, login, senha, timeout=150000):
    """Faz login pela tela. Tenta de novo uma vez: o `next dev` recem-iniciado
    compila a rota na primeira visita e o primeiro login pode estourar o prazo."""
    rota = "/" + rota_login.lstrip("/")
    for tentativa in (1, 2):
        pg.goto(f"{base}{rota}")
        pg.wait_for_selector("input", timeout=timeout)
        campos = pg.locator("input")
        campos.nth(0).fill(login)
        campos.nth(1).fill(senha)
        pg.keyboard.press("Enter")
        try:
            pg.wait_for_url(lambda u: rota not in u, timeout=timeout)
            return
        except Exception:
            if tentativa == 2:
                raise


def contexto(browser, w, h, tema="light"):
    toque = w <= 1024
    return browser.new_context(
        viewport={"width": w, "height": h}, has_touch=toque, is_mobile=toque and w < 800,
        color_scheme=tema,
    )
