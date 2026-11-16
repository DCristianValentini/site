'use client';

import { Children, useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { abaPorTecla, comProduto, parseHashPlano, parseProdutoParam, produtoInicial } from '@/lib/planos';

/**
 * Seletor de produto da pagina /planos, como MELHORIA PROGRESSIVA.
 *
 * O servidor entrega TODOS os planos agrupados por produto (cada grupo com titulo e ancora `#plano-<id>`) e,
 * acima deles, uma lista de links para as ancoras: sem JavaScript a pagina e uma lista longa e navegavel.
 * Depois da hidratacao este componente troca a lista de links por abas (role=tablist/tab/tabpanel), mostra so o
 * painel escolhido e guarda a escolha na URL (`?produto=<slug>`, via replaceState: nao enche o historico).
 *
 * Teclado (padrao WAI-ARIA, ativacao automatica): setas, Home e End; so a aba ativa entra na ordem do Tab.
 * Sem animacao: nada a reduzir por `prefers-reduced-motion`; a troca de cor da aba respeita a regra global.
 */
export function SeletorPlanos({
  itens,
  children,
  rotulo = 'Planos por produto',
}: {
  /** um por painel, na mesma ordem dos `children` */
  itens: { id: string; nome: string }[];
  children: ReactNode;
  rotulo?: string;
}) {
  const paineis = Children.toArray(children);
  const ids = itens.map((i) => i.id);
  const [montado, setMontado] = useState(false);
  const [ativo, setAtivo] = useState<string>(ids[0] ?? '');
  const abas = useRef<Record<string, HTMLButtonElement | null>>({});

  // Depois de hidratar: aba inicial = ?produto=, depois #plano-<slug>, senao o ERP.
  useEffect(() => {
    const inicial = produtoInicial(ids, parseProdutoParam(window.location.search), parseHashPlano(window.location.hash));
    if (inicial) setAtivo(inicial);
    setMontado(true);
    const aoMudarHash = () => {
      const h = parseHashPlano(window.location.hash);
      if (h && ids.includes(h)) setAtivo(h);
    };
    window.addEventListener('hashchange', aoMudarHash);
    return () => window.removeEventListener('hashchange', aoMudarHash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join('|')]);

  const escolher = useCallback((id: string, focar = false) => {
    setAtivo(id);
    try {
      const url = new URL(window.location.href);
      url.search = comProduto(url.search, id);
      url.hash = '';
      window.history.replaceState(window.history.state, '', url.toString());
    } catch {
      /* URL nao e essencial */
    }
    if (focar) abas.current[id]?.focus();
  }, []);

  function aoTeclar(e: KeyboardEvent<HTMLButtonElement>, i: number) {
    const proxima = abaPorTecla(e.key, i, ids.length);
    if (proxima === null) return;
    e.preventDefault();
    escolher(ids[proxima], true);
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
          {paineis.map((p, i) => (
            <div key={itens[i]?.id ?? i} id={`plano-${itens[i]?.id}`} className="scroll-mt-28">
              {p}
            </div>
          ))}
        </div>
      </>
    );
  }

  // --- hidratado: abas
  return (
    <>
      <div role="tablist" aria-label={rotulo} className="mt-10 flex flex-wrap justify-center gap-2">
        {itens.map((it, i) => {
          const sel = it.id === ativo;
          return (
            <button
              key={it.id}
              ref={(el) => {
                abas.current[it.id] = el;
              }}
              type="button"
              role="tab"
              id={`aba-plano-${it.id}`}
              aria-selected={sel}
              aria-controls={`plano-${it.id}`}
              tabIndex={sel ? 0 : -1}
              onClick={() => escolher(it.id)}
              onKeyDown={(e) => aoTeclar(e, i)}
              className="aba-plano inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border px-4 text-[0.9rem] font-medium transition-colors"
              style={
                sel
                  ? { background: 'var(--sf-acento)', color: 'var(--sf-acento-texto)', borderColor: 'var(--sf-acento)' }
                  : { borderColor: 'var(--sf-linha)', color: 'var(--sf-texto)' }
              }
            >
              {it.nome}
            </button>
          );
        })}
      </div>
      <div className="mt-12">
        {paineis.map((p, i) => {
          const id = itens[i]?.id;
          return (
            <div
              key={id ?? i}
              role="tabpanel"
              id={`plano-${id}`}
              aria-labelledby={`aba-plano-${id}`}
              hidden={id !== ativo}
              className="aba-plano-painel"
            >
              {p}
            </div>
          );
        })}
      </div>
    </>
  );
}
