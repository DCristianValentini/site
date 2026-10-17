'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Bold, Italic, Underline, Strikethrough, Link2, List, ListOrdered, Quote,
  Heading2, Heading3, Palette, Type, Eraser, Undo2, Redo2,
} from 'lucide-react';

/**
 * Editor de texto formatado do painel (contenteditable + document.execCommand).
 *
 * Guarda HTML. O servidor RE-SANITIZA no salvamento (lib/sanitize.ts), entao o
 * que sair daqui nunca vira injecao no site publico.
 *
 * execCommand esta deprecado, mas e o unico caminho sem trazer um editor
 * completo (ProseMirror/Slate) como dependencia — e continua funcionando em
 * todos os navegadores atuais.
 */

const CORES = ['#F1EEE8', '#FF7A2F', '#7FE7C4', '#6EA8FE', '#F2C14E', '#C9A0FF', '#9A9BA6'];
const TAMANHOS = [
  { v: '2', l: 'Pequeno' },
  { v: '3', l: 'Normal' },
  { v: '5', l: 'Grande' },
  { v: '6', l: 'Enorme' },
];

export function EditorRico({
  valor,
  onChange,
  placeholder = 'Escreva aqui…',
}: {
  valor: string;
  onChange: (html: string) => void;
  placeholder?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [menu, setMenu] = useState<'cor' | 'tamanho' | null>(null);

  // sincroniza de fora pra dentro so quando o conteudo mudou de verdade
  // (reescrever a cada tecla mataria a posicao do cursor)
  useEffect(() => {
    const el = ref.current;
    if (el && el.innerHTML !== valor) el.innerHTML = valor || '';
  }, [valor]);

  function cmd(comando: string, arg?: string) {
    ref.current?.focus();
    document.execCommand(comando, false, arg);
    emitir();
    setMenu(null);
  }

  function emitir() {
    if (ref.current) onChange(ref.current.innerHTML);
  }

  function link() {
    const url = window.prompt('Endereço do link (https://… , /pagina, mailto:…)');
    if (url === null) return;
    if (!url.trim()) {
      cmd('unlink');
      return;
    }
    cmd('createLink', url.trim());
  }

  const Bt = ({
    onClick,
    titulo,
    children,
  }: {
    onClick: () => void;
    titulo: string;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={titulo}
      aria-label={titulo}
      className="grid h-8 w-8 place-items-center rounded-md text-adm-suave transition-colors hover:bg-adm-card2 hover:text-adm-texto"
    >
      {children}
    </button>
  );

  return (
    <div>
      <div className="flex flex-wrap items-center gap-0.5 rounded-t-[10px] border border-adm-linha bg-adm-card2 px-1.5 py-1">
        <Bt onClick={() => cmd('bold')} titulo="Negrito"><Bold size={15} /></Bt>
        <Bt onClick={() => cmd('italic')} titulo="Itálico"><Italic size={15} /></Bt>
        <Bt onClick={() => cmd('underline')} titulo="Sublinhado"><Underline size={15} /></Bt>
        <Bt onClick={() => cmd('strikeThrough')} titulo="Riscado"><Strikethrough size={15} /></Bt>
        <span className="mx-1 h-5 w-px bg-adm-linha" />
        <Bt onClick={() => cmd('formatBlock', 'h2')} titulo="Título 2"><Heading2 size={15} /></Bt>
        <Bt onClick={() => cmd('formatBlock', 'h3')} titulo="Título 3"><Heading3 size={15} /></Bt>
        <Bt onClick={() => cmd('formatBlock', 'blockquote')} titulo="Citação"><Quote size={15} /></Bt>
        <span className="mx-1 h-5 w-px bg-adm-linha" />
        <Bt onClick={() => cmd('insertUnorderedList')} titulo="Lista"><List size={15} /></Bt>
        <Bt onClick={() => cmd('insertOrderedList')} titulo="Lista numerada"><ListOrdered size={15} /></Bt>
        <Bt onClick={link} titulo="Link"><Link2 size={15} /></Bt>
        <span className="mx-1 h-5 w-px bg-adm-linha" />

        <div className="relative">
          <Bt onClick={() => setMenu(menu === 'cor' ? null : 'cor')} titulo="Cor do texto"><Palette size={15} /></Bt>
          {menu === 'cor' && (
            <div className="absolute left-0 top-9 z-20 flex gap-1.5 rounded-lg border border-adm-linha bg-adm-card p-2 shadow-xl">
              {CORES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => cmd('foreColor', c)}
                  className="h-5 w-5 rounded-full border border-white/15"
                  style={{ background: c }}
                  aria-label={`Cor ${c}`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <Bt onClick={() => setMenu(menu === 'tamanho' ? null : 'tamanho')} titulo="Tamanho"><Type size={15} /></Bt>
          {menu === 'tamanho' && (
            <div className="absolute left-0 top-9 z-20 w-32 rounded-lg border border-adm-linha bg-adm-card p-1 shadow-xl">
              {TAMANHOS.map((t) => (
                <button
                  key={t.v}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => cmd('fontSize', t.v)}
                  className="block w-full rounded px-2.5 py-1.5 text-left text-[0.82rem] hover:bg-adm-card2"
                >
                  {t.l}
                </button>
              ))}
            </div>
          )}
        </div>

        <span className="mx-1 h-5 w-px bg-adm-linha" />
        <Bt onClick={() => cmd('removeFormat')} titulo="Limpar formatação"><Eraser size={15} /></Bt>
        <Bt onClick={() => cmd('undo')} titulo="Desfazer"><Undo2 size={15} /></Bt>
        <Bt onClick={() => cmd('redo')} titulo="Refazer"><Redo2 size={15} /></Bt>
      </div>

      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        data-vazio={placeholder}
        onInput={emitir}
        onBlur={emitir}
        className="editor-rico"
      />
    </div>
  );
}
