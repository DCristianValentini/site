'use client';

import { useState } from 'react';
import { RotateCcw, Save } from 'lucide-react';
import type { Tema } from '@/lib/tipos';
import { cli, msgErro } from '@/lib/cliente';
import { FONTES_CORPO, FONTES_DISPLAY } from '@/app/fontes';
import { Alternar, Aviso, Botao, Campo, Cartao, Entrada, Selecao } from './ui';

/** Tema visual do site: cores, fontes, cantos e largura. Com prévia ao vivo. */

const CORES: { chave: keyof Tema; label: string; ajuda?: string }[] = [
  { chave: 'cor_fundo', label: 'Fundo da página' },
  { chave: 'cor_superficie', label: 'Fundo das seções alternadas' },
  { chave: 'cor_superficie_2', label: 'Fundo dos cards' },
  { chave: 'cor_texto', label: 'Texto principal' },
  { chave: 'cor_texto_suave', label: 'Texto secundário' },
  { chave: 'cor_acento', label: 'Cor de destaque', ajuda: 'Botões, links e palavras destacadas.' },
  { chave: 'cor_acento_texto', label: 'Texto sobre o destaque', ajuda: 'Precisa contrastar com a cor de destaque.' },
  { chave: 'cor_acento_2', label: 'Destaque secundário', ajuda: 'Usada nos "check" e sinais de confirmação.' },
];

const PALETAS: { nome: string; valores: Partial<Tema> }[] = [
  {
    nome: 'Grafite e tangerina (atual)',
    valores: {
      cor_fundo: '#0A0B0E', cor_superficie: '#14161C', cor_superficie_2: '#1C1F27',
      cor_texto: '#F1EEE8', cor_texto_suave: '#9A9BA6', cor_acento: '#FF7A2F',
      cor_acento_texto: '#150A03', cor_acento_2: '#7FE7C4', cor_linha: 'rgba(255,255,255,0.09)',
    },
  },
  {
    nome: 'Azul noturno',
    valores: {
      cor_fundo: '#070B14', cor_superficie: '#0E1523', cor_superficie_2: '#16203180',
      cor_texto: '#EAF0FB', cor_texto_suave: '#94A0B8', cor_acento: '#4D8BFF',
      cor_acento_texto: '#04101F', cor_acento_2: '#69E3FF', cor_linha: 'rgba(255,255,255,0.08)',
    },
  },
  {
    nome: 'Claro editorial',
    valores: {
      cor_fundo: '#FBFAF7', cor_superficie: '#F2F0EA', cor_superficie_2: '#FFFFFF',
      cor_texto: '#14161A', cor_texto_suave: '#5C6169', cor_acento: '#C2410C',
      cor_acento_texto: '#FFF7ED', cor_acento_2: '#0F766E', cor_linha: 'rgba(0,0,0,0.12)',
    },
  },
  {
    nome: 'Verde industrial',
    valores: {
      cor_fundo: '#08100D', cor_superficie: '#0E1A16', cor_superficie_2: '#142420',
      cor_texto: '#EDF5F1', cor_texto_suave: '#8FA39B', cor_acento: '#3DDC84',
      cor_acento_texto: '#05130C', cor_acento_2: '#F2C14E', cor_linha: 'rgba(255,255,255,0.08)',
    },
  },
];

export function EditorTema({ inicial }: { inicial: Tema }) {
  const [t, setT] = useState<Tema>(inicial);
  const [salvando, setSalvando] = useState(false);
  const [aviso, setAviso] = useState('');
  const [erro, setErro] = useState('');

  function set<K extends keyof Tema>(k: K, v: Tema[K]) {
    setT((x) => ({ ...x, [k]: v }));
  }

  async function salvar() {
    setSalvando(true);
    setErro('');
    try {
      await cli.put('/api/admin/tema', t);
      setAviso('Tema salvo. Recarregue o site para ver.');
      setTimeout(() => setAviso(''), 3000);
    } catch (e) {
      setErro(msgErro(e));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[1.3rem] font-semibold tracking-tight">Tema visual</h1>
          <p className="mt-1 text-[0.86rem] text-adm-suave">
            Vale para todo o site público. O painel não muda de cor.
          </p>
        </div>
        <Botao variante="primario" carregando={salvando} onClick={salvar}>
          <Save size={14} /> Salvar tema
        </Botao>
      </div>

      {aviso && <Aviso texto={aviso} />}
      {erro && <Aviso texto={erro} erro />}

      <Cartao titulo="Paletas prontas">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PALETAS.map((p) => (
            <button
              key={p.nome}
              type="button"
              onClick={() => setT((x) => ({ ...x, ...p.valores }))}
              className="rounded-xl border border-adm-linha p-3 text-left transition-colors hover:border-adm-acento"
            >
              <span className="flex gap-1.5">
                {[p.valores.cor_fundo, p.valores.cor_superficie, p.valores.cor_acento, p.valores.cor_acento_2].map(
                  (c, i) => (
                    <span
                      key={i}
                      className="h-6 w-6 rounded-md border border-white/10"
                      style={{ background: c }}
                    />
                  ),
                )}
              </span>
              <span className="mt-2.5 block text-[0.82rem]">{p.nome}</span>
            </button>
          ))}
        </div>
      </Cartao>

      <div className="grid gap-4 lg:grid-cols-2">
        <Cartao titulo="Cores">
          <div className="grid gap-4 sm:grid-cols-2">
            {CORES.map((c) => (
              <Campo key={c.chave} label={c.label} ajuda={c.ajuda}>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={/^#[0-9a-fA-F]{6}$/.test(String(t[c.chave])) ? String(t[c.chave]) : '#000000'}
                    onChange={(e) => set(c.chave, e.target.value as never)}
                    className="h-9 w-12 shrink-0 cursor-pointer rounded border border-adm-linha bg-transparent"
                  />
                  <Entrada value={String(t[c.chave] ?? '')} onChange={(e) => set(c.chave, e.target.value as never)} />
                </div>
              </Campo>
            ))}
            <Campo label="Cor das linhas" ajuda="Aceita rgba() para linha translúcida." largo>
              <Entrada value={t.cor_linha} onChange={(e) => set('cor_linha', e.target.value)} />
            </Campo>
          </div>
        </Cartao>

        <div className="space-y-4">
          <Cartao titulo="Tipografia e formas">
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo label="Fonte dos títulos">
                <Selecao value={t.fonte_display} onChange={(e) => set('fonte_display', e.target.value)}>
                  {FONTES_DISPLAY.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </Selecao>
              </Campo>
              <Campo label="Fonte do texto">
                <Selecao value={t.fonte_corpo} onChange={(e) => set('fonte_corpo', e.target.value)}>
                  {FONTES_CORPO.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </Selecao>
              </Campo>
              <Campo label="Arredondamento" ajuda="Ex.: 0px (reto), 14px, 24px.">
                <Entrada value={t.raio} onChange={(e) => set('raio', e.target.value)} />
              </Campo>
              <Campo label="Largura do conteúdo" ajuda="Ex.: 1200px, 1360px.">
                <Entrada value={t.largura} onChange={(e) => set('largura', e.target.value)} />
              </Campo>
              <Campo label="Textura de grão">
                <Alternar valor={!!t.grao} label={t.grao ? 'Ligada' : 'Desligada'} onChange={(v) => set('grao', v ? 1 : 0)} />
              </Campo>
              <Campo label="Grade de fundo no topo">
                <Alternar valor={!!t.grade} label={t.grade ? 'Ligada' : 'Desligada'} onChange={(v) => set('grade', v ? 1 : 0)} />
              </Campo>
            </div>
          </Cartao>

          {/* ---- previa ---- */}
          <Cartao titulo="Prévia">
            <div
              className="overflow-hidden rounded-xl border p-6"
              style={{
                background: t.cor_fundo,
                borderColor: t.cor_linha,
                borderRadius: t.raio,
                color: t.cor_texto,
              }}
            >
              <p
                className="text-[0.66rem] uppercase tracking-[0.22em]"
                style={{ color: t.cor_texto_suave, fontFamily: 'var(--f-mono)' }}
              >
                Etiqueta da seção
              </p>
              <h3
                className="mt-2 text-[1.7rem] font-bold leading-tight tracking-tight"
                style={{ fontFamily: `var(--f-${t.fonte_display.toLowerCase().split(' ')[0]})` }}
              >
                Título de destaque com <span style={{ color: t.cor_acento }}>palavra realçada</span>
              </h3>
              <p className="mt-2 text-[0.9rem]" style={{ color: t.cor_texto_suave }}>
                Assim fica o texto de apoio das seções no site.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span
                  className="inline-flex items-center px-4 py-2 text-[0.85rem] font-medium"
                  style={{ background: t.cor_acento, color: t.cor_acento_texto, borderRadius: `calc(${t.raio} - 4px)` }}
                >
                  Botão principal
                </span>
                <span
                  className="inline-flex items-center border px-4 py-2 text-[0.85rem]"
                  style={{ borderColor: t.cor_linha, borderRadius: `calc(${t.raio} - 4px)` }}
                >
                  Botão secundário
                </span>
              </div>
              <div
                className="mt-4 border p-4"
                style={{ background: t.cor_superficie_2, borderColor: t.cor_linha, borderRadius: t.raio }}
              >
                <span className="text-[0.85rem]">Card sobre o fundo dos cards</span>
                <span className="mt-1 block text-[0.8rem]" style={{ color: t.cor_acento_2 }}>
                  ✓ item confirmado
                </span>
              </div>
            </div>
          </Cartao>
        </div>
      </div>

      <div className="flex flex-wrap justify-between gap-2">
        <Botao onClick={() => setT(inicial)}>
          <RotateCcw size={14} /> Desfazer alterações
        </Botao>
        <Botao variante="primario" carregando={salvando} onClick={salvar}>
          <Save size={14} /> Salvar tema
        </Botao>
      </div>
    </div>
  );
}
