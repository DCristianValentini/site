"""SEO e estrutura das paginas publicas: lang, title, description, UM h1, canonical, Open Graph, alt
das imagens, links internos quebrados, sitemap e robots. Tambem acusa TEXTO DE EXEMPLO esquecido no
conteudo (e-mail "@exemplo.com.br", telefone "(00) 0000-0000", "Cidade / UF", lorem ipsum): o site
vai ao ar com o que estiver no banco.

  python -I e2e/seo.py --base http://localhost:3010 --paginas ",produtos/,planos/,sobre/,contato/" [--estrito]

Erro estrutural -> codigo 1. Texto de exemplo e AVISO, e so reprova com --estrito.
"""
import os
import re
import sys
from urllib.parse import urljoin, urlparse
from playwright.sync_api import sync_playwright

sys.path.insert(0, os.path.dirname(__file__))
from comum import argumentos  # noqa: E402


def extra(ap):
    ap.add_argument("--estrito", action="store_true", help="texto de exemplo tambem reprova")


a = argumentos(__doc__, extra)
EXEMPLOS = [(r"exemplo\.com(\.br)?", re.I), (r"\(00\)\s*0000-0000", 0), (r"Cidade\s*/\s*UF", re.I),
            (r"lorem ipsum", re.I), (r"\bTODO\b", 0), (r"\bXXX\b", 0)]  # TODO/XXX so em maiusculas: "todo" e palavra comum
erros, avisos = [], []
vistos_links = {}

with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={"width": 1280, "height": 800})
    pg = ctx.new_page()
    origem = urlparse(a.base).netloc

    def status(url):
        if url not in vistos_links:
            try:
                r = ctx.request.get(url, max_redirects=5, timeout=60000)
                vistos_links[url] = r.status
            except Exception as e:  # noqa: BLE001
                vistos_links[url] = f"erro:{type(e).__name__}"
        return vistos_links[url]

    for rota in a.paginas.split(","):
        url = f"{a.base}/{rota}"
        rotulo = rota or "(inicio)"
        resp = pg.goto(url, wait_until="networkidle")
        esperado_404 = rota.startswith("nao-existe")
        if esperado_404:
            if resp.status != 404:
                erros.append(f"{rotulo}: rota inexistente devolveu {resp.status}, esperava 404")
            continue
        if resp.status != 200:
            erros.append(f"{rotulo}: status {resp.status}")
            continue
        d = pg.evaluate("""() => ({
          lang: document.documentElement.lang,
          title: document.title,
          desc: document.querySelector('meta[name=description]')?.content ?? '',
          canonical: document.querySelector('link[rel=canonical]')?.href ?? '',
          ogTitle: document.querySelector('meta[property="og:title"]')?.content ?? '',
          ogDesc: document.querySelector('meta[property="og:description"]')?.content ?? '',
          h1: [...document.querySelectorAll('h1')].map(h => h.innerText.trim()),
          semAlt: [...document.querySelectorAll('img')].filter(i => !i.hasAttribute('alt')).map(i => i.src.slice(-60)),
          links: [...document.querySelectorAll('a[href]')].map(l => l.href),
          texto: document.body.innerText,
        })""")
        if not d["lang"]:
            erros.append(f"{rotulo}: <html> sem lang")
        if not d["title"] or len(d["title"]) > 70:
            erros.append(f"{rotulo}: title vazio ou com mais de 70 caracteres ({len(d['title'])})")
        if not (50 <= len(d["desc"]) <= 175):
            avisos.append(f"{rotulo}: meta description com {len(d['desc'])} caracteres (ideal: 50 a 175)")
        if not d["canonical"]:
            erros.append(f"{rotulo}: sem link canonical")
        if not d["ogTitle"] or not d["ogDesc"]:
            avisos.append(f"{rotulo}: sem og:title/og:description")
        if len(d["h1"]) != 1:
            erros.append(f"{rotulo}: {len(d['h1'])} elementos h1 (deve haver exatamente 1): {d['h1']}")
        if d["semAlt"]:
            erros.append(f"{rotulo}: imagem sem atributo alt: {d['semAlt'][:3]}")
        for padrao, flags in EXEMPLOS:
            m = re.search(padrao, d["texto"], flags)
            if m:
                avisos.append(f"{rotulo}: texto de exemplo no conteudo: '{m.group(0)}'")
        for link in {l.split('#')[0] for l in d["links"]}:
            u = urlparse(link)
            if u.scheme in ("http", "https") and u.netloc == origem:
                s = status(link)
                if s != 200:
                    erros.append(f"{rotulo}: link interno quebrado {u.path} -> {s}")

    # sitemap e robots
    robots = ctx.request.get(f"{a.base}/robots.txt")
    if robots.status != 200:
        erros.append(f"robots.txt -> {robots.status}")
    elif "sitemap" not in robots.text().lower():
        avisos.append("robots.txt nao aponta para o sitemap")
    sm = ctx.request.get(f"{a.base}/sitemap.xml")
    if sm.status != 200:
        erros.append(f"sitemap.xml -> {sm.status}")
    else:
        urls = re.findall(r"<loc>([^<]+)</loc>", sm.text())
        if not urls:
            erros.append("sitemap.xml sem nenhuma URL")
        for u in urls:
            caminho = urlparse(u).path or "/"
            s = status(urljoin(a.base + "/", caminho.lstrip("/")))
            if s != 200:
                erros.append(f"sitemap lista {caminho}, que responde {s}")
    b.close()

print(f"SEO: {len(erros)} erro(s), {len(avisos)} aviso(s), {len(vistos_links)} URLs internas checadas")
for e in erros:
    print("  ERRO ", e)
for w in sorted(set(avisos)):
    print("  aviso", w)
sys.exit(1 if (erros or (a.estrito and avisos)) else 0)
