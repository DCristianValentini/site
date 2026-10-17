'use client';

import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import type { Campo } from '@/lib/blocos';
import type { Dados } from '@/lib/tipos';
import { AreaTexto, Alternar, Botao, Campo as Rotulo, Entrada, Selecao } from './ui';
import { EditorRico } from './editor-rico';
import { SeletorImagem } from './seletor-imagem';

/**
 * Formulario GERADO a partir dos descritores de campo (lib/blocos.ts).
 * É o que permite "editar cada detalhe" sem escrever uma tela por tipo de bloco:
 * criar um bloco novo = adicionar a entrada no registro, e o editor aparece.
 */

function ValorCampo({
  campo,
  valor,
  onChange,
}: {
  campo: Campo;
  valor: unknown;
  onChange: (v: unknown) => void;
}) {
  switch (campo.tipo) {
    case 'textarea':
      return (
        <AreaTexto
          rows={3}
          value={String(valor ?? '')}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case 'rich':
      return <EditorRico valor={String(valor ?? '')} onChange={onChange} />;

    case 'imagem':
      return <SeletorImagem valor={String(valor ?? '')} onChange={onChange} />;

    case 'bool':
      return <Alternar valor={valor === true || valor === 1 || valor === '1'} onChange={onChange} />;

    case 'numero':
      return (
        <Entrada
          type="number"
          value={String(valor ?? 0)}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      );

    case 'select':
      return (
        <Selecao value={String(valor ?? '')} onChange={(e) => onChange(e.target.value)}>
          <option value="">—</option>
          {(campo.opcoes ?? []).map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.label}
            </option>
          ))}
        </Selecao>
      );

    case 'cor':
      return (
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={/^#[0-9a-fA-F]{6}$/.test(String(valor ?? '')) ? String(valor) : '#000000'}
            onChange={(e) => onChange(e.target.value)}
            className="h-9 w-12 cursor-pointer rounded border border-adm-linha bg-transparent"
          />
          <Entrada value={String(valor ?? '')} onChange={(e) => onChange(e.target.value)} placeholder="#FF7A2F" />
        </div>
      );

    case 'lista':
      return <ListaEditor campo={campo} itens={Array.isArray(valor) ? (valor as Dados[]) : []} onChange={onChange} />;

    default:
      return <Entrada value={String(valor ?? '')} onChange={(e) => onChange(e.target.value)} />;
  }
}

function ListaEditor({
  campo,
  itens,
  onChange,
}: {
  campo: Campo;
  itens: Dados[];
  onChange: (v: Dados[]) => void;
}) {
  const itemCampos = campo.itemCampos ?? [];

  function novo() {
    const vazio: Dados = {};
    for (const c of itemCampos) vazio[c.chave] = c.tipo === 'bool' ? true : '';
    onChange([...itens, vazio]);
  }

  function mover(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= itens.length) return;
    const copia = [...itens];
    [copia[i], copia[j]] = [copia[j], copia[i]];
    onChange(copia);
  }

  return (
    <div className="space-y-2.5">
      {itens.map((item, i) => (
        <div key={i} className="rounded-lg border border-adm-linha bg-adm-card2/60 p-3.5">
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <span className="text-[0.74rem] font-semibold uppercase tracking-wider text-adm-suave">
              {campo.itemLabel ?? 'Item'} {i + 1}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => mover(i, -1)}
                disabled={i === 0}
                className="rounded p-1 text-adm-suave hover:bg-adm-card disabled:opacity-30"
                aria-label="Mover para cima"
              >
                <ChevronUp size={15} />
              </button>
              <button
                type="button"
                onClick={() => mover(i, 1)}
                disabled={i === itens.length - 1}
                className="rounded p-1 text-adm-suave hover:bg-adm-card disabled:opacity-30"
                aria-label="Mover para baixo"
              >
                <ChevronDown size={15} />
              </button>
              <button
                type="button"
                onClick={() => onChange(itens.filter((_, k) => k !== i))}
                className="rounded p-1 text-adm-suave hover:bg-adm-card hover:text-red-400"
                aria-label="Remover"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2">
            {itemCampos.map((c) => (
              <Rotulo key={c.chave} label={c.label} ajuda={c.ajuda} largo={c.largo || c.tipo === 'rich'}>
                <ValorCampo
                  campo={c}
                  valor={item[c.chave]}
                  onChange={(v) => {
                    const copia = [...itens];
                    copia[i] = { ...copia[i], [c.chave]: v };
                    onChange(copia);
                  }}
                />
              </Rotulo>
            ))}
          </div>
        </div>
      ))}

      <Botao onClick={novo}>
        <Plus size={14} /> Adicionar {(campo.itemLabel ?? 'item').toLowerCase()}
      </Botao>
    </div>
  );
}

export function CamposEditor({
  campos,
  dados,
  onChange,
}: {
  campos: Campo[];
  dados: Dados;
  onChange: (d: Dados) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {campos.map((c) => (
        <Rotulo
          key={c.chave}
          label={c.label}
          ajuda={c.ajuda}
          largo={c.largo || c.tipo === 'rich' || c.tipo === 'lista' || c.tipo === 'imagem'}
        >
          <ValorCampo campo={c} valor={dados[c.chave]} onChange={(v) => onChange({ ...dados, [c.chave]: v })} />
        </Rotulo>
      ))}
    </div>
  );
}
