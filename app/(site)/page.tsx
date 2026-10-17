import type { Metadata } from 'next';
import { PaginaCms, metadataCms } from '@/components/site/pagina-cms';

// Conteudo vem do banco: renderiza sempre fresco para a edicao no /admin
// aparecer no site na hora (o site e pequeno; o custo e um SELECT por request).
export const dynamic = 'force-static';

export async function generateMetadata(): Promise<Metadata> {
  return metadataCms('home');
}

export default function Home() {
  return <PaginaCms slug="home" />;
}
