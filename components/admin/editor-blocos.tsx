'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Eye, EyeOff, ExternalLink, Plus, Save, Trash2 } from 'lucide-react';
import { TIPOS_BLOCO, tipoBloco } from '@/lib/blocos';
import type { Bloco, Dados, Pagina } from '@/lib/tipos';
import { cli, msgErro } from '@/lib/cliente';
import { Alternar, Aviso, Botao, Campo, Cartao, Entrada, AreaTexto, Modal } from './ui';
import { CamposEditor } from './campo-editor';
import { SeletorImagem } from './seletor-imagem';

/**
 * Editor da pagina: lista de blocos a esquerda (reordenar / mostrar / excluir) e
 * o formulario do bloco selecionado a direita, gerado pelo schema do tipo.
 */
export function EditorBlocos({ pagina, blocosIniciais }: { pagina: Pagina; blocosIniciais: Bloco[] }) {
  const [blocos, setBlocos] = useState<Bloco[]>(blocosIniciais);
  const [selecionado, setSelecionado] = useState<number | null>(blocosIniciais[0]?.id ?? null);
  const [aviso, setAviso] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [addAberto, setAddAberto] = useState(false);
  const [seoAberto, setSeoAberto] = useState(false);

  const atual = blocos.find((b) => b.id === selecionado) ?? null;
  const urlPublica = pagina.slug === 'home' ? '/' : `/${pagina.slug}`;

  function feedback(msg: string) {
    setAviso(msg);
    setErro('');
    setTimeout(() => setAviso(''), 2500);
  }

  async function salvarBloco() {
    if (!atual) return;
    setSalvando(true);
    setErro('');
    try {
      await cli.put(`/api/admin/blocos/${atual.id}`, { dados: atual.dados, visivel: atual.visivel });
      feedback('Bloco salvo. Recarregue o site para ver.');
    } catch (e) {
      setErro(msgErro(e));
    } finally {
      setSalvando(false);
    }
  }

  async function trocarVisivel(bl: Bloco) {
    const novo = bl.visivel ? 0 : 1;
    setBlocos((bs) => bs.map((b) => (b.id === bl.id ? { ...b, visivel: novo } : b)));
    try {
      await cli.put(`/api/admin/blocos/${bl.id}`, { dados: bl.dados, visivel: novo });
      feedback(novo ? 'Bloco visível no site.' : 'Bloco oculto do site.');
    } catch (e) {
      setErro(msgErro(e));
    }
  }

  async function mover(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= blocos.length) return;
    const copia = [...blocos];
    [copia[i], copia[j]] = [copia[j], copia[i]];
    setBlocos(copia);
    try {
      await cli.patch('/api/admin/blocos', { ids: copia.map((b) => b.id) });
      feedback('Ordem atualizada.');
    } catch (e) {
      setErro(msgErro(e));
    }
  }

  async function excluir(bl: Bloco) {
    try {
      await cli.del(`/api/admin/blocos/${bl.id}`);
      const restantes = blocos.filter((b) => b.id !== bl.id);
      setBlocos(restantes);
      if (selecionado === bl.id) setSelecionado(restantes[0]?.id ?? null);
      feedback('Bloco excluído.');
    } catch (e) {
      setErro(msgErro(e));
    }
  }

  async function adicionar(tipo: string) {
    try {
      const r = await cli.post<{ id: number }>('/api/admin/blocos', { pagina_id: pagina.id, tipo });
      const t = tipoBloco(tipo);
      const novo: Bloco = {
        id: r.id,
        pagina_id: pagina.id,
        tipo,
        dados: { ...(t?.padroes ?? {}) } as Dados,
        ordem: blocos.length + 1,
        visivel: 1,
      };
      setBlocos((bs) => [...bs, novo]);
      setSelecionado(r.id);
      setAddAberto(false);
      feedback('Bloco adicionado no fim da página.');
    } catch (e) {
      setErro(msgErro(e));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[1.3rem] font-semibold tracking-tight">{pagina.titulo}</h1>
          <p className="text-[0.82rem] text-adm-suave">
            {urlPublica} · {blocos.length} bloco(s)
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Botao onClick={() => setSeoAberto(true)}>Título e SEO</Botao>
          <a href={urlPublica} target="_blank" rel="noreferrer" className="adm-btn adm-btn-linha">
            <ExternalLink size={14} /> Ver página
          </a>
          <Botao variante="primario" onClick={() => setAddAberto(true)}>
            <Plus size={14} /> Adicionar bloco
          </Botao>
        </div>
      </div>

      {aviso && <Aviso texto={aviso} />}
      {erro && <Aviso texto={erro} erro />}

      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        {/* ------- lista de blocos ------- */}
        <div className="space-y-2">
          {blocos.map((b, i) => {
            const t = tipoBloco(b.tipo);
            const ativo = b.id === selecionado;
            return (
              <div
                key={b.id}
                className={`rounded-xl border p-3 transition-colors ${
                  ativo ? 'border-adm-acento bg-adm-card2' : 'border-adm-linha bg-adm-card'
                }`}
              >
                <button type="button" onClick={() => setSelecionado(b.id)} className="block w-full text-left">
                  <span className="flex items-center gap-2">
                    <span className="font-mono text-[0.7rem] text-adm-suave">{String(i + 1).padStart(2, '0')}</span>
                    <span className="text-[0.9rem] font-medium">{t?.nome ?? b.tipo}</span>
                    {!b.visivel && (
                      <span className="rounded bg-adm-card px-1.5 py-0.5 text-[0.62rem] uppercase tracking-wider text-adm-suave">
                        oculto
                      </span>
                    )}
                  </span>
                  <span className="mt-1 block truncate text-[0.76rem] text-adm-suave">
                    {String(b.dados?.titulo || b.dados?.eyebrow || t?.descricao || '')}
                  </span>
                </button>
                <div className="mt-2.5 flex items-center gap-1 border-t border-adm-linha pt-2">
                  <button
                    type="button"
                    onClick={() => mover(i, -1)}
                    disabled={i === 0}
                    className="rounded p-1 text-adm-suave hover:bg-adm-card disabled:opacity-30"
                    aria-label="Subir"
                  >
                    <ChevronUp size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => mover(i, 1)}
                    disabled={i === blocos.length - 1}
                    className="rounded p-1 text-adm-suave hover:bg-adm-card disabled:opacity-30"
                    aria-label="Descer"
                  >
                    <ChevronDown size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => trocarVisivel(b)}
                    className="rounded p-1 text-adm-suave hover:bg-adm-card"
                    aria-label={b.visivel ? 'Ocultar do site' : 'Mostrar no site'}
                    title={b.visivel ? 'Ocultar do site' : 'Mostrar no site'}
                  >
                    {b.visivel ? <Eye size={15} /> : <EyeOff size={15} />}
                  </button>
                  <span className="flex-1" />
                  <button
                    type="button"
                    onClick={() => excluir(b)}
                    className="rounded p-1 text-adm-suave hover:bg-adm-card hover:text-red-400"
                    aria-label="Excluir bloco"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
          {blocos.length === 0 && (
            <p className="rounded-xl border border-dashed border-adm-linha p-6 text-center text-[0.85rem] text-adm-suave">
              Esta página está vazia. Adicione um bloco.
            </p>
          )}
        </div>

        {/* ------- formulario do bloco ------- */}
        <div>
          {atual ? (
            <Cartao
              titulo={tipoBloco(atual.tipo)?.nome ?? atual.tipo}
              acao={
                <div className="flex items-center gap-3">
                  <Alternar
                    valor={!!atual.visivel}
                    label="Visível"
                    onChange={(v) => setBlocos((bs) => bs.map((b) => (b.id === atual.id ? { ...b, visivel: v ? 1 : 0 } : b)))}
                  />
                  <Botao variante="primario" carregando={salvando} onClick={salvarBloco}>
                    <Save size={14} /> Salvar
                  </Botao>
                </div>
              }
            >
              <p className="mb-4 text-[0.8rem] text-adm-suave">{tipoBloco(atual.tipo)?.descricao}</p>
              <CamposEditor
                campos={tipoBloco(atual.tipo)?.campos ?? []}
                dados={atual.dados ?? {}}
                onChange={(d) => setBlocos((bs) => bs.map((b) => (b.id === atual.id ? { ...b, dados: d } : b)))}
              />
              <div className="mt-5 flex justify-end border-t border-adm-linha pt-4">
                <Botao variante="primario" carregando={salvando} onClick={salvarBloco}>
                  <Save size={14} /> Salvar bloco
                </Botao>
              </div>
            </Cartao>
          ) : (
            <Cartao>
              <p className="py-10 text-center text-[0.88rem] text-adm-suave">
                Selecione um bloco à esquerda para editar.
              </p>
            </Cartao>
          )}
        </div>
      </div>

      {/* ------- modal: adicionar bloco ------- */}
      <Modal aberto={addAberto} onFechar={() => setAddAberto(false)} titulo="Adicionar bloco" largura="max-w-3xl">
        <div className="grid gap-3 sm:grid-cols-2">
          {TIPOS_BLOCO.map((t) => (
            <button
              key={t.tipo}
              type="button"
              onClick={() => adicionar(t.tipo)}
              className="rounded-xl border border-adm-linha bg-adm-card2/60 p-4 text-left transition-colors hover:border-adm-acento"
            >
              <span className="block text-[0.92rem] font-semibold">{t.nome}</span>
              <span className="mt-1 block text-[0.78rem] leading-snug text-adm-suave">{t.descricao}</span>
            </button>
          ))}
        </div>
      </Modal>

      {/* ------- modal: SEO da pagina ------- */}
      <SeoModal aberto={seoAberto} onFechar={() => setSeoAberto(false)} pagina={pagina} onSalvo={() => feedback('Página atualizada.')} />
    </div>
  );
}

function SeoModal({
  aberto,
  onFechar,
  pagina,
  onSalvo,
}: {
  aberto: boolean;
  onFechar: () => void;
  pagina: Pagina;
  onSalvo: () => void;
}) {
  const [f, setF] = useState({
    titulo: pagina.titulo,
    seo_titulo: pagina.seo_titulo ?? '',
    seo_descricao: pagina.seo_descricao ?? '',
    seo_imagem: pagina.seo_imagem ?? '',
    publicada: !!pagina.publicada,
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  async function salvar() {
    setSalvando(true);
    setErro('');
    try {
      await cli.put(`/api/admin/paginas/${pagina.id}`, f);
      onSalvo();
      onFechar();
    } catch (e) {
      setErro(msgErro(e));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal aberto={aberto} onFechar={onFechar} titulo={`Título e SEO — ${pagina.titulo}`}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo label="Nome da página (uso interno e menus)">
          <Entrada value={f.titulo} onChange={(e) => setF({ ...f, titulo: e.target.value })} />
        </Campo>
        <Campo label="Publicada">
          <Alternar
            valor={f.publicada}
            label={f.publicada ? 'Visível no site' : 'Fora do ar (404)'}
            onChange={(v) => setF({ ...f, publicada: v })}
          />
        </Campo>
        <Campo
          label="Título no Google (SEO)"
          ajuda="Até ~60 caracteres. Em branco, usa o nome da página."
          largo
        >
          <Entrada value={f.seo_titulo} onChange={(e) => setF({ ...f, seo_titulo: e.target.value })} />
        </Campo>
        <Campo label="Descrição no Google" ajuda="Até ~155 caracteres — é o texto cinza do resultado de busca." largo>
          <AreaTexto rows={3} value={f.seo_descricao} onChange={(e) => setF({ ...f, seo_descricao: e.target.value })} />
        </Campo>
        <Campo label="Imagem de compartilhamento" ajuda="Aparece ao colar o link no WhatsApp, LinkedIn etc." largo>
          <SeletorImagem valor={f.seo_imagem} onChange={(v) => setF({ ...f, seo_imagem: v })} />
        </Campo>
      </div>
      {erro && (
        <div className="mt-4">
          <Aviso texto={erro} erro />
        </div>
      )}
      <div className="mt-5 flex justify-end gap-2 border-t border-adm-linha pt-4">
        <Botao onClick={onFechar}>Cancelar</Botao>
        <Botao variante="primario" carregando={salvando} onClick={salvar}>
          <Save size={14} /> Salvar
        </Botao>
      </div>
    </Modal>
  );
}
