'use client';

import { listarMidias } from '@/lib/admin-dados';
import { Carregar } from '@/components/admin/carregar';
import { GerenciadorImagens } from '@/components/admin/gerenciador-imagens';

export default function ImagensAdmin() {
  return <Carregar buscar={listarMidias}>{(itens) => <GerenciadorImagens iniciais={itens} />}</Carregar>;
}
