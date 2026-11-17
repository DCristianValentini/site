'use client';

import { Children, useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { abaPorTecla, comProduto, parseHashPlano, parseProdutoParam, produtoInicial } from '@/lib/planos';

/**
 * Planos por produto da pagina /planos, como CARROSSEL (melhoria progressiva).
 *
 * O servidor entrega TODOS os planos agrupados por produto (cada grupo com titulo e ancora `#plano-<id>`) e, acima
 * deles, uma lista de links para as ancoras: sem JavaScript a pagina e uma lista longa e navegavel. Depois da
 * hidratacao este componente troca a lista por um carrossel: cada produto e um "slide" de largura total numa faixa
 * com `scroll-snap` (arrastar com o dedo, rolar com o trackpad, setas, pontos ou teclado).
 *
 * - Barra de controle: seta anterior / pontos (um por produto) / seta seguinte; as setas dizem o nome do vizinho.
 * - A escolha vai para a URL (`?produto=<slug>`, via replaceState: nao enche o historico); abre em `?produto=` ou `#plano-<slug>`.
 * - Acessibilidade: regiao "carrossel", slides `group` "n de N", so o slide ativo entra no foco (`inert` nos demais),
 *   anuncio (`aria-live`) do slide atual, setas esquerda/direita, Home e End, foco visivel, alvos de toque de 44px.
 * - Movimento: rolagem suave, exceto com `prefers-reduced-motion`.
 */
export function SeletorPlanos({
  itens,
  children,
  rotulo = 'Planos por produto',
}: {
  /** um por slide, na mesma ordem dos `children` */
  itens: { id: string; nome: string }[];
  children: ReactNode;
  rotulo?: string;
}) {
  const slides = Children.toArray(children);
  const ids = itens.map((i) => i.id);
  const total = ids.length;
  const [montado, setMontado] = useState(false);
  const [ativo, setAtivo] = useState<string>(ids[0] ?? '');
  const faixa = useRef<HTMLDivElement | null>(null);
  const pontos = useRef<Record<string, HTMLButtonElement | null>>({});
  const refSlides = useRef<Record<string, HTMLDivElement | null>>({});
  // enquanto uma rolagem iniciada por clique/tecla acontece, o scroll nao reescreve o slide ativo
  const rolandoPara = useRef<string | null>(null);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  const indice = Math.max(0, ids.indexOf(ativo));
  const anterior = itens[(indice - 1 + total) % total];
  const seguinte = itens[(indice + 1) % total];

  const reduzMovimento = () => {
    try {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
      return false;
    }
  };

  const gravarNaUrl = useCallback((id: string) => {
    try {
      const url = new URL(window.location.href);
      url.search = comProduto(url.search, id);
      url.hash = '';
      window.history.replaceState(window.history.state, '', url.toString());
    } catch {
      /* URL nao e essencial */
    }
  }, []);

  const rolarPara = useCallback(
    (id: string, suave: boolean) => {
      const el = faixa.current;
      const i = ids.indexOf(id);
      if (!el || i < 0) return;
      rolandoPara.current = id;
      if (temporizador.current) clearTimeout(temporizador.current);
      temporizador.current = setTimeout(() => {
        rolandoPara.current = null;
      }, suave ? 900 : 120);
      el.scrollTo({ left: i * el.clientWidth, behavior: suave && !reduzMovimento() ? 'smooth' : 'auto' });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ids.join('|')],
  );

  const escolher = useCallback(
    (id: string, opcoes: { focar?: boolean; suave?: boolean } = {}) => {
      setAtivo(id);
      gravarNaUrl(id);
      rolarPara(id, opcoes.suave ?? true);
      if (opcoes.focar) pontos.current[id]?.focus();
    },
    [gravarNaUrl, rolarPara],
  );

  // Depois de hidratar: slide inicial = ?produto=, depois #plano-<slug>, senao o ERP.
  useEffect(() => {
    const inicial = produtoInicial(ids, parseProdutoParam(window.location.search), parseHashPlano(window.location.hash));
    if (inicial) setAtivo(inicial);
    setMontado(true);
    const aoMudarHash = () => {
      const h = parseHashPlano(window.location.hash);
      if (h && ids.includes(h)) {
        setAtivo(h);
        rolarPara(h, true);
      }
    };
    window.addEventListener('hashchange', aoMudarHash);
    return () => window.removeEventListener('hashchange', aoMudarHash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join('|')]);

  // A faixa so existe depois de montar: posiciona no slide inicial (sem animacao) e acompanha o redimensionamento.
  useEffect(() => {
    if (!montado) return;
    rolarPara(ativo, false);
    const aoRedimensionar = () => rolarPara(ativoRef.current, false);
    window.addEventListener('resize', aoRedimensionar);
    return () => window.removeEventListener('resize', aoRedimensionar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [montado]);

  const ativoRef = useRef(ativo);
  useEffect(() => {
    ativoRef.current = ativo;
  }, [ativo]);

  // So o slide ativo entra no foco e na leitura; a altura da faixa acompanha o slide ativo (slides tem alturas diferentes).
  useEffect(() => {
    if (!montado) return;
    for (const id of ids) {
      const el = refSlides.current[id];
      if (!el) continue;
      if (id === ativo) el.removeAttribute('inert');
      else el.setAttribute('inert', '');
    }
    const el = refSlides.current[ativo];
    const f = faixa.current;
    if (!el || !f) return;
    const medir = () => {
      f.style.height = `${el.offsetHeight}px`;
    };
    medir();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [montado, ativo]);

  useEffect(
    () => () => {
      if (temporizador.current) clearTimeout(temporizador.current);
    },
    [],
  );

  // Arrastar/rolar a faixa muda o slide ativo (o do `scroll-snap` mais proximo).
  function aoRolar() {
    const el = faixa.current;
    if (!el || rolandoPara.current !== null || !el.clientWidth) return;
    const i = Math.min(total - 1, Math.max(0, Math.round(el.scrollLeft / el.clientWidth)));
    const id = ids[i];
    if (id && id !== ativoRef.current) {
      setAtivo(id);
      gravarNaUrl(id);
    }
  }

  function aoTeclar(e: KeyboardEvent<HTMLElement>) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const proximo = abaPorTecla(e.key, indice, total);
    if (proximo === null || e.key === 'ArrowUp' || e.key === 'ArrowDown') return;
    e.preventDefault();
    // com o foco num ponto, o foco acompanha; nos demais (links do plano), o foco fica onde esta
    const noPonto = (e.target as HTMLElement).closest('[data-ponto]') !== null;
    escolher(ids[proximo], { focar: noPonto });
  }

  // --- antes de hidratar (e sem JavaScript): links para as ancoras
  if (!montado) {
    return (
      <>
        <nav aria-label={rotulo} className="mt-10">
          <ul className="flex flex-wrap justify-center gap-2">
            {itens.map((it) => (
              <li key={it.id}>
                <a
                  href={`#plano-${it.id}`}
                  className="inline-flex min-h-[44px] items-center rounded-full border px-4 text-[0.9rem] font-medium"
                  style={{ borderColor: 'var(--sf-linha)', color: 'var(--sf-texto)' }}
                >
                  {it.nome}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-12 space-y-20">
          {slides.map((p, i) => (
            <div key={itens[i]?.id ?? i} id={`plano-${itens[i]?.id}`} className="scroll-mt-28">
              {p}
            </div>
          ))}
        </div>
      </>
    );
  }

  // --- hidratado: carrossel
  const nomeAtual = itens[indice]?.nome ?? '';
  return (
    <div role="region" aria-roledescription="carrossel" aria-label={rotulo} onKeyDown={aoTeclar} className="carrossel-planos">
      <div className="mx-auto mt-10 flex max-w-3xl items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => escolher(anterior.id)}
          className="carrossel-seta"
          aria-label={`Produto anterior: ${anterior.nome}`}
          disabled={total < 2}
        >
          <ArrowLeft size={18} aria-hidden />
          <span className="carrossel-seta-nome">{anterior.nome}</span>
        </button>

        <div role="group" aria-label="Escolher produto" className="flex flex-wrap items-center justify-center">
          {itens.map((it, i) => {
            const sel = it.id === ativo;
            return (
              <button
                key={it.id}
                ref={(el) => {
                  pontos.current[it.id] = el;
                }}
                type="button"
                data-ponto
                id={`ponto-plano-${it.id}`}
                aria-label={`${it.nome} (${i + 1} de ${total})`}
                aria-current={sel ? 'true' : undefined}
                aria-controls={`plano-${it.id}`}
                tabIndex={sel ? 0 : -1}
                title={it.nome}
                onClick={() => escolher(it.id)}
                className="carrossel-ponto"
              >
                <span className="carrossel-ponto-marca" data-ativo={sel ? 'sim' : 'nao'} />
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => escolher(seguinte.id)}
          className="carrossel-seta carrossel-seta-dir"
          aria-label={`Próximo produto: ${seguinte.nome}`}
          disabled={total < 2}
        >
          <span className="carrossel-seta-nome">{seguinte.nome}</span>
          <ArrowRight size={18} aria-hidden />
        </button>
      </div>

      <p className="mt-4 text-center text-[0.82rem] font-medium tracking-wide" style={{ color: 'var(--sf-texto-suave)' }} aria-live="polite">
        {indice + 1} de {total} · {nomeAtual}
      </p>

      <div ref={faixa} onScroll={aoRolar} className="carrossel-faixa mt-8">
        {slides.map((p, i) => {
          const id = itens[i]?.id ?? String(i);
          return (
            <div
              key={id}
              ref={(el) => {
                refSlides.current[id] = el;
              }}
              id={`plano-${id}`}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} de ${total}: ${itens[i]?.nome ?? ''}`}
              data-ativo={id === ativo ? 'sim' : 'nao'}
              aria-hidden={id === ativo ? undefined : true}
              className="carrossel-slide"
            >
              {p}
            </div>
          );
        })}
      </div>
    </div>
  );
}
