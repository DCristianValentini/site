'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { listarBlocos, paginaPorId } from '@/lib/admin-dados';
import { Carregar } from '@/components/admin/carregar';
import { EditorBlocos } from '@/components/admin/editor-blocos';

/** /admin/paginas/editar?id=3 — id na query porque o site e estatico (nao ha rota dinamica no Pages). */
function Conteudo() {
  const id = Number(useSearchParams().get('id'));
  if (!Number.isInteger(id) || id <= 0) return <p className="py-10 text-center text-adm-suave">Página não encontrada.</p>;
  return (
    <Carregar
      chave={id}
      buscar={async () => {
        const pagina = await paginaPorId(id);
        if (!pagina) return null;
        return { pagina, blocos: await listarBlocos(id) };
      }}
    >
      {(r) =>
        r ? (
          <EditorBlocos pagina={r.pagina} blocosIniciais={r.blocos} />
        ) : (
          <p className="py-10 text-center text-adm-suave">Página não encontrada.</p>
        )
      }
    </Carregar>
  );
}

export default function EditarPagina() {
  return (
    <Suspense fallback={null}>
      <Conteudo />
    </Suspense>
  );
}
