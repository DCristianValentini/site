"""Planos por produto em /planos: HTML sem JavaScript, seletor (abas), teclado, URL, botao "Pedir proposta" e formulario de contato.

Tambem serve de verificacao do site NO AR depois de publicar:
  python -I e2e/planos.py --base https://dcristianvalentini.github.io/site [--esperado erp=3,comanda=1,...]

Sem login. Saida: 0 se tudo passou. Precisa de Playwright/Chromium (veja o README).
"""
import argparse
import re
import sys
from playwright.sync_api import sync_playwright

PADRAO = "erp=3,comanda=1,kanban=1,igreja=1,agua=1,escola=1,ruralgestor=1,comunidadegestor=1"
falhas, ok = [], 0


def conferir(cond, msg):
    global ok
    if cond:
        ok += 1
    else:
        falhas.append(msg)
        print("  FALHA:", msg)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", required=True)
    ap.add_argument("--esperado", default=PADRAO, help="slug=quantidade de planos, separados por virgula")
    a = ap.parse_args()
    base = a.base.rstrip("/")
    esperado = {k: int(v) for k, v in (x.split("=") for x in a.esperado.split(","))}
    slugs = list(esperado)
    total = sum(esperado.values())

    with sync_playwright() as p:
        b = p.chromium.launch()

        # ---------- 1) SEM JavaScript: tudo no HTML, agrupado, com ancoras
        ctx = b.new_context(java_script_enabled=False)
        pg = ctx.new_page()
        pg.goto(f"{base}/planos/", wait_until="load")
        for s in slugs:
            conferir(pg.locator(f"#plano-{s}").count() == 1, f"sem JS: falta o grupo #plano-{s}")
            conferir(pg.locator(f'nav a[href="#plano-{s}"]').count() == 1, f"sem JS: falta o link de ancora para {s}")
            n = pg.locator(f"#plano-{s} .card").count()
            conferir(n == esperado[s], f"sem JS: {s} tem {n} plano(s), esperado {esperado[s]}")
        conferir(pg.locator("main .card").count() >= total, f"sem JS: menos de {total} cartoes de plano")
        conferir(pg.locator('[role="tablist"]').count() == 0, "sem JS: nao deveria haver abas")
        conferir(pg.locator("h1").count() == 1, f"sem JS: {pg.locator('h1').count()} h1")
        texto = pg.locator("main").inner_text()
        conferir(not re.search(r"R\$\s*\d", texto), "nenhum preco numerico (R$ ...) deve aparecer em /planos")
        conferir(texto.count("Sob consulta") >= total, f"'Sob consulta' deveria aparecer em todos os {total} planos")
        ctas = pg.locator("a.btn").evaluate_all("els => els.map(e => [e.textContent.trim(), e.getAttribute('href')])")
        propostas = [h for t, h in ctas if t in ("Pedir proposta", "Falar com especialista")]
        conferir(len(propostas) >= total, f"{len(propostas)} botoes de proposta, esperado >= {total}")
        for s in slugs:
            conferir(any(h and re.fullmatch(rf"/(site/)?contato/?\?interesse={s}", h) for h in propostas), f"botao com ?interesse={s} ausente")
        ctx.close()

        # ---------- 2) COM JavaScript: abas
        for w, h in ((360, 740), (1440, 900), (2560, 1200)):
            ctx = b.new_context(viewport={"width": w, "height": h})
            pg = ctx.new_page()
            pg.goto(f"{base}/planos/", wait_until="load")
            pg.wait_for_selector('[role="tablist"]', timeout=15000)
            abas = pg.locator('[role="tab"]')
            conferir(abas.count() == len(slugs), f"{w}px: {abas.count()} abas, esperado {len(slugs)}")
            conferir(pg.locator('[role="tab"][aria-selected="true"]').count() == 1, f"{w}px: deveria haver 1 aba selecionada")
            conferir(pg.locator("#aba-plano-erp").get_attribute("aria-selected") == "true", f"{w}px: aba inicial deveria ser o ERP")
            visiveis = pg.locator('[role="tabpanel"]:not([hidden])')
            conferir(visiveis.count() == 1, f"{w}px: {visiveis.count()} paineis visiveis")
            conferir(pg.locator("#plano-erp .card:visible").count() == 3, f"{w}px: o ERP deveria mostrar 3 planos")
            sh = pg.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
            conferir(sh <= 0, f"{w}px: rolagem horizontal de {sh}px")
            peq = pg.locator('[role="tab"]').evaluate_all("els => els.filter(e => { const r = e.getBoundingClientRect(); return r.height < 44 || r.width < 44; }).length")
            conferir(peq == 0, f"{w}px: {peq} aba(s) com alvo menor que 44px")
            if w == 1440:
                # teclado: seta direita passa para a proxima aba, atualiza URL e painel; Home/End; volta circular
                pg.locator("#aba-plano-erp").focus()
                pg.keyboard.press("ArrowRight")
                conferir(pg.evaluate("document.activeElement.id") == f"aba-plano-{slugs[1]}", "ArrowRight deveria focar a 2a aba")
                conferir(f"produto={slugs[1]}" in pg.url, f"URL deveria ter ?produto={slugs[1]} (url: {pg.url})")
                conferir(pg.locator(f"#plano-{slugs[1]}").is_visible() and not pg.locator("#plano-erp").is_visible(), "painel deveria trocar")
                conferir(pg.locator('[role="tab"][tabindex="0"]').count() == 1, "so a aba ativa entra no Tab")
                pg.keyboard.press("End")
                conferir(pg.evaluate("document.activeElement.id") == f"aba-plano-{slugs[-1]}", "End deveria ir para a ultima aba")
                pg.keyboard.press("ArrowRight")
                conferir(pg.evaluate("document.activeElement.id") == "aba-plano-erp", "ArrowRight na ultima deveria dar a volta")
                pg.keyboard.press("ArrowLeft")
                conferir(pg.evaluate("document.activeElement.id") == f"aba-plano-{slugs[-1]}", "ArrowLeft no ERP deveria ir para a ultima")
                pg.keyboard.press("Home")
                conferir(pg.evaluate("document.activeElement.id") == "aba-plano-erp", "Home deveria ir para a primeira")
                foco = pg.evaluate("(() => { const s = getComputedStyle(document.activeElement); return [s.outlineStyle, s.outlineWidth]; })()")
                conferir(foco[0] != "none" and foco[1] != "0px", f"foco visivel ausente na aba ({foco})")
            ctx.close()

        # ---------- 3) ?produto= e #plano-
        ctx = b.new_context(viewport={"width": 1280, "height": 900})
        pg = ctx.new_page()
        for slug in ("agua", "ruralgestor", "comunidadegestor"):
            if slug not in esperado:
                continue
            pg.goto(f"{base}/planos/?produto={slug}", wait_until="load")
            pg.wait_for_selector('[role="tablist"]')
            conferir(pg.locator(f"#aba-plano-{slug}").get_attribute("aria-selected") == "true", f"?produto={slug} deveria abrir a aba")
            conferir(pg.locator(f"#plano-{slug} .card:visible").count() == esperado[slug], f"?produto={slug}: plano nao visivel")
        pg.goto(f"{base}/planos/?produto=nao-existe", wait_until="load")
        pg.wait_for_selector('[role="tablist"]')
        conferir(pg.locator("#aba-plano-erp").get_attribute("aria-selected") == "true", "produto desconhecido deveria cair no ERP")
        pg.goto(f"{base}/planos/?produto=%3Cscript%3E", wait_until="load")
        pg.wait_for_selector('[role="tablist"]')
        conferir(pg.locator("#aba-plano-erp").get_attribute("aria-selected") == "true", "?produto malformado deveria cair no ERP")
        pg.goto(f"{base}/planos/#plano-escola", wait_until="load")
        pg.wait_for_selector('[role="tablist"]')
        conferir(pg.locator("#aba-plano-escola").get_attribute("aria-selected") == "true", "#plano-escola deveria abrir a aba")

        # ---------- 4) botao do plano -> /contato com o produto pre-selecionado
        pg.goto(f"{base}/planos/?produto=kanban", wait_until="load")
        pg.wait_for_selector('[role="tablist"]')
        pg.locator("#plano-kanban a.btn").first.click()
        pg.wait_for_selector("#interesse")
        pg.wait_for_timeout(300)
        conferir("interesse=kanban" in pg.url, f"url do contato: {pg.url}")
        sel = pg.locator("#interesse").evaluate("e => e.options[e.selectedIndex].text")
        conferir("Kanban" in sel, f"campo Interesse deveria vir com o Kanban (veio: {sel!r})")
        pg.goto(f"{base}/contato/?interesse=inexistente", wait_until="load")
        pg.wait_for_selector("#interesse")
        conferir(pg.locator("#interesse").input_value() == "", "interesse desconhecido deixa o campo no padrao")
        ctx.close()

        # ---------- 5) prefers-reduced-motion nao muda o comportamento
        ctx = b.new_context(viewport={"width": 1280, "height": 900}, reduced_motion="reduce")
        pg = ctx.new_page()
        pg.goto(f"{base}/planos/?produto=igreja", wait_until="load")
        pg.wait_for_selector('[role="tablist"]')
        conferir(pg.locator("#plano-igreja .card:visible").count() == esperado.get("igreja", 1), "reduced-motion: painel da igreja")
        ctx.close()
        b.close()

    print(f"planos: {ok} verificacoes OK, {len(falhas)} falha(s)")
    sys.exit(1 if falhas else 0)


if __name__ == "__main__":
    main()
