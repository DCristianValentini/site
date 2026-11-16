'use client';

import { listarPlanos, listarProdutos } from '@/lib/admin-dados';
import { Carregar } from '@/components/admin/carregar';
import { EditorPlanos } from '@/components/admin/editor-planos';

// planos e a lista de produtos (para o campo "Produto" de cada plano) vem juntos
const buscar = async () => {
  const [planos, produtos] = await Promise.all([listarPlanos(), listarProdutos()]);
  return { planos, produtos: produtos.map((p) => ({ slug: p.slug, nome: p.nome, ativo: p.ativo })) };
};

export default function PlanosAdmin() {
  return <Carregar buscar={buscar}>{({ planos, produtos }) => <EditorPlanos iniciais={planos} produtos={produtos} />}</Carregar>;
}
