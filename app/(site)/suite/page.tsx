import type { Metadata } from 'next';
import { PaginaCms, metadataCms } from '@/components/site/pagina-cms';

export const dynamic = 'force-static';

export async function generateMetadata(): Promise<Metadata> {
  return metadataCms('suite');
}

export default function Suite() {
  return <PaginaCms slug="suite" />;
}
