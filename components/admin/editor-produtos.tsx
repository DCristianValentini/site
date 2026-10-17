'use client';

import { useState } from 'react';
import { ExternalLink, Plus, Save } from 'lucide-react';
import type { Campo } from '@/lib/blocos';
import type { Dados, Produto } from '@/lib/tipos';
import { cli, msgErro } from '@/lib/cliente';
import { Aviso, Botao, BotaoExcluir, Cartao, Entrada, Modal } from './ui';
import { CamposEditor } from './campo-editor';

/**
 * Cadastro dos produtos (os programas). O formulario tambem e gerado por
 * descritores (mesmo motor dos blocos), incluindo a lista de recursos — que e o
 * que virou "informacoes detalhadas" na pagina do produto.
 */

const ICONES: { valor: string; label: string }[] = [
  { valor: 'layers', label: 'Camadas' },
  { valor: 'shield', label: 'Escudo' },
  { valor: 'zap', label: 'Raio' },
  { valor: 'wifi-off', label: 'Offline' },
  { valor: 'smartphone', label: 'Celular' },
  { valor: 'server', label: 'Servidor' },
  { valor: 'file-text', label: 'Documento' },
  { valor: 'users', label: 'Pessoas' },
  { valor: 'settings', label: 'Engrenagem' },
  { valor: 'trending-up', label: 'Gráfico' },
  { valor: 'lock', label: 'Cadeado' },
  { valor: 'headphones', label: 'Suporte' },
];

const CAMPOS: Campo[] = [
  { chave: 'nome', label: 'Nome do produto', tipo: 'texto' },
  { chave: 'slug', label: 'Endereço na URL', tipo: 'texto', ajuda: 'Vira /produtos/<endereço>. Mudar quebra links antigos.' },
  { chave: 'sigla', label: 'Sigla (até 8 caracteres)', tipo: 'texto', ajuda: 'Aparece no selo colorido dos cards.' },
  { chave: 'categoria', label: 'Categoria', tipo: 'texto', ajuda: 'Ex.: Gestão empresarial, Aplicativo Android.' },
  { chave: 'plataformas', label: 'Plataformas', tipo: 'texto', ajuda: 'Ex.: Web (navegador), Android (APK).' },
  { chave: 'cor', label: 'Cor do produto', tipo: 'cor', ajuda: 'Usada no selo, nos detalhes e no fechamento da página.' },
  { chave: 'tagline', label: 'Frase de efeito', tipo: 'texto', largo: true },
  { chave: 'resumo', label: 'Resumo (cards e busca)', tipo: 'textarea', largo: true },
  { chave: 'descricao', label: 'Texto de apresentação', tipo: 'rich', largo: true },
  { chave: 'imagem', label: 'Imagem ou print do produto', tipo: 'imagem', largo: true },
  { chave: 'destaque', label: 'Em destaque', tipo: 'bool' },
  { chave: 'ativo', label: 'Ativo (aparece no site)', tipo: 'bool' },
  { chave: 'seo_titulo', label: 'Título no Google', tipo: 'texto', largo: true },
  { chave: 'seo_descricao', label: 'Descrição no Google', tipo: 'textarea', largo: true },
  {
    chave: 'recursos',
    label: 'Recursos detalhados',
    tipo: 'lista',
    itemLabel: 'Recurso',
    largo: true,
    ajuda: 'Agrupados por área na página do produto, na ordem definida aqui.',
    itemCampos: [
      { chave: 'grupo', label: 'Área / grupo', tipo: 'texto' },
      { chave: 'titulo', label: 'Título', tipo: 'texto' },
      { chave: 'descricao', label: 'Descrição', tipo: 'textarea', largo: true },
      { chave: 'icone', label: 'Ícone', tipo: 'select', opcoes: ICONES },
    ],
  },
];

function paraDados(p: Produto): Dados {
  return {
    nome: p.nome, slug: p.slug, sigla: p.sigla ?? '', categoria: p.categoria ?? '',
    plataformas: p.plataformas ?? '', cor: p.cor ?? '', tagline: p.tagline ?? '',
    resumo: p.resumo ?? '', descricao: p.descricao ?? '', imagem: p.imagem ?? '',
    destaque: !!p.destaque, ativo: !!p.ativo,
    seo_titulo: p.seo_titulo ?? '', seo_descricao: p.seo_descricao ?? '',
    recursos: (p.recursos ?? []).map((r) => ({
      grupo: r.grupo ?? '', titulo: r.titulo, descricao: r.descricao ?? '', icone: r.icone ?? '',
    })),
  };
}

export function EditorProdutos({ iniciais }: { iniciais: Produto[] }) {
  const [produtos, setProdutos] = useState(iniciais);
  const [selecionado, setSelecionado] = useState<number | null>(iniciais[0]?.id ?? null);
  const [dados, setDados] = useState<Dados>(iniciais[0] ? paraDados(iniciais[0]) : {});
  const [salvando, setSalvando] = useState(false);
  const [aviso, setAviso] = useState('');
  const [erro, setErro] = useState('');
  const [novoAberto, setNovoAberto] = useState(false);
  const [novoNome, setNovoNome] = useState('');

  const atual = produtos.find((p) => p.id === selecionado) ?? null;

  function ok(msg: string) {
    setAviso(msg);
    setErro('');
    setTimeout(() => setAviso(''), 2500);
  }

  function selecionar(p: Produto) {
    setSelecionado(p.id);
    setDados(paraDados(p));
    setErro('');
  }

  async function salvar() {
    if (!atual) return;
    setSalvando(true);
    setErro('');
    try {
      await cli.put(`/api/admin/produtos/${atual.id}`, dados);
      setProdutos((ps) =>
        ps.map((p) =>
          p.id === atual.id
            ? ({ ...p, ...dados, destaque: dados.destaque ? 1 : 0, ativo: dados.ativo ? 1 : 0 } as Produto)
            : p,
        ),
      );
      ok('Produto salvo.');
    } catch (e) {
      setErro(msgErro(e));
    } finally {
      setSalvando(false);
    }
  }

  async function criar() {
    if (!novoNome.trim()) return;
    try {
      const r = await cli.post<{ id: number; slug: string }>('/api/admin/produtos', { nome: novoNome.trim() });
      const novo: Produto = {
        id: r.id, slug: r.slug, nome: novoNome.trim(), sigla: null, categoria: null, tagline: null,
        resumo: null, descricao: null, cor: null, imagem: null, plataformas: null,
        destaque: 0, ativo: 1, ordem: produtos.length + 1, seo_titulo: null, seo_descricao: null,
        recursos: [],
      };
      setProdutos((ps) => [...ps, novo]);
      selecionar(novo);
      setNovoAberto(false);
      setNovoNome('');
      ok('Produto criado. Preencha os dados e salve.');
    } catch (e) {
      setErro(msgErro(e));
    }
  }

  async function excluir() {
    if (!atual) return;
    try {
      await cli.del(`/api/admin/produtos/${atual.id}`);
      const restantes = produtos.filter((p) => p.id !== atual.id);
      setProdutos(restantes);
      if (restantes[0]) selecionar(restantes[0]);
      else {
        setSelecionado(null);
        setDados({});
      }
      ok('Produto excluído.');
    } catch (e) {
      setErro(msgErro(e));
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[1.3rem] font-semibold tracking-tight">Produtos</h1>
          <p className="mt-1 text-[0.86rem] text-adm-suave">
            Os programas que aparecem no site. Cada um tem sua página com os recursos detalhados.
          </p>
        </div>
        <Botao variante="primario" onClick={() => setNovoAberto(true)}>
          <Plus size={14} /> Novo produto
        </Botao>
      </div>

      {aviso && <Aviso texto={aviso} />}
      {erro && <Aviso texto={erro} erro />}

      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <div className="space-y-2">
          {produtos.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => selecionar(p)}
              className={`flex w-full items-center gap-2.5 rounded-xl border p-3 text-left transition-colors ${
                p.id === selecionado ? 'border-adm-acento bg-adm-card2' : 'border-adm-linha bg-adm-card'
              }`}
            >
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: p.cor || '#5b8cff' }} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[0.9rem] font-medium">{p.nome}</span>
                <span className="block truncate font-mono text-[0.72rem] text-adm-suave">/{p.slug}</span>
              </span>
              {!p.ativo && <span className="text-[0.62rem] uppercase tracking-wider text-adm-suave">off</span>}
            </button>
          ))}
        </div>

        <div>
          {atual ? (
            <Cartao
              titulo={atual.nome}
              acao={
                <div className="flex flex-wrap items-center gap-2">
                  <a href={`/produtos/${atual.slug}`} target="_blank" rel="noreferrer" className="adm-btn adm-btn-linha">
                    <ExternalLink size={14} /> Ver
                  </a>
                  <BotaoExcluir onExcluir={excluir} aviso="Excluir o produto e seus recursos?" />
                  <Botao variante="primario" carregando={salvando} onClick={salvar}>
                    <Save size={14} /> Salvar
                  </Botao>
                </div>
              }
            >
              <CamposEditor campos={CAMPOS} dados={dados} onChange={setDados} />
              <div className="mt-5 flex justify-end border-t border-adm-linha pt-4">
                <Botao variante="primario" carregando={salvando} onClick={salvar}>
                  <Save size={14} /> Salvar produto
                </Botao>
              </div>
            </Cartao>
          ) : (
            <Cartao>
              <p className="py-10 text-center text-[0.88rem] text-adm-suave">
                Nenhum produto selecionado.
              </p>
            </Cartao>
          )}
        </div>
      </div>

      <Modal aberto={novoAberto} onFechar={() => setNovoAberto(false)} titulo="Novo produto" largura="max-w-md">
        <div className="space-y-4">
          <div>
            <label className="adm-label">Nome do produto</label>
            <Entrada value={novoNome} onChange={(e) => setNovoNome(e.target.value)} placeholder="Ex.: Ponto Eletrônico" />
            <p className="mt-1 text-[0.72rem] text-adm-suave">
              O endereço na URL é gerado a partir do nome e pode ser ajustado depois.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Botao onClick={() => setNovoAberto(false)}>Cancelar</Botao>
            <Botao variante="primario" onClick={criar}>
              Criar
            </Botao>
          </div>
        </div>
      </Modal>
    </div>
  );
}
