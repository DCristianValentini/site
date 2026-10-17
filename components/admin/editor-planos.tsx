'use client';

import { useState } from 'react';
import { Plus, Save } from 'lucide-react';
import type { Campo } from '@/lib/blocos';
import type { Dados, Plano } from '@/lib/tipos';
import { cli, msgErro } from '@/lib/cliente';
import { Aviso, Botao, BotaoExcluir, Cartao, Entrada, Modal } from './ui';
import { CamposEditor } from './campo-editor';

const CAMPOS: Campo[] = [
  { chave: 'nome', label: 'Nome do plano', tipo: 'texto' },
  { chave: 'preco', label: 'Preço', tipo: 'texto', ajuda: 'Texto livre: "R$ 490", "Sob consulta", "A partir de R$ 300".' },
  { chave: 'periodo', label: 'Período', tipo: 'texto', ajuda: 'Ex.: por mês, por usuário/mês.' },
  { chave: 'descricao', label: 'Descrição curta', tipo: 'textarea', largo: true },
  { chave: 'cta_texto', label: 'Botão — texto', tipo: 'texto' },
  { chave: 'cta_url', label: 'Botão — link', tipo: 'texto' },
  { chave: 'observacao', label: 'Observação abaixo do botão', tipo: 'texto', largo: true },
  { chave: 'destaque', label: 'Destacar (selo "mais escolhido")', tipo: 'bool' },
  { chave: 'ativo', label: 'Ativo (aparece no site)', tipo: 'bool' },
  {
    chave: 'itens',
    label: 'O que está incluído',
    tipo: 'lista',
    itemLabel: 'Item',
    largo: true,
    ajuda: 'Desmarque "Incluído" para mostrar o item riscado (não faz parte do plano).',
    itemCampos: [
      { chave: 'texto', label: 'Texto', tipo: 'texto', largo: true },
      { chave: 'incluso', label: 'Incluído', tipo: 'bool' },
    ],
  },
];

function paraDados(p: Plano): Dados {
  return {
    nome: p.nome, preco: p.preco ?? '', periodo: p.periodo ?? '', descricao: p.descricao ?? '',
    cta_texto: p.cta_texto ?? '', cta_url: p.cta_url ?? '', observacao: p.observacao ?? '',
    destaque: !!p.destaque, ativo: !!p.ativo,
    itens: (p.itens ?? []).map((i) => ({ texto: i.texto, incluso: !!i.incluso })),
  };
}

export function EditorPlanos({ iniciais }: { iniciais: Plano[] }) {
  const [planos, setPlanos] = useState(iniciais);
  const [sel, setSel] = useState<number | null>(iniciais[0]?.id ?? null);
  const [dados, setDados] = useState<Dados>(iniciais[0] ? paraDados(iniciais[0]) : {});
  const [salvando, setSalvando] = useState(false);
  const [aviso, setAviso] = useState('');
  const [erro, setErro] = useState('');
  const [novoAberto, setNovoAberto] = useState(false);
  const [novoNome, setNovoNome] = useState('');

  const atual = planos.find((p) => p.id === sel) ?? null;

  function ok(msg: string) {
    setAviso(msg);
    setErro('');
    setTimeout(() => setAviso(''), 2500);
  }

  function selecionar(p: Plano) {
    setSel(p.id);
    setDados(paraDados(p));
  }

  async function salvar() {
    if (!atual) return;
    setSalvando(true);
    setErro('');
    try {
      await cli.put(`/api/admin/planos/${atual.id}`, dados);
      setPlanos((ps) =>
        ps.map((p) =>
          p.id === atual.id
            ? ({ ...p, ...dados, destaque: dados.destaque ? 1 : 0, ativo: dados.ativo ? 1 : 0 } as Plano)
            : p,
        ),
      );
      ok('Plano salvo.');
    } catch (e) {
      setErro(msgErro(e));
    } finally {
      setSalvando(false);
    }
  }

  async function criar() {
    if (!novoNome.trim()) return;
    try {
      const r = await cli.post<{ id: number }>('/api/admin/planos', { nome: novoNome.trim() });
      const novo: Plano = {
        id: r.id, nome: novoNome.trim(), descricao: null, preco: 'Sob consulta', periodo: 'por mês',
        observacao: null, cta_texto: null, cta_url: null, destaque: 0, ativo: 1,
        ordem: planos.length + 1, itens: [],
      };
      setPlanos((ps) => [...ps, novo]);
      selecionar(novo);
      setNovoAberto(false);
      setNovoNome('');
      ok('Plano criado.');
    } catch (e) {
      setErro(msgErro(e));
    }
  }

  async function excluir() {
    if (!atual) return;
    try {
      await cli.del(`/api/admin/planos/${atual.id}`);
      const restantes = planos.filter((p) => p.id !== atual.id);
      setPlanos(restantes);
      if (restantes[0]) selecionar(restantes[0]);
      else {
        setSel(null);
        setDados({});
      }
      ok('Plano excluído.');
    } catch (e) {
      setErro(msgErro(e));
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[1.3rem] font-semibold tracking-tight">Planos</h1>
          <p className="mt-1 text-[0.86rem] text-adm-suave">
            Aparecem no bloco "Planos" da home e na página /planos.
          </p>
        </div>
        <Botao variante="primario" onClick={() => setNovoAberto(true)}>
          <Plus size={14} /> Novo plano
        </Botao>
      </div>

      {aviso && <Aviso texto={aviso} />}
      {erro && <Aviso texto={erro} erro />}

      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
        <div className="space-y-2">
          {planos.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => selecionar(p)}
              className={`w-full rounded-xl border p-3 text-left transition-colors ${
                p.id === sel ? 'border-adm-acento bg-adm-card2' : 'border-adm-linha bg-adm-card'
              }`}
            >
              <span className="block text-[0.92rem] font-medium">
                {p.nome} {p.destaque ? '★' : ''}
              </span>
              <span className="block text-[0.76rem] text-adm-suave">
                {p.preco} {p.periodo}
              </span>
            </button>
          ))}
        </div>

        <div>
          {atual ? (
            <Cartao
              titulo={atual.nome}
              acao={
                <div className="flex flex-wrap items-center gap-2">
                  <BotaoExcluir onExcluir={excluir} aviso="Excluir este plano?" />
                  <Botao variante="primario" carregando={salvando} onClick={salvar}>
                    <Save size={14} /> Salvar
                  </Botao>
                </div>
              }
            >
              <CamposEditor campos={CAMPOS} dados={dados} onChange={setDados} />
              <div className="mt-5 flex justify-end border-t border-adm-linha pt-4">
                <Botao variante="primario" carregando={salvando} onClick={salvar}>
                  <Save size={14} /> Salvar plano
                </Botao>
              </div>
            </Cartao>
          ) : (
            <Cartao>
              <p className="py-10 text-center text-[0.88rem] text-adm-suave">Nenhum plano cadastrado.</p>
            </Cartao>
          )}
        </div>
      </div>

      <Modal aberto={novoAberto} onFechar={() => setNovoAberto(false)} titulo="Novo plano" largura="max-w-md">
        <div className="space-y-4">
          <div>
            <label className="adm-label">Nome do plano</label>
            <Entrada value={novoNome} onChange={(e) => setNovoNome(e.target.value)} placeholder="Ex.: Enterprise" />
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
