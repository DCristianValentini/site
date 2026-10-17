'use client';

import { listarProdutos } from '@/lib/admin-dados';
import { Carregar } from '@/components/admin/carregar';
import { EditorProdutos } from '@/components/admin/editor-produtos';

export default function ProdutosAdmin() {
  return <Carregar buscar={listarProdutos}>{(produtos) => <EditorProdutos iniciais={produtos} />}</Carregar>;
}
