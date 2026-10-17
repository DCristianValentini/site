import { Bricolage_Grotesque, Fraunces, IBM_Plex_Mono, Instrument_Sans, Instrument_Serif } from 'next/font/google';

/**
 * Fontes disponiveis para o tema (/admin/tema). O next/font precisa de import
 * ESTATICO, entao as familias sao carregadas aqui e o tema apenas escolhe qual
 * variavel CSS vira --sf-fonte-display / --sf-fonte-corpo.
 *
 * Somente as fontes do tema padrao usam preload; as alternativas carregam sob
 * demanda para nao pesar o primeiro paint.
 */

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--f-bricolage',
  display: 'swap',
});

const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  variable: '--f-instrument-sans',
  display: 'swap',
});

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--f-mono',
  display: 'swap',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--f-fraunces',
  display: 'swap',
  preload: false,
});

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  variable: '--f-instrument-serif',
  display: 'swap',
  preload: false,
});

/** Classe que expoe todas as variaveis de fonte no <html>. */
export const classesFonte = [
  bricolage.variable,
  instrumentSans.variable,
  mono.variable,
  fraunces.variable,
  instrumentSerif.variable,
].join(' ');

/** nome gravado no banco -> variavel CSS */
const MAPA: Record<string, string> = {
  'Bricolage Grotesque': 'var(--f-bricolage)',
  'Instrument Sans': 'var(--f-instrument-sans)',
  Fraunces: 'var(--f-fraunces)',
  'Instrument Serif': 'var(--f-instrument-serif)',
  'IBM Plex Mono': 'var(--f-mono)',
};

export const FONTES_DISPLAY = ['Bricolage Grotesque', 'Fraunces', 'Instrument Serif', 'Instrument Sans'];
export const FONTES_CORPO = ['Instrument Sans', 'Bricolage Grotesque', 'IBM Plex Mono'];

export function varFonte(nome: string | undefined, padrao: string): string {
  return MAPA[nome ?? ''] ?? MAPA[padrao] ?? 'ui-sans-serif';
}
