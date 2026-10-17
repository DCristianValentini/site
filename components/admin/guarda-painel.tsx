'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { sessaoAtual, type Sessao } from '@/lib/admin-auth';
import { contarNaoLidas } from '@/lib/admin-dados';
import { Navegacao } from '@/components/admin/navegacao';

/**
 * Guard do painel. O site e estatico, entao a sessao e conferida aqui no navegador: sem login
 * (ou fora da lista `admins`) volta para /admin/login. Isto e so conforto de navegacao — quem
 * protege os dados e a RLS do banco, que nega tudo sem o JWT de um administrador.
 */
export function GuardaPainel({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [naoLidas, setNaoLidas] = useState(0);

  useEffect(() => {
    let vivo = true;
    sessaoAtual().then(async (s) => {
      if (!vivo) return;
      if (!s) {
        router.replace('/admin/login/');
        return;
      }
      setSessao(s);
      setNaoLidas(await contarNaoLidas().catch(() => 0));
    });
    return () => {
      vivo = false;
    };
  }, [router]);

  if (!sessao) return <p className="py-24 text-center text-[0.88rem] text-adm-suave">Verificando acesso…</p>;

  return (
    <>
      <Navegacao sessao={sessao} naoLidas={naoLidas} />
      <main className="px-4 py-6 sm:px-6 lg:ml-64 lg:px-8 lg:py-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </>
  );
}
