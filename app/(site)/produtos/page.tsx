import type { Metadata } from 'next';
import { PaginaCms, metadataCms } from '@/components/site/pagina-cms';

export const dynamic = 'force-static';

export async function generateMetadata(): Promise<Metadata> {
  return metadataCms('produtos');
}

export default function Produtos() {
  return <PaginaCms slug="produtos" />;
}
