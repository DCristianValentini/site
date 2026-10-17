'use client';

import { configAdmin } from '@/lib/admin-dados';
import { Carregar } from '@/components/admin/carregar';
import { EditorIdentidade } from '@/components/admin/editor-identidade';

export default function IdentidadeAdmin() {
  return <Carregar buscar={configAdmin}>{(config) => <EditorIdentidade inicial={config} />}</Carregar>;
}
