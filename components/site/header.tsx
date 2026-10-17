'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import type { Identidade, Nav } from '@/lib/tipos';

/**
 * Cabecalho do site. Transparente no topo e solido depois do scroll; no celular
 * o menu vira gaveta em tela cheia (padrao de responsividade do projeto).
 */
export function Header({
  identidade,
  nav,
  logoUrl,
}: {
  identidade: Identidade;
  nav: Nav;
  logoUrl: string | null;
}) {
  const [aberto, setAberto] = useState(false);
  const [rolou, setRolou] = useState(false);
  const path = usePathname();

  useEffect(() => {
    const onScroll = () => setRolou(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // fecha a gaveta ao trocar de rota
  useEffect(() => {
    setAberto(false);
  }, [path]);

  useEffect(() => {
    document.body.style.overflow = aberto ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [aberto]);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAberto(false);
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, []);

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 transition-colors duration-300"
      style={{
        background: rolou ? 'color-mix(in srgb, var(--sf-fundo) 88%, transparent)' : 'transparent',
        borderBottom: `1px solid ${rolou ? 'var(--sf-linha)' : 'transparent'}`,
        backdropFilter: rolou ? 'blur(14px)' : undefined,
      }}
    >
      <div className="limite flex h-[68px] items-center justify-between gap-4">
        <Link href="/" className="group flex shrink-0 items-center gap-2.5" aria-label={identidade.nome}>
          {logoUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={logoUrl} alt={identidade.nome} className="h-8 w-auto" />
          ) : (
            <span
              className="grid h-9 w-9 place-items-center rounded-[10px] text-[0.82rem] font-bold tracking-tight transition-transform group-hover:-rotate-6"
              style={{ background: 'var(--sf-acento)', color: 'var(--sf-acento-texto)' }}
            >
              {identidade.sigla || identidade.nome.slice(0, 2).toUpperCase()}
            </span>
          )}
          <span className="hidden text-[0.98rem] font-semibold tracking-tight sm:block">
            {identidade.nome}
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {nav.itens.map((i) => {
            const ativo = path === i.href || (i.href !== '/' && path.startsWith(i.href));
            return (
              <Link
                key={i.href + i.label}
                href={i.href}
                className="relative rounded-lg px-3.5 py-2 text-[0.9rem] transition-colors"
                style={{ color: ativo ? 'var(--sf-texto)' : 'var(--sf-texto-suave)' }}
              >
                {i.label}
                {ativo && (
                  <span
                    className="absolute inset-x-3.5 -bottom-0.5 h-px"
                    style={{ background: 'var(--sf-acento)' }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {nav.cta_texto && (
            <Link href={nav.cta_url || '/contato'} className="btn btn-acento hidden sm:inline-flex">
              {nav.cta_texto}
            </Link>
          )}
          <button
            type="button"
            onClick={() => setAberto((v) => !v)}
            className="grid h-10 w-10 place-items-center rounded-lg border lg:hidden"
            style={{ borderColor: 'var(--sf-linha)' }}
            aria-label={aberto ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={aberto}
          >
            {aberto ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* gaveta mobile */}
      <div
        className={`fixed inset-0 top-[68px] z-40 lg:hidden ${aberto ? '' : 'pointer-events-none opacity-0'} transition-opacity duration-200`}
        style={{ background: 'var(--sf-fundo)' }}
      >
        <nav className="limite flex flex-col gap-1 py-6">
          {nav.itens.map((i) => (
            <Link
              key={`m-${i.href}${i.label}`}
              href={i.href}
              className="border-b py-4 text-[1.4rem] font-semibold tracking-tight"
              style={{ borderColor: 'var(--sf-linha)' }}
            >
              {i.label}
            </Link>
          ))}
          {nav.cta_texto && (
            <Link href={nav.cta_url || '/contato'} className="btn btn-acento mt-6 w-full py-3.5">
              {nav.cta_texto}
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
