import { urlTela } from '@/lib/cms-padroes';

export interface TelaItem {
  arquivo: string;
  titulo: string;
  texto: string;
}

/**
 * Telas reais do sistema, narradas passo a passo: texto de um lado, imagem do outro.
 * As imagens ficam em public/telas (geradas do console da suite com dados de demonstracao).
 * Clicar na imagem abre em tamanho original.
 */
export function GaleriaTelas({ telas, cor }: { telas: TelaItem[]; cor?: string | null }) {
  const acento = cor || 'var(--sf-acento)';
  return (
    <ol className="space-y-14">
      {telas.map((t, i) => {
        const src = urlTela(t.arquivo);
        return (
          <li key={`${t.arquivo}-${i}`} className="grid items-start gap-6 lg:grid-cols-[0.34fr_0.66fr] lg:gap-10">
            <div className="lg:sticky lg:top-24">
              <span className="font-mono text-[0.8rem] tabular-nums" style={{ color: acento }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="t-h3 mt-2">{t.titulo}</h3>
              <p className="mt-3 text-[0.95rem] leading-relaxed" style={{ color: 'var(--sf-texto-suave)' }}>
                {t.texto}
              </p>
            </div>
            {src && (
              <a
                href={src}
                target="_blank"
                rel="noreferrer"
                className="card block overflow-hidden p-1.5 transition-transform duration-300 hover:-translate-y-0.5"
                style={{ background: 'var(--sf-superficie-2)' }}
                aria-label={`Abrir a tela em tamanho original: ${t.titulo}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={t.titulo}
                  loading="lazy"
                  className="w-full rounded-[calc(var(--sf-raio)-6px)]"
                />
              </a>
            )}
          </li>
        );
      })}
    </ol>
  );
}
