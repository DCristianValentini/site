import type { Config } from 'tailwindcss';

/**
 * O tema do SITE PUBLICO e dirigido por CSS variables gravadas no banco
 * (tabela `tema`, editavel em /admin/tema) — por isso as cores abaixo apontam
 * para var(--sf-*) em vez de valores fixos. O /admin usa a paleta `adm` fixa
 * (o painel nao muda de cara quando o cliente troca o tema do site).
 */
const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Tema do site (vem do banco)
        fundo: 'var(--sf-fundo)',
        superficie: 'var(--sf-superficie)',
        superficie2: 'var(--sf-superficie-2)',
        tinta: 'var(--sf-texto)',
        tintaSuave: 'var(--sf-texto-suave)',
        acento: 'var(--sf-acento)',
        acentoTinta: 'var(--sf-acento-texto)',
        acento2: 'var(--sf-acento-2)',
        linha: 'var(--sf-linha)',
        // Painel admin (fixo)
        adm: {
          bg: '#0f1115',
          card: '#171a21',
          card2: '#1f232c',
          linha: '#2a2f3a',
          texto: '#e8e9ed',
          suave: '#9ba1b0',
          acento: '#5b8cff',
        },
      },
      fontFamily: {
        display: ['var(--sf-fonte-display)', 'ui-sans-serif', 'sans-serif'],
        corpo: ['var(--sf-fonte-corpo)', 'ui-sans-serif', 'sans-serif'],
        mono: ['var(--fonte-mono)', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        tema: 'var(--sf-raio)',
      },
      maxWidth: {
        conteudo: 'var(--sf-largura)',
      },
      keyframes: {
        sobe: {
          from: { opacity: '0', transform: 'translateY(18px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        surge: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        risca: {
          from: { transform: 'scaleX(0)' },
          to: { transform: 'scaleX(1)' },
        },
      },
      animation: {
        sobe: 'sobe .7s cubic-bezier(.16,.84,.44,1) both',
        surge: 'surge .9s ease both',
        risca: 'risca .8s cubic-bezier(.16,.84,.44,1) both',
      },
    },
  },
  plugins: [],
};

export default config;
