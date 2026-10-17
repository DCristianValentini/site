import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NaoEncontrado() {
  return (
    <main className="grid min-h-screen place-items-center px-6 text-center">
      <div>
        <p className="etiqueta">ERRO 404</p>
        <h1 className="t-hero mt-4">Página não encontrada</h1>
        <p className="mx-auto mt-4 max-w-md" style={{ color: 'var(--sf-texto-suave)' }}>
          O endereço que você abriu não existe (ou saiu do ar). Volte para o início e siga daqui.
        </p>
        <Link href="/" className="btn btn-acento mt-8">
          <ArrowLeft size={15} /> Voltar ao início
        </Link>
      </div>
    </main>
  );
}
