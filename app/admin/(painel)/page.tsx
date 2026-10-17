'use client';

import Link from 'next/link';
import { ArrowRight, Mail, Package, ScrollText } from 'lucide-react';
import { configAdmin, listarLeads, listarPaginas, listarPlanos, listarProdutos } from '@/lib/admin-dados';
import { Carregar } from '@/components/admin/carregar';

export default function Painel() {
  return (
    <Carregar
      buscar={async () => {
        const [paginas, produtos, leads, config, planos] = await Promise.all([
          listarPaginas(), listarProdutos(), listarLeads(), configAdmin(), listarPlanos(),
        ]);
        return { paginas, produtos, leads, config, planosAtivos: planos.filter((p) => p.ativo).length };
      }}
    >
      {(d) => <Visao {...d} />}
    </Carregar>
  );
}

function Visao({ paginas, produtos, leads, config, planosAtivos }: {
  paginas: Awaited<ReturnType<typeof listarPaginas>>;
  produtos: Awaited<ReturnType<typeof listarProdutos>>;
  leads: Awaited<ReturnType<typeof listarLeads>>;
  config: Awaited<ReturnType<typeof configAdmin>>;
  planosAtivos: number;
}) {
  const naoLidas = leads.filter((l) => !l.lido);
  const cards = [
    { rotulo: 'Páginas', valor: paginas.length, href: '/admin/paginas' },
    { rotulo: 'Produtos ativos', valor: produtos.filter((p) => p.ativo).length, href: '/admin/produtos' },
    { rotulo: 'Planos ativos', valor: planosAtivos, href: '/admin/planos' },
    { rotulo: 'Mensagens não lidas', valor: naoLidas.length, href: '/admin/mensagens' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[1.4rem] font-semibold tracking-tight">
          Olá — este é o painel do site de {config.identidade.nome}
        </h1>
        <p className="mt-1 text-[0.88rem] text-adm-suave">
          Todo texto, imagem, cor e seção do site é editável aqui. As alterações aparecem no site
          assim que você salvar (basta recarregar a página pública).
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.rotulo}
            href={c.href}
            className="rounded-xl border border-adm-linha bg-adm-card p-5 transition-colors hover:border-adm-acento"
          >
            <span className="block text-[2rem] font-bold leading-none tabular-nums">{c.valor}</span>
            <span className="mt-2 block text-[0.85rem] text-adm-suave">{c.rotulo}</span>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-adm-linha bg-adm-card">
          <header className="flex items-center justify-between border-b border-adm-linha px-5 py-3.5">
            <h2 className="flex items-center gap-2 text-[0.95rem] font-semibold">
              <ScrollText size={16} /> Páginas do site
            </h2>
          </header>
          <ul className="divide-y divide-adm-linha">
            {paginas.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/admin/paginas/editar?id=${p.id}`}
                  className="flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-adm-card2/60"
                >
                  <span>
                    <span className="block text-[0.9rem]">{p.titulo}</span>
                    <span className="block font-mono text-[0.74rem] text-adm-suave">
                      {p.slug === 'home' ? '/' : `/${p.slug}`}
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    {!p.publicada && (
                      <span className="rounded bg-adm-card2 px-1.5 py-0.5 text-[0.64rem] uppercase tracking-wider text-adm-suave">
                        rascunho
                      </span>
                    )}
                    <ArrowRight size={15} className="text-adm-suave" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-adm-linha bg-adm-card">
          <header className="flex items-center justify-between border-b border-adm-linha px-5 py-3.5">
            <h2 className="flex items-center gap-2 text-[0.95rem] font-semibold">
              <Mail size={16} /> Últimas mensagens
            </h2>
            <Link href="/admin/mensagens" className="text-[0.8rem] text-adm-acento hover:underline">
              ver todas
            </Link>
          </header>
          {leads.length === 0 ? (
            <p className="px-5 py-8 text-center text-[0.86rem] text-adm-suave">
              Nenhuma mensagem recebida ainda.
            </p>
          ) : (
            <ul className="divide-y divide-adm-linha">
              {leads.slice(0, 6).map((l) => (
                <li key={l.id} className="px-5 py-3">
                  <span className="flex items-center gap-2">
                    {!l.lido && <span className="h-1.5 w-1.5 rounded-full bg-adm-acento" />}
                    <span className="text-[0.9rem]">{l.nome}</span>
                    {l.empresa && <span className="text-[0.8rem] text-adm-suave">· {l.empresa}</span>}
                  </span>
                  <span className="mt-0.5 block truncate text-[0.8rem] text-adm-suave">{l.mensagem}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="rounded-xl border border-adm-linha bg-adm-card">
        <header className="flex items-center justify-between border-b border-adm-linha px-5 py-3.5">
          <h2 className="flex items-center gap-2 text-[0.95rem] font-semibold">
            <Package size={16} /> Produtos
          </h2>
          <Link href="/admin/produtos" className="text-[0.8rem] text-adm-acento hover:underline">
            gerenciar
          </Link>
        </header>
        <ul className="divide-y divide-adm-linha">
          {produtos.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 px-5 py-3">
              <span className="flex items-center gap-2.5">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: p.cor || '#5b8cff' }}
                  aria-hidden
                />
                <span className="text-[0.9rem]">{p.nome}</span>
                {!p.ativo && (
                  <span className="rounded bg-adm-card2 px-1.5 py-0.5 text-[0.64rem] uppercase tracking-wider text-adm-suave">
                    inativo
                  </span>
                )}
              </span>
              <span className="text-[0.78rem] text-adm-suave">{p.categoria}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
