'use client';

import { useCallback, useEffect, useState } from 'react';
import { ImagePlus, Trash2, Upload } from 'lucide-react';
import { cli, msgErro } from '@/lib/cliente';
import type { Midia } from '@/lib/tipos';
import { Aviso, Botao, Modal } from './ui';

/**
 * Campo de imagem: mostra a atual, abre a biblioteca de midia e permite subir
 * uma nova. Guarda no conteudo apenas o CAMINHO relativo (ex.: 2026-08/ab12.webp);
 * o arquivo webp fica no disco (storage/) — nunca base64 no banco.
 */
export function SeletorImagem({
  valor,
  onChange,
}: {
  valor: string;
  onChange: (arquivo: string) => void;
}) {
  const [aberto, setAberto] = useState(false);
  return (
    <>
      <div className="flex items-center gap-3">
        {valor ? (
          <button
            type="button"
            onClick={() => setAberto(true)}
            className="h-16 w-24 shrink-0 overflow-hidden rounded-lg border border-adm-linha bg-adm-card2"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/midia/${valor}`} alt="" className="h-full w-full object-cover" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setAberto(true)}
            className="grid h-16 w-24 shrink-0 place-items-center rounded-lg border border-dashed border-adm-linha text-adm-suave hover:border-adm-acento hover:text-adm-acento"
          >
            <ImagePlus size={18} />
          </button>
        )}
        <div className="flex flex-wrap gap-2">
          <Botao onClick={() => setAberto(true)}>{valor ? 'Trocar' : 'Escolher imagem'}</Botao>
          {valor && (
            <Botao variante="perigo" onClick={() => onChange('')}>
              Remover
            </Botao>
          )}
        </div>
      </div>

      <BibliotecaMidia
        aberto={aberto}
        onFechar={() => setAberto(false)}
        onEscolher={(arquivo) => {
          onChange(arquivo);
          setAberto(false);
        }}
      />
    </>
  );
}

export function BibliotecaMidia({
  aberto,
  onFechar,
  onEscolher,
}: {
  aberto: boolean;
  onFechar: () => void;
  onEscolher?: (arquivo: string) => void;
}) {
  const [itens, setItens] = useState<Midia[]>([]);
  const [erro, setErro] = useState('');
  const [subindo, setSubindo] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const r = await cli.get<{ itens: Midia[] }>('/api/admin/midias');
      setItens(r.itens);
    } catch (e) {
      setErro(msgErro(e));
    }
  }, []);

  useEffect(() => {
    if (aberto) carregar();
  }, [aberto, carregar]);

  async function subir(files: FileList | null) {
    if (!files?.length) return;
    setErro('');
    setSubindo(true);
    try {
      for (const f of Array.from(files)) {
        const fd = new FormData();
        fd.append('arquivo', f);
        await cli.upload('/api/admin/midias', fd);
      }
      await carregar();
    } catch (e) {
      setErro(msgErro(e));
    } finally {
      setSubindo(false);
    }
  }

  return (
    <Modal aberto={aberto} onFechar={onFechar} titulo="Imagens" largura="max-w-4xl">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="adm-btn adm-btn-primario cursor-pointer">
            <Upload size={14} />
            {subindo ? 'Enviando…' : 'Enviar imagem'}
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={subindo}
              onChange={(e) => subir(e.target.files)}
            />
          </label>
          <span className="text-[0.78rem] text-adm-suave">
            Qualquer formato entra; sai webp otimizado (máx. 1920px).
          </span>
        </div>

        {erro && <Aviso texto={erro} erro />}

        {itens.length === 0 ? (
          <p className="py-10 text-center text-[0.88rem] text-adm-suave">Nenhuma imagem enviada ainda.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {itens.map((m) => (
              <div key={m.id} className="overflow-hidden rounded-lg border border-adm-linha bg-adm-card2">
                <button
                  type="button"
                  onClick={() => onEscolher?.(m.arquivo)}
                  className="block aspect-[4/3] w-full"
                  title={onEscolher ? 'Usar esta imagem' : m.nome}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/midia/${m.arquivo}`} alt={m.alt ?? ''} className="h-full w-full object-cover" />
                </button>
                <div className="flex items-center justify-between gap-2 px-2.5 py-2">
                  <span className="truncate text-[0.72rem] text-adm-suave" title={m.nome}>
                    {m.largura}×{m.altura}
                  </span>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await cli.del(`/api/admin/midias/${m.id}`);
                        await carregar();
                      } catch (e) {
                        setErro(msgErro(e));
                      }
                    }}
                    className="text-adm-suave hover:text-red-400"
                    aria-label="Excluir imagem"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
