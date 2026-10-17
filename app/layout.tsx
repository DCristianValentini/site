import type { Metadata } from 'next';
import './globals.css';
import { classesFonte, varFonte } from './fontes';
import { getConfig, getTema } from '@/lib/cms';
import { urlMidia } from '@/lib/cms';

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

  const vars: Record<string, string> = {
    '--sf-fundo': tema.cor_fundo,
    '--sf-superficie': tema.cor_superficie,
    '--sf-superficie-2': tema.cor_superficie_2,
    '--sf-texto': tema.cor_texto,
    '--sf-texto-suave': tema.cor_texto_suave,
    '--sf-acento': tema.cor_acento,
    '--sf-acento-texto': tema.cor_acento_texto,
    '--sf-acento-2': tema.cor_acento_2,
    '--sf-linha': tema.cor_linha,
    '--sf-raio': tema.raio,
    '--sf-largura': tema.largura,
    '--sf-fonte-display': varFonte(tema.fonte_display, 'Bricolage Grotesque'),
    '--sf-fonte-corpo': varFonte(tema.fonte_corpo, 'Instrument Sans'),
    '--fonte-mono': 'var(--f-mono)',
  };
  const css = `:root{${Object.entries(vars).map(([k, v]) => `${k}:${v}`).join(';')}}`;

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
