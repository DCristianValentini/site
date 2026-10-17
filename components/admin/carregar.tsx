'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ErroAuth } from '@/lib/admin-auth';
import { Aviso, Botao } from '@/components/admin/ui';

/**
 * As paginas do painel sao estaticas (GitHub Pages): o conteudo vem do banco no navegador.
 * `Carregar` busca, mostra "Carregando…"/erro com nova tentativa e entrega os dados prontos
 * ao editor. Sessao vencida volta para o login.
 */
export function Carregar<T>({
  buscar,
  chave,
  children,
}: {
  buscar: () => Promise<T>;
  /** muda quando a busca deve ser refeita (ex.: id da pagina) */
  chave?: string | number;
  children: (dados: T) => React.ReactNode;
}) {
  const router = useRouter();
  const [dados, setDados] = useState<{ v: T } | null>(null);
  const [erro, setErro] = useState('');
  const [tentativa, setTentativa] = useState(0);

  const executar = useCallback(buscar, [buscar]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let vivo = true;
    setDados(null);
    setErro('');
    executar()
      .then((v) => vivo && setDados({ v }))
      .catch((e: unknown) => {
        if (!vivo) return;
        if (e instanceof ErroAuth || (e as { status?: number }).status === 401) {
          router.replace('/admin/login/');
          return;
        }
        setErro(e instanceof Error ? e.message : 'Não foi possível carregar.');
      });
    return () => {
      vivo = false;
    };
    // `executar` e recriado a cada render do chamador; a busca so refaz por chave/tentativa
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave, tentativa, router]);

  if (erro) {
    return (
      <div className="space-y-3">
        <Aviso texto={erro} erro />
        <Botao variante="linha" onClick={() => setTentativa((n) => n + 1)}>
          Tentar de novo
        </Botao>
      </div>
    );
  }
  if (!dados) return <p className="py-10 text-center text-[0.88rem] text-adm-suave">Carregando…</p>;
  return <>{children(dados.v)}</>;
}
