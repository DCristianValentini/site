"""Contraste de texto (WCAG 2.x: 4,5:1 texto normal, 3:1 texto grande) por pagina,
no tema claro e no escuro. Cor do texto contra o fundo efetivo (compondo a
transparencia dos ancestrais); fundo com imagem/gradiente e ignorado. Uso:

  E2E_LOGIN=... E2E_SENHA=... python -I e2e/contraste.py \\
      --base http://localhost:3030 --paginas dashboard,associados [--tema dark] [--max 0]

Sai com codigo 1 se houver mais violacoes que --max.
"""
import collections
import os
import sys
from playwright.sync_api import sync_playwright

sys.path.insert(0, os.path.dirname(__file__))
from comum import JS_CONTRASTE, argumentos, contexto, credenciais, entrar  # noqa: E402


def extra(ap):
    ap.add_argument("--tema", choices=["light", "dark"], default="light")
    ap.add_argument("--max", type=int, default=0, help="violacoes toleradas")
    ap.add_argument("--largura", type=int, default=1280)


a = argumentos(__doc__, extra)
login, senha = (None, None) if a.sem_login else credenciais()
total = collections.OrderedDict()
with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = contexto(b, a.largura, 900, a.tema)
    pg = ctx.new_page()
    if not a.sem_login:
        entrar(pg, a.base, a.rota_login, login, senha)
    for rota in a.paginas.split(","):
        pg.goto(f"{a.base}/{rota}", wait_until="networkidle")
        pg.wait_for_timeout(400)
        total[rota or "(inicio)"] = pg.evaluate(JS_CONTRASTE)
    b.close()

n = sum(len(v) for v in total.values())
print(f"tema {a.tema}: {n} violacoes de contraste em {len(total)} paginas")
unicas = collections.Counter()
for rota, achados in total.items():
    for x in achados:
        unicas[(x["razao"], x["min"], x["tag"], x["classe"][:60], x["texto"][:28])] += 1
for (rz, mn, tag, cls, txt), c in sorted(unicas.items(), key=lambda kv: kv[0][0])[:25]:
    print(f"  {rz:>5} (min {mn})  <{tag}> {cls!r}  '{txt}'  x{c}")
sys.exit(1 if n > a.max else 0)
