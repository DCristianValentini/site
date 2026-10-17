'use client';

import { useEffect, useState } from 'react';
import { Rocket, X } from 'lucide-react';
import { Aviso, Botao, Campo, EntradaSenha } from '@/components/admin/ui';

/**
 * "Publicar": pede ao GitHub para refazer o site estatico (repository_dispatch "publicar"),
 * que le o conteudo atual do banco. Precisa de um token do GitHub com permissao so de
 * Actions (escrita) neste repositorio; fica guardado no navegador de quem edita, nunca no codigo.
 */
const REPO = process.env.NEXT_PUBLIC_GITHUB_REPO || '';
const CHAVE = 'site_admin_gh_token';

function lerToken(): string {
  try {
    return localStorage.getItem(CHAVE) ?? '';
  } catch {
    return '';
  }
}

export function BotaoPublicar() {
  const [aberto, setAberto] = useState(false);
  const [token, setToken] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [msg, setMsg] = useState<{ texto: string; erro?: boolean } | null>(null);

  useEffect(() => setToken(lerToken()), []);

  async function publicar() {
    if (!REPO) {
      setMsg({ texto: 'Repositório não configurado neste build (NEXT_PUBLIC_GITHUB_REPO).', erro: true });
      return;
    }
    const t = token.trim();
    if (!t) {
      setMsg({ texto: 'Cole o token do GitHub.', erro: true });
      return;
    }
    setOcupado(true);
    setMsg(null);
    try {
      const res = await fetch(`https://api.github.com/repos/${REPO}/dispatches`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_type: 'publicar' }),
      });
      if (res.status === 204) {
        try {
          localStorage.setItem(CHAVE, t);
        } catch {
          /* sem storage: pede de novo na proxima */
        }
        setMsg({ texto: 'Publicação iniciada. O site atualiza em 1 a 2 minutos.' });
      } else if (res.status === 401 || res.status === 403 || res.status === 404) {
        try {
          localStorage.removeItem(CHAVE);
        } catch {
          /* ignora */
        }
        setMsg({ texto: 'O GitHub recusou o token. Confira se ele é do repositório certo e tem permissão de Actions (escrita).', erro: true });
      } else {
        setMsg({ texto: `O GitHub respondeu ${res.status}. Tente de novo.`, erro: true });
      }
    } catch {
      setMsg({ texto: 'Sem conexão com o GitHub.', erro: true });
    } finally {
      setOcupado(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setAberto(true)}
        className="flex items-center gap-2.5 rounded-lg bg-adm-acento px-2.5 py-2 text-[0.88rem] font-semibold text-[#08101f]"
      >
        <Rocket size={16} /> Publicar o site
      </button>

      {aberto && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={() => setAberto(false)}>
          <div
            className="w-full max-w-md space-y-4 rounded-xl border border-adm-linha bg-adm-card p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-[1.05rem] font-semibold">Publicar o site</h2>
                <p className="mt-1 text-[0.82rem] text-adm-suave">
                  As edições ficam no banco. Para o site público mostrar o que você salvou, ele precisa ser
                  refeito — leva 1 a 2 minutos. Sem clicar aqui, ele se atualiza sozinho uma vez por dia.
                </p>
              </div>
              <button onClick={() => setAberto(false)} aria-label="Fechar" className="text-adm-suave">
                <X size={18} />
              </button>
            </div>

            <Campo label="Token do GitHub">
              <EntradaSenha
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="github_pat_…"
                autoComplete="off"
              />
            </Campo>
            <p className="text-[0.76rem] text-adm-suave">
              Crie em GitHub → Settings → Developer settings → Fine-grained tokens, só para o repositório{' '}
              <span className="font-mono">{REPO || 'do site'}</span>, com <b>Contents: Read and write</b>. Fica
              guardado apenas neste navegador.
            </p>

            {msg && <Aviso texto={msg.texto} erro={msg.erro} />}
            <Botao variante="primario" carregando={ocupado} onClick={publicar} className="w-full justify-center py-2.5">
              <Rocket size={15} /> Publicar agora
            </Botao>
          </div>
        </div>
      )}
    </>
  );
}
