import type { Metadata } from 'next';
import './globals.css';
import { classesFonte, varFonte } from './fontes';
import { getConfig, getTema } from '@/lib/cms';
import { urlMidia } from '@/lib/cms';
import { TEMA_PADRAO } from '@/lib/cms-padroes';
import { corSegura, cssDeVariaveis, medidaSegura } from '@/lib/tema-css';

/**
 * Layout raiz. Le o tema do banco e injeta as variaveis CSS — e assim que o
 * /admin/tema muda cores, fontes, raio e largura do site sem tocar em codigo.
 */

export async function generateMetadata(): Promise<Metadata> {
  const { identidade, seo } = await getConfig();
  const base = process.env.SITE_URL || 'http://localhost:3010';
  const titulo = seo.titulo || `${identidade.nome} — ${identidade.tagline}`;
  const imagem = urlMidia(seo.imagem);
  return {
    metadataBase: new URL(base),
    title: { default: titulo, template: `%s · ${identidade.nome}` },
    description: seo.descricao || identidade.descricao,
    openGraph: {
      title: titulo,
      description: seo.descricao || identidade.descricao,
      siteName: identidade.nome,
      locale: 'pt_BR',
      type: 'website',
      images: imagem ? [imagem] : undefined,
    },
    twitter: { card: 'summary_large_image' },
    robots: { index: true, follow: true },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const tema = await getTema();

  // Cada valor passa pela mesma regra do /admin (ver lib/tema-css.ts): o banco aceita qualquer texto, e este
  // valor vai para dentro de um <style>.
  const p = TEMA_PADRAO;
  const vars: Record<string, string> = {
    '--sf-fundo': corSegura(tema.cor_fundo, p.cor_fundo),
    '--sf-superficie': corSegura(tema.cor_superficie, p.cor_superficie),
    '--sf-superficie-2': corSegura(tema.cor_superficie_2, p.cor_superficie_2),
    '--sf-texto': corSegura(tema.cor_texto, p.cor_texto),
    '--sf-texto-suave': corSegura(tema.cor_texto_suave, p.cor_texto_suave),
    '--sf-acento': corSegura(tema.cor_acento, p.cor_acento),
    '--sf-acento-texto': corSegura(tema.cor_acento_texto, p.cor_acento_texto),
    '--sf-acento-2': corSegura(tema.cor_acento_2, p.cor_acento_2),
    '--sf-linha': corSegura(tema.cor_linha, p.cor_linha),
    '--sf-raio': medidaSegura(tema.raio, p.raio),
    '--sf-largura': medidaSegura(tema.largura, p.largura),
    '--sf-fonte-display': varFonte(tema.fonte_display, 'Bricolage Grotesque'),
    '--sf-fonte-corpo': varFonte(tema.fonte_corpo, 'Instrument Sans'),
    '--fonte-mono': 'var(--f-mono)',
  };
  const css = cssDeVariaveis(vars);

  return (
    <html lang="pt-BR" className={classesFonte}>
      {/* suppressHydrationWarning: extensoes de navegador injetam atributos no
          <body> antes da hidratacao. Silencia so os atributos deste elemento. */}
      <body
        suppressHydrationWarning
        className={[tema.grao ? 'grao' : '', tema.grade ? '' : 'sem-grade'].filter(Boolean).join(' ') || undefined}
      >
        <style dangerouslySetInnerHTML={{ __html: css }} />
        {children}
      </body>
    </html>
  );
}
