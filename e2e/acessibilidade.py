"""Acessibilidade com axe-core (WCAG 2.x A/AA): rotulo de campo, nome de botao, landmarks, ordem
de titulos, lang, alt, ARIA, foco e contraste. Cada pagina, nos dois temas e em dois tamanhos
(desktop e celular). Complementa contraste.py/responsividade.py: aqui entra o que nao e medida
de pixel.

  E2E_LOGIN=... E2E_SENHA=... python -I e2e/acessibilidade.py \\
      --base http://localhost:3030 --paginas dashboard,contas --axe web/node_modules/axe-core/axe.min.js

Sai com codigo 1 se houver mais violacoes que --max. `axe-core` e dependencia de desenvolvimento
do app (npm install --save-dev axe-core).
"""
import collections
import os
import sys
from playwright.sync_api import sync_playwright

sys.path.insert(0, os.path.dirname(__file__))
from comum import argumentos, contexto, credenciais, entrar  # noqa: E402


def extra(ap):
    ap.add_argument("--axe", required=True, help="caminho do axe.min.js (node_modules/axe-core/axe.min.js)")
    ap.add_argument("--max", type=int, default=0, help="violacoes toleradas")


a = argumentos(__doc__, extra)
if not os.path.exists(a.axe):
    sys.exit(f"axe.min.js nao encontrado em {a.axe}")
if not a.sem_login:
    login, senha = credenciais()
TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"]
achados = collections.OrderedDict()

with sync_playwright() as p:
    b = p.chromium.launch()
    for tema in ("light", "dark"):
        for (w, h, tag) in [(1280, 800, "desktop"), (390, 844, "celular")]:
            ctx = contexto(b, w, h, tema)
            pg = ctx.new_page()
            if not a.sem_login:
                entrar(pg, a.base, a.rota_login, login, senha)
            for rota in a.paginas.split(","):
                pg.goto(f"{a.base}/{rota}", wait_until="networkidle")
                pg.wait_for_timeout(400)
                pg.add_script_tag(path=a.axe)
                r = pg.evaluate("(tags) => axe.run(document, { runOnly: { type: 'tag', values: tags } })", TAGS)
                for v in r["violations"]:
                    for no in v["nodes"]:
                        chave = (v["id"], v["impact"], (no["target"][0] if no["target"] else "")[:90])
                        achados.setdefault(chave, set()).add(f"{rota or '(inicio)'}/{tema}/{tag}")
            ctx.close()
    b.close()

por_regra = collections.Counter()
for (regra, impacto, alvo), onde in achados.items():
    por_regra[(regra, impacto)] += 1
total = len(achados)
print(f"axe-core: {total} violacoes distintas em {len(a.paginas.split(','))} paginas x 2 temas x 2 tamanhos")
for (regra, impacto), n in por_regra.most_common():
    print(f"  {impacto:<9} {regra}: {n}")
for (regra, impacto, alvo), onde in list(achados.items())[:25]:
    print(f"    - {regra} | {alvo} | {sorted(onde)[:2]}")
sys.exit(1 if total > a.max else 0)
