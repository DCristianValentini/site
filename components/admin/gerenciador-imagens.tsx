'use client';

import { useState } from 'react';
import { Copy, Trash2, Upload } from 'lucide-react';
import { cli, msgErro } from '@/lib/cliente';
import type { Midia } from '@/lib/tipos';
import { Aviso, Entrada } from './ui';

/** Biblioteca de imagens do site (webp no disco; o banco guarda o caminho). */
export function GerenciadorImagens({ iniciais }: { iniciais: Midia[] }) {
  const [itens, setItens] = useState(iniciais);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [subindo, setSubindo] = useState(false);

  function ok(msg: string) {
    setAviso(msg);
    setErro('');
    setTimeout(() => setAviso(''), 2500);
  }

  async function subir(files: FileList | null) {
    if (!files?.length) return;
    setSubindo(true);
    setErro('');
    try {
      const novos: Midia[] = [];
      for (const f of Array.from(files)) {
        const fd = new FormData();
        fd.append('arquivo', f);
        const r = await cli.upload<{ id: number; arquivo: string; largura: number; altura: number; bytes: number }>(
          '/api/admin/midias',
          fd,
        );
        novos.push({
          id: r.id, arquivo: r.arquivo, nome: f.name, alt: null,
          largura: r.largura, altura: r.altura, bytes: r.bytes, criado_em: '',
        });
      }
      setItens((xs) => [...novos, ...xs]);
      ok(`${novos.length} imagem(ns) enviada(s).`);
    } catch (e) {
      setErro(msgErro(e));
    } finally {
      setSubindo(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[1.3rem] font-semibold tracking-tight">Imagens</h1>
          <p className="mt-1 text-[0.86rem] text-adm-suave">
            Envie aqui e depois use nos blocos, produtos e no logo. Tudo é convertido para webp
            (máx. 1920px) e gravado em disco.
          </p>
        </div>
        <label className="adm-btn adm-btn-primario cursor-pointer">
          <Upload size={14} />
          {subindo ? 'Enviando…' : 'Enviar imagens'}
          <input type="file" accept="image/*" multiple className="hidden" disabled={subindo} onChange={(e) => subir(e.target.files)} />
        </label>
      </div>

      {aviso && <Aviso texto={aviso} />}
      {erro && <Aviso texto={erro} erro />}

      {itens.length === 0 ? (
        <p className="rounded-xl border border-dashed border-adm-linha p-12 text-center text-[0.88rem] text-adm-suave">
          Nenhuma imagem ainda.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {itens.map((m) => (
            <div key={m.id} className="overflow-hidden rounded-xl border border-adm-linha bg-adm-card">
              <div className="aspect-[4/3] bg-adm-card2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/midia/${m.arquivo}`} alt={m.alt ?? ''} className="h-full w-full object-cover" />
              </div>
              <div className="space-y-2 p-3">
                <p className="truncate text-[0.78rem] text-adm-suave" title={m.nome}>
                  {m.largura}×{m.altura} · {Math.round((m.bytes ?? 0) / 1024)} KB
                </p>
                <Entrada
                  placeholder="Texto alternativo (acessibilidade e SEO)"
                  defaultValue={m.alt ?? ''}
                  onBlur={async (e) => {
                    try {
                      await cli.patch(`/api/admin/midias/${m.id}`, { alt: e.target.value });
                      ok('Texto alternativo salvo.');
                    } catch (err) {
                      setErro(msgErro(err));
                    }
                  }}
                />
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(m.arquivo);
                      ok('Caminho copiado.');
                    }}
                    className="flex items-center gap-1.5 text-[0.76rem] text-adm-suave hover:text-adm-texto"
                  >
                    <Copy size={13} /> copiar caminho
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await cli.del(`/api/admin/midias/${m.id}`);
                        setItens((xs) => xs.filter((x) => x.id !== m.id));
                        ok('Imagem excluída.');
                      } catch (err) {
                        setErro(msgErro(err));
                      }
                    }}
                    className="text-adm-suave hover:text-red-400"
                    aria-label="Excluir"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
