'use client';

import { listarLeads } from '@/lib/admin-dados';
import { Carregar } from '@/components/admin/carregar';
import { ListaMensagens } from '@/components/admin/lista-mensagens';

export default function MensagensAdmin() {
  return <Carregar buscar={listarLeads}>{(leads) => <ListaMensagens iniciais={leads} />}</Carregar>;
}
