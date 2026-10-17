import Link from 'next/link';
import { Instagram, Linkedin, Facebook, Youtube, Github, Mail, Phone, MapPin, Clock } from 'lucide-react';
import type { ConfigSite, Produto } from '@/lib/tipos';
import { urlMidia } from '@/lib/cms';

const REDES = [
  { chave: 'instagram', Icone: Instagram, rotulo: 'Instagram' },
  { chave: 'linkedin', Icone: Linkedin, rotulo: 'LinkedIn' },
  { chave: 'facebook', Icone: Facebook, rotulo: 'Facebook' },
  { chave: 'youtube', Icone: Youtube, rotulo: 'YouTube' },
  { chave: 'github', Icone: Github, rotulo: 'GitHub' },
] as const;

export function Footer({ config, produtos }: { config: ConfigSite; produtos: Produto[] }) {
  const { identidade, contato, redes, nav } = config;
  const logo = urlMidia(identidade.logo);
  const ano = 2026;

  return (
    <footer className="relative border-t" style={{ borderColor: 'var(--sf-linha)' }}>
      <div className="limite grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <div className="flex items-center gap-2.5">
            {logo ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={logo} alt={identidade.nome} className="h-8 w-auto" />
            ) : (
              <span
                className="grid h-9 w-9 place-items-center rounded-[10px] text-[0.82rem] font-bold"
                style={{ background: 'var(--sf-acento)', color: 'var(--sf-acento-texto)' }}
              >
                {identidade.sigla || identidade.nome.slice(0, 2).toUpperCase()}
              </span>
            )}
            <span className="font-semibold tracking-tight">{identidade.nome}</span>
          </div>
          <p className="mt-4 max-w-xs text-[0.9rem]" style={{ color: 'var(--sf-texto-suave)' }}>
            {identidade.descricao || identidade.tagline}
          </p>
          {(redes.instagram || redes.linkedin || redes.facebook || redes.youtube || redes.github) && (
            <div className="mt-5 flex gap-2">
              {REDES.map(({ chave, Icone, rotulo }) => {
                const url = redes[chave];
                if (!url) return null;
                return (
                  <a
                    key={chave}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={rotulo}
                    className="grid h-9 w-9 place-items-center rounded-lg border transition-colors hover:bg-white/5"
                    style={{ borderColor: 'var(--sf-linha)' }}
                  >
                    <Icone size={16} />
                  </a>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <h3 className="etiqueta">Produtos</h3>
          <ul className="mt-4 space-y-2.5 text-[0.9rem]">
            {/* destaque no rodape: sistemas de gestao e pacotes da suite; o resto fica no catalogo */}
            {produtos
              .filter((p) => p.linha === 'Sistemas de gestão' || p.slug.startsWith('pacote-'))
              .map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/produtos/${p.slug}`}
                    className="transition-colors hover:text-[var(--sf-acento)]"
                    style={{ color: 'var(--sf-texto-suave)' }}
                  >
                    {p.nome}
                  </Link>
                </li>
              ))}
            <li>
              <Link href="/produtos" className="font-medium transition-colors hover:text-[var(--sf-acento)]">
                Todos os produtos →
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="etiqueta">Navegar</h3>
          <ul className="mt-4 space-y-2.5 text-[0.9rem]">
            {nav.itens.map((i) => (
              <li key={`f-${i.href}${i.label}`}>
                <Link
                  href={i.href}
                  className="transition-colors hover:text-[var(--sf-acento)]"
                  style={{ color: 'var(--sf-texto-suave)' }}
                >
                  {i.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="etiqueta">Contato</h3>
          <ul className="mt-4 space-y-3 text-[0.9rem]" style={{ color: 'var(--sf-texto-suave)' }}>
            {contato.email && (
              <li className="flex items-start gap-2.5">
                <Mail size={15} className="mt-0.5 shrink-0" style={{ color: 'var(--sf-acento)' }} />
                <a href={`mailto:${contato.email}`} className="hover:text-[var(--sf-texto)]">
                  {contato.email}
                </a>
              </li>
            )}
            {contato.telefone && (
              <li className="flex items-start gap-2.5">
                <Phone size={15} className="mt-0.5 shrink-0" style={{ color: 'var(--sf-acento)' }} />
                <a href={`tel:${contato.telefone.replace(/\D/g, '')}`} className="hover:text-[var(--sf-texto)]">
                  {contato.telefone}
                </a>
              </li>
            )}
            {(contato.endereco || contato.cidade) && (
              <li className="flex items-start gap-2.5">
                <MapPin size={15} className="mt-0.5 shrink-0" style={{ color: 'var(--sf-acento)' }} />
                <span>
                  {contato.endereco}
                  {contato.endereco && contato.cidade ? <br /> : null}
                  {contato.cidade}
                </span>
              </li>
            )}
            {contato.horario && (
              <li className="flex items-start gap-2.5">
                <Clock size={15} className="mt-0.5 shrink-0" style={{ color: 'var(--sf-acento)' }} />
                <span>{contato.horario}</span>
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="border-t" style={{ borderColor: 'var(--sf-linha)' }}>
        <div
          className="limite flex flex-col gap-2 py-5 text-[0.8rem] sm:flex-row sm:items-center sm:justify-between"
          style={{ color: 'var(--sf-texto-suave)' }}
        >
          <span>
            © {ano} {identidade.nome}
            {contato.cnpj ? ` · CNPJ ${contato.cnpj}` : ''}
          </span>
          <span className="etiqueta" style={{ letterSpacing: '0.16em' }}>
            {identidade.tagline}
          </span>
        </div>
      </div>
    </footer>
  );
}
