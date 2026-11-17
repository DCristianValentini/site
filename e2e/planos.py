"""Planos por produto em /planos: HTML sem JavaScript, carrossel, teclado, URL, botao "Pedir proposta" e formulario de contato.

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


def no_viewport(pg, seletor):
    """True se o elemento esta (ao menos em parte) dentro da area visivel da faixa do carrossel."""
    return pg.evaluate(
        """(sel) => { const f = document.querySelector('.carrossel-faixa'); const e = document.querySelector(sel);
        if (!f || !e) return false; const a = f.getBoundingClientRect(), r = e.getBoundingClientRect();
        return r.left < a.right - 8 && r.right > a.left + 8; }""",
        seletor,
    )


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
        conferir(pg.locator('[aria-roledescription="carrossel"]').count() == 0, "sem JS: nao deveria haver carrossel")
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

        # ---------- 2) COM JavaScript: carrossel
        for w, h in ((360, 740), (1440, 900), (2560, 1200)):
            ctx = b.new_context(viewport={"width": w, "height": h})
            pg = ctx.new_page()
            pg.goto(f"{base}/planos/", wait_until="load")
            pg.wait_for_selector('[aria-roledescription="carrossel"]', timeout=15000)
            pontos = pg.locator("[data-ponto]")
            conferir(pontos.count() == len(slugs), f"{w}px: {pontos.count()} pontos, esperado {len(slugs)}")
            conferir(pg.locator('[data-ponto][aria-current="true"]').count() == 1, f"{w}px: deveria haver 1 ponto atual")
            conferir(pg.locator("#ponto-plano-erp").get_attribute("aria-current") == "true", f"{w}px: slide inicial deveria ser o ERP")
            conferir(pg.locator('[aria-roledescription="slide"][data-ativo="sim"]').count() == 1, f"{w}px: deveria haver 1 slide ativo")
            conferir(pg.locator('[aria-roledescription="slide"][inert]').count() == len(slugs) - 1, f"{w}px: so o slide ativo deveria aceitar foco")
            conferir(pg.locator("#plano-erp .card").count() == 3, f"{w}px: o ERP deveria mostrar 3 planos")
            conferir(no_viewport(pg, "#plano-erp"), f"{w}px: o slide do ERP deveria estar dentro da faixa visivel")
            sh = pg.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
            conferir(sh <= 0, f"{w}px: rolagem horizontal de {sh}px")
            peq = pg.locator(".carrossel-seta, [data-ponto]").evaluate_all("els => els.filter(e => { const r = e.getBoundingClientRect(); return r.height < 44 || r.width < 24; }).length")
            conferir(peq == 0, f"{w}px: {peq} controle(s) com alvo pequeno demais")
            if w == 1440:
                # setas: proxima / anterior (circular), URL e slide ativo acompanham
                pg.get_by_role("button", name=re.compile(r"^Pr.ximo produto")).click()
                pg.wait_for_timeout(700)
                conferir(pg.locator(f"#ponto-plano-{slugs[1]}").get_attribute("aria-current") == "true", "seta seguinte deveria ir ao 2o produto")
                conferir(f"produto={slugs[1]}" in pg.url, f"URL deveria ter ?produto={slugs[1]} (url: {pg.url})")
                conferir(no_viewport(pg, f"#plano-{slugs[1]}") and not no_viewport(pg, "#plano-erp"), "a faixa deveria rolar ate o 2o slide")
                conferir(pg.locator(f"#plano-{slugs[1]}").get_attribute("inert") is None, "slide ativo nao pode ficar inert")
                pg.get_by_role("button", name=re.compile(r"^Produto anterior")).click()
                pg.get_by_role("button", name=re.compile(r"^Produto anterior")).click()
                pg.wait_for_timeout(900)
                conferir(pg.locator(f"#ponto-plano-{slugs[-1]}").get_attribute("aria-current") == "true", "seta anterior no 1o deveria dar a volta para o ultimo")
                # pontos e teclado
                pg.locator("#ponto-plano-erp").click()
                pg.wait_for_timeout(900)
                conferir(pg.locator("#ponto-plano-erp").get_attribute("aria-current") == "true", "clique no ponto do ERP")
                pg.keyboard.press("ArrowRight")
                pg.wait_for_timeout(700)
                conferir(pg.evaluate("document.activeElement.id") == f"ponto-plano-{slugs[1]}", "ArrowRight no ponto deveria focar o proximo")
                pg.keyboard.press("End")
                pg.wait_for_timeout(900)
                conferir(pg.evaluate("document.activeElement.id") == f"ponto-plano-{slugs[-1]}", "End deveria ir ao ultimo")
                pg.keyboard.press("Home")
                pg.wait_for_timeout(900)
                conferir(pg.evaluate("document.activeElement.id") == "ponto-plano-erp", "Home deveria ir ao primeiro")
                conferir(pg.locator('[data-ponto][tabindex="0"]').count() == 1, "so o ponto atual entra no Tab")
                foco = pg.evaluate("(() => { const s = getComputedStyle(document.activeElement); return [s.outlineStyle, s.outlineWidth]; })()")
                conferir(foco[0] != "none" and foco[1] != "0px", f"foco visivel ausente no ponto ({foco})")
                conferir("Pr" in (pg.locator("[aria-live=polite]").first.inner_text() + "Pr") and "de" in pg.locator("[aria-live=polite]").first.inner_text(), "anuncio do slide atual ausente")
            if w == 360:
                # arrastar com o dedo equivale a rolar a faixa: rolagem programatica deve atualizar o slide ativo
                pg.wait_for_timeout(400)  # a posicao inicial ainda esta assentando
                pg.evaluate("(() => { const f = document.querySelector('.carrossel-faixa'); f.scrollTo({ left: f.clientWidth * 2, behavior: 'instant' }); })()")
                pg.wait_for_timeout(700)
                conferir(pg.locator(f"#ponto-plano-{slugs[2]}").get_attribute("aria-current") == "true", "rolar a faixa deveria mudar o slide ativo")
            ctx.close()

        # ---------- 3) ?produto= e #plano-
        ctx = b.new_context(viewport={"width": 1280, "height": 900})
        pg = ctx.new_page()
        for slug in ("agua", "ruralgestor", "comunidadegestor"):
            if slug not in esperado:
                continue
            pg.goto(f"{base}/planos/?produto={slug}", wait_until="load")
            pg.wait_for_selector('[aria-roledescription="carrossel"]')
            conferir(pg.locator(f"#ponto-plano-{slug}").get_attribute("aria-current") == "true", f"?produto={slug} deveria abrir a aba")
            conferir(pg.locator(f"#plano-{slug} .card").count() == esperado[slug], f"?produto={slug}: plano nao visivel")
        pg.goto(f"{base}/planos/?produto=nao-existe", wait_until="load")
        pg.wait_for_selector('[aria-roledescription="carrossel"]')
        conferir(pg.locator("#ponto-plano-erp").get_attribute("aria-current") == "true", "produto desconhecido deveria cair no ERP")
        pg.goto(f"{base}/planos/?produto=%3Cscript%3E", wait_until="load")
        pg.wait_for_selector('[aria-roledescription="carrossel"]')
        conferir(pg.locator("#ponto-plano-erp").get_attribute("aria-current") == "true", "?produto malformado deveria cair no ERP")
        pg.goto(f"{base}/planos/#plano-escola", wait_until="load")
        pg.wait_for_selector('[aria-roledescription="carrossel"]')
        conferir(pg.locator("#ponto-plano-escola").get_attribute("aria-current") == "true", "#plano-escola deveria abrir a aba")

        # ---------- 4) botao do plano -> /contato com o produto pre-selecionado
        pg.goto(f"{base}/planos/?produto=kanban", wait_until="load")
        pg.wait_for_selector('[aria-roledescription="carrossel"]')
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
        pg.wait_for_selector('[aria-roledescription="carrossel"]')
        conferir(pg.locator("#plano-igreja .card").count() == esperado.get("igreja", 1), "reduced-motion: painel da igreja")
        ctx.close()
        b.close()

    print(f"planos: {ok} verificacoes OK, {len(falhas)} falha(s)")
    sys.exit(1 if falhas else 0)


if __name__ == "__main__":
    main()
