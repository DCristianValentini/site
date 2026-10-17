'use client';

import { temaAdmin } from '@/lib/admin-dados';
import { Carregar } from '@/components/admin/carregar';
import { EditorTema } from '@/components/admin/editor-tema';

export default function TemaAdmin() {
  return <Carregar buscar={temaAdmin}>{(tema) => <EditorTema inicial={tema} />}</Carregar>;
}
