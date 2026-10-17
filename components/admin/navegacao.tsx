'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  BadgeDollarSign, ExternalLink, Image as ImgIcon, LayoutDashboard, LogOut, Mail, Menu,
  Package, Palette, ScrollText, UserCog, X,
} from 'lucide-react';
import { BotaoPublicar } from '@/components/admin/publicar';
import { sair as encerrarSessao, type Sessao } from '@/lib/admin-auth';

/**
 * Navegacao do painel: rail fixo no desktop, gaveta no celular.
 * Itens em ordem alfabetica (o "Painel" fica fixo no topo).
 */
const ITENS = [
  { href: '/admin', label: 'Painel', Icone: LayoutDashboard, fixo: true },
  { href: '/admin/identidade', label: 'Identidade e contato', Icone: UserCog },
  { href: '/admin/imagens', label: 'Imagens', Icone: ImgIcon },
  { href: '/admin/mensagens', label: 'Mensagens', Icone: Mail },
  { href: '/admin/paginas', label: 'Páginas', Icone: ScrollText },
  { href: '/admin/planos', label: 'Planos', Icone: BadgeDollarSign },
  { href: '/admin/produtos', label: 'Produtos', Icone: Package },
  { href: '/admin/tema', label: 'Tema visual', Icone: Palette },
];

export function Navegacao({ sessao, naoLidas }: { sessao: Sessao; naoLidas: number }) {
  const [aberto, setAberto] = useState(false);
  const path = usePathname();
  const router = useRouter();

  useEffect(() => setAberto(false), [path]);

  async function sair() {
    await encerrarSessao();
    router.replace('/admin/login/');
  }

  const lista = (
    <nav className="flex h-full flex-col gap-1 p-3">
      <div className="mb-3 px-2 pt-1">
        <span className="text-[0.95rem] font-semibold tracking-tight">Painel do site</span>
        <span className="mt-0.5 block text-[0.76rem] text-adm-suave">
          {sessao.email} · {sessao.papel === 'admin' ? 'administrador' : 'editor'}
        </span>
      </div>

      {ITENS.map(({ href, label, Icone }) => {
        const ativo = href === '/admin' ? path === '/admin' : path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[0.88rem] transition-colors ${
              ativo ? 'bg-adm-card2 text-adm-texto' : 'text-adm-suave hover:bg-adm-card2/60 hover:text-adm-texto'
            }`}
          >
            <Icone size={16} />
            <span className="flex-1">{label}</span>
            {href === '/admin/mensagens' && naoLidas > 0 && (
              <span className="rounded-full bg-adm-acento px-1.5 py-0.5 text-[0.66rem] font-bold text-[#08101f]">
                {naoLidas}
              </span>
            )}
          </Link>
        );
      })}

      <span className="flex-1" />

      <BotaoPublicar />

      <Link
        href="/"
        target="_blank"
        className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[0.88rem] text-adm-suave hover:bg-adm-card2/60 hover:text-adm-texto"
      >
        <ExternalLink size={16} /> Ver o site
      </Link>
      <button
        onClick={sair}
        className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[0.88rem] text-adm-suave hover:bg-adm-card2/60 hover:text-adm-texto"
      >
        <LogOut size={16} /> Sair
      </button>
    </nav>
  );

  return (
    <>
      {/* topo mobile */}
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-adm-linha bg-adm-bg/95 px-3 py-2.5 backdrop-blur lg:hidden">
        <button
          onClick={() => setAberto((v) => !v)}
          className="grid h-9 w-9 place-items-center rounded-lg border border-adm-linha"
          aria-label="Abrir menu"
        >
          {aberto ? <X size={17} /> : <Menu size={17} />}
        </button>
        <span className="text-[0.95rem] font-semibold">Painel do site</span>
      </header>

      {/* rail desktop */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-adm-linha bg-adm-card lg:block">
        {lista}
      </aside>

      {/* gaveta mobile */}
      {aberto && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setAberto(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="absolute inset-y-0 left-0 w-72 bg-adm-card" onClick={(e) => e.stopPropagation()}>
            {lista}
          </div>
        </div>
      )}
    </>
  );
}
