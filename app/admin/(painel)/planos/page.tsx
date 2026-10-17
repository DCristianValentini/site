'use client';

import { listarPlanos } from '@/lib/admin-dados';
import { Carregar } from '@/components/admin/carregar';
import { EditorPlanos } from '@/components/admin/editor-planos';

export default function PlanosAdmin() {
  return <Carregar buscar={listarPlanos}>{(planos) => <EditorPlanos iniciais={planos} />}</Carregar>;
}
