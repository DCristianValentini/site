'use client';

import Link from 'next/link';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { listarBlocos, listarPaginas } from '@/lib/admin-dados';
import { Carregar } from '@/components/admin/carregar';
import type { Bloco, Pagina } from '@/lib/tipos';

export default function PaginasAdmin() {
  return (
    <Carregar
      buscar={async () => {
        const paginas = await listarPaginas();
        const contagens = await Promise.all(paginas.map((p) => listarBlocos(p.id)));
        return { paginas, contagens };
      }}
    >
      {(d) => <Lista paginas={d.paginas} contagens={d.contagens} />}
    </Carregar>
  );
}

function Lista({ paginas, contagens }: { paginas: Pagina[]; contagens: Bloco[][] }) {

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[1.3rem] font-semibold tracking-tight">Páginas</h1>
        <p className="mt-1 text-[0.86rem] text-adm-suave">
          Cada página é uma pilha de blocos. Entre para reordenar, ocultar, adicionar ou editar cada
          seção — inclusive os textos com formatação.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {paginas.map((p, i) => {
          const blocos = contagens[i];
          const url = p.slug === 'home' ? '/' : `/${p.slug}`;
          return (
            <div key={p.id} className="rounded-xl border border-adm-linha bg-adm-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-[1.02rem] font-semibold">{p.titulo}</h2>
                  <p className="mt-0.5 font-mono text-[0.76rem] text-adm-suave">{url}</p>
                </div>
                {!p.publicada && (
                  <span className="rounded bg-adm-card2 px-2 py-0.5 text-[0.64rem] uppercase tracking-wider text-adm-suave">
                    rascunho
                  </span>
                )}
              </div>

              <p className="mt-3 text-[0.82rem] text-adm-suave">
                {blocos.length} bloco(s) · {blocos.filter((b) => !b.visivel).length} oculto(s)
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <Link href={`/admin/paginas/editar?id=${p.id}`} className="adm-btn adm-btn-primario">
                  Editar conteúdo <ArrowRight size={14} />
                </Link>
                <Link href={url} target="_blank" className="adm-btn adm-btn-linha">
                  <ExternalLink size={14} /> Ver
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
