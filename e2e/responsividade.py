"""Responsividade por captura: cada pagina em 7 tamanhos (360 a 1440 e celular deitado).

Falha (codigo 1) se houver scroll horizontal, controle de toque abaixo de 44 px
ou texto cortado com reticencias. Uso:

  E2E_LOGIN=... E2E_SENHA=... python -I e2e/responsividade.py \\
      --base http://localhost:3030 --paginas dashboard,associados,turmas [--tema dark] [--capturas]
"""
import json
import os
import sys
from playwright.sync_api import sync_playwright

sys.path.insert(0, os.path.dirname(__file__))
from comum import JS_MEDICAO, VIEWPORTS, argumentos, contexto, credenciais, entrar  # noqa: E402


def extra(ap):
    ap.add_argument("--tema", choices=["light", "dark"], default="light")
    ap.add_argument("--capturas", action="store_true", help="salva PNG das 3 primeiras paginas")


a = argumentos(__doc__, extra)
login, senha = (None, None) if a.sem_login else credenciais()
paginas = a.paginas.split(",")
os.makedirs(a.saida, exist_ok=True)
rel = []
with sync_playwright() as p:
    b = p.chromium.launch()
    for (w, h) in VIEWPORTS:
        ctx = contexto(b, w, h, a.tema)
        pg = ctx.new_page()
        if not a.sem_login:
            entrar(pg, a.base, a.rota_login, login, senha)
        for rota in paginas:
            pg.goto(f"{a.base}/{rota}", wait_until="networkidle")
            # Rola a pagina inteira antes de medir: imagem com loading=lazy so carrega quando entra na tela,
            # e um cartao que embrulha uma imagem ainda nao carregada mede so o preenchimento (14 px).
            pg.evaluate("""async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.8) {
              scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); } scrollTo(0, 0); }""")
            pg.wait_for_load_state("networkidle")
            pg.wait_for_timeout(400)
            r = pg.evaluate(JS_MEDICAO)
            r.update(vp=f"{w}x{h}", pagina=rota or "(inicio)")
            rel.append(r)
            if a.capturas and rota in paginas[:3]:
                pg.screenshot(path=f"{a.saida}/{a.tema}-{rota or 'inicio'}-{w}x{h}.png")
        ctx.close()
    b.close()

json.dump(rel, open(f"{a.saida}/responsividade-{a.tema}.json", "w", encoding="utf-8"), ensure_ascii=False)
sh = [(x["vp"], x["pagina"], x["sh"]) for x in rel if x["sh"] > 0]
pequenos = sum(len(x["pequenos"]) for x in rel if not x["vp"].startswith("1440"))
cortados = [(x["pagina"], t) for x in rel for t in x["cortados"]]
print(f"medicoes: {len(rel)} | scroll horizontal: {len(sh)} | alvos < 44px (toque): {pequenos} | cortados: {len(cortados)}")
for linha in sh[:10]:
    print("  scroll:", linha)
for linha in cortados[:10]:
    print("  cortado:", linha)
sys.exit(1 if (sh or pequenos or cortados) else 0)
