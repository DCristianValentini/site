'use client';

import { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, Loader2, X } from 'lucide-react';

/** Componentes do painel (feitos a mao — nao usar shadcn CLI neste ambiente). */

export function Botao({
  children,
  variante = 'linha',
  carregando,
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: 'primario' | 'linha' | 'perigo';
  carregando?: boolean;
}) {
  const cls =
    variante === 'primario' ? 'adm-btn-primario' : variante === 'perigo' ? 'adm-btn-perigo' : 'adm-btn-linha';
  return (
    <button
      {...props}
      disabled={props.disabled || carregando}
      className={`adm-btn ${cls} disabled:opacity-50 ${className}`}
    >
      {carregando && <Loader2 size={14} className="animate-spin" />}
      {children}
    </button>
  );
}

export function Campo({
  label,
  ajuda,
  children,
  largo,
}: {
  label?: string;
  ajuda?: string;
  children: React.ReactNode;
  largo?: boolean;
}) {
  return (
    <div className={largo ? 'sm:col-span-2' : undefined}>
      {label && <label className="adm-label">{label}</label>}
      {children}
      {ajuda && <p className="mt-1 text-[0.72rem] leading-snug text-adm-suave/80">{ajuda}</p>}
    </div>
  );
}

export function Entrada(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`adm-campo ${props.className ?? ''}`} />;
}

/**
 * Campo de senha com botao de visualizar. REGRA DO PROJETO: todo input de senha
 * tem que ter a opcao de ver o que foi digitado — nunca usar <input type="password">
 * cru numa tela nova.
 */
export function EntradaSenha({
  className = '',
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  const [ver, setVer] = useState(false);
  return (
    <div className="relative">
      <input
        {...props}
        type={ver ? 'text' : 'password'}
        className={`adm-campo pr-10 ${className}`}
      />
      <button
        type="button"
        onClick={() => setVer((v) => !v)}
        className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-adm-suave transition-colors hover:text-adm-texto"
        aria-label={ver ? 'Ocultar senha' : 'Mostrar senha'}
        title={ver ? 'Ocultar senha' : 'Mostrar senha'}
        tabIndex={-1}
      >
        {ver ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

export function AreaTexto(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`adm-campo resize-y ${props.className ?? ''}`} />;
}

export function Selecao(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`adm-campo ${props.className ?? ''}`} />;
}

export function Alternar({
  valor,
  onChange,
  label,
}: {
  valor: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!valor)}
      className="flex items-center gap-2.5 text-left"
      aria-pressed={valor}
    >
      <span
        className="relative h-[22px] w-[38px] shrink-0 rounded-full transition-colors"
        style={{ background: valor ? '#5b8cff' : '#2a2f3a' }}
      >
        <span
          className="absolute top-[3px] h-4 w-4 rounded-full bg-white transition-all"
          style={{ left: valor ? 19 : 3 }}
        />
      </span>
      {label && <span className="text-[0.86rem] text-adm-texto">{label}</span>}
    </button>
  );
}

export function Cartao({
  titulo,
  acao,
  children,
  className = '',
}: {
  titulo?: string;
  acao?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-xl border border-adm-linha bg-adm-card ${className}`}>
      {(titulo || acao) && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-adm-linha px-5 py-3.5">
          {titulo && <h2 className="text-[0.95rem] font-semibold">{titulo}</h2>}
          {acao}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

/** Modal com folha inferior no celular (padrao de responsividade do projeto). */
export function Modal({
  aberto,
  onFechar,
  titulo,
  children,
  largura = 'max-w-2xl',
}: {
  aberto: boolean;
  onFechar: () => void;
  titulo: string;
  children: React.ReactNode;
  largura?: string;
}) {
  useEffect(() => {
    if (!aberto) return;
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && onFechar();
    window.addEventListener('keydown', onEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onEsc);
      document.body.style.overflow = '';
    };
  }, [aberto, onFechar]);

  if (!aberto) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-0 sm:items-center sm:p-6" onClick={onFechar}>
      <div
        className={`flex max-h-[92vh] w-full ${largura} flex-col rounded-t-2xl border border-adm-linha bg-adm-card sm:rounded-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-adm-linha px-5 py-4">
          <h2 className="text-[1rem] font-semibold">{titulo}</h2>
          <button onClick={onFechar} className="rounded-lg p-1.5 text-adm-suave hover:bg-adm-card2" aria-label="Fechar">
            <X size={17} />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

/** Botao de excluir com confirmacao inline (sem window.confirm). */
export function BotaoExcluir({
  onExcluir,
  rotulo = 'Excluir',
  aviso = 'Confirmar exclusão?',
}: {
  onExcluir: () => Promise<void> | void;
  rotulo?: string;
  aviso?: string;
}) {
  const [confirmando, setConfirmando] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const t = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => clearTimeout(t.current), []);

  if (!confirmando) {
    return (
      <Botao
        variante="perigo"
        onClick={() => {
          setConfirmando(true);
          t.current = setTimeout(() => setConfirmando(false), 5000);
        }}
      >
        {rotulo}
      </Botao>
    );
  }
  return (
    <span className="inline-flex items-center gap-2">
      <span className="text-[0.8rem] text-adm-suave">{aviso}</span>
      <Botao
        variante="perigo"
        carregando={ocupado}
        onClick={async () => {
          setOcupado(true);
          try {
            await onExcluir();
          } finally {
            setOcupado(false);
            setConfirmando(false);
          }
        }}
      >
        Sim, excluir
      </Botao>
      <Botao onClick={() => setConfirmando(false)}>Não</Botao>
    </span>
  );
}

/** Aviso de sucesso/erro que desaparece. */
export function Aviso({ texto, erro }: { texto: string; erro?: boolean }) {
  if (!texto) return null;
  return (
    <div
      className="rounded-lg px-3.5 py-2.5 text-[0.85rem]"
      style={
        erro
          ? { background: 'rgba(255,90,90,.12)', color: '#ff9a9a' }
          : { background: 'rgba(90,255,170,.1)', color: '#7fe7c4' }
      }
    >
      {texto}
    </div>
  );
}
