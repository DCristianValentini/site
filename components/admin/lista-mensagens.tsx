'use client';

import { useState } from 'react';
import { Mail, MailOpen, Trash2 } from 'lucide-react';
import type { Lead } from '@/lib/tipos';
import { cli, msgErro } from '@/lib/cliente';
import { Aviso, BotaoExcluir } from './ui';

/** Caixa de entrada do formulário de contato do site. */
export function ListaMensagens({ iniciais }: { iniciais: Lead[] }) {
  const [itens, setItens] = useState(iniciais);
  const [filtro, setFiltro] = useState<'todas' | 'nao_lidas'>('todas');
  const [erro, setErro] = useState('');

  const lista = filtro === 'nao_lidas' ? itens.filter((l) => !l.lido) : itens;

  async function alternarLido(l: Lead) {
    const novo = l.lido ? 0 : 1;
    setItens((xs) => xs.map((x) => (x.id === l.id ? { ...x, lido: novo } : x)));
    try {
      await cli.patch(`/api/admin/leads/${l.id}`, { lido: novo });
    } catch (e) {
      setErro(msgErro(e));
    }
  }

  function dataBr(iso: string) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[1.3rem] font-semibold tracking-tight">Mensagens</h1>
          <p className="mt-1 text-[0.86rem] text-adm-suave">
            Tudo que chega pelo formulário da página de contato.
          </p>
        </div>
        <div className="flex gap-1 rounded-lg border border-adm-linha p-1">
          {(
            [
              ['todas', `Todas (${itens.length})`],
              ['nao_lidas', `Não lidas (${itens.filter((l) => !l.lido).length})`],
            ] as const
          ).map(([v, r]) => (
            <button
              key={v}
              type="button"
              onClick={() => setFiltro(v)}
              className={`rounded-md px-3 py-1.5 text-[0.82rem] transition-colors ${
                filtro === v ? 'bg-adm-card2 text-adm-texto' : 'text-adm-suave hover:text-adm-texto'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {erro && <Aviso texto={erro} erro />}

      {lista.length === 0 ? (
        <p className="rounded-xl border border-dashed border-adm-linha p-12 text-center text-[0.88rem] text-adm-suave">
          Nenhuma mensagem {filtro === 'nao_lidas' ? 'não lida' : 'recebida ainda'}.
        </p>
      ) : (
        <div className="space-y-3">
          {lista.map((l) => (
            <article
              key={l.id}
              className={`rounded-xl border p-5 ${l.lido ? 'border-adm-linha bg-adm-card' : 'border-adm-acento/40 bg-adm-card2'}`}
            >
              <header className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-[1rem] font-semibold">
                    {l.nome}
                    {l.empresa ? <span className="font-normal text-adm-suave"> · {l.empresa}</span> : null}
                  </h2>
                  <p className="mt-0.5 text-[0.8rem] text-adm-suave">
                    {dataBr(l.criado_em)}
                    {l.interesse ? ` · interesse: ${l.interesse}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => alternarLido(l)}
                    className="adm-btn adm-btn-linha"
                    title={l.lido ? 'Marcar como não lida' : 'Marcar como lida'}
                  >
                    {l.lido ? <MailOpen size={14} /> : <Mail size={14} />}
                    {l.lido ? 'Lida' : 'Marcar lida'}
                  </button>
                  <BotaoExcluir
                    rotulo=""
                    aviso="Excluir esta mensagem?"
                    onExcluir={async () => {
                      try {
                        await cli.del(`/api/admin/leads/${l.id}`);
                        setItens((xs) => xs.filter((x) => x.id !== l.id));
                      } catch (e) {
                        setErro(msgErro(e));
                      }
                    }}
                  />
                </div>
              </header>

              <p className="mt-3 whitespace-pre-wrap text-[0.92rem] leading-relaxed">{l.mensagem}</p>

              <footer className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 border-t border-adm-linha pt-3 text-[0.84rem]">
                <a href={`mailto:${l.email}`} className="text-adm-acento hover:underline">
                  {l.email}
                </a>
                {l.telefone && (
                  <>
                    <a href={`tel:${l.telefone.replace(/\D/g, '')}`} className="text-adm-acento hover:underline">
                      {l.telefone}
                    </a>
                    <a
                      href={`https://wa.me/${l.telefone.replace(/\D/g, '').replace(/^(?!55)/, '55')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-adm-acento hover:underline"
                    >
                      WhatsApp
                    </a>
                  </>
                )}
              </footer>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
