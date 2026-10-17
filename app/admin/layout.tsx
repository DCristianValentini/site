import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Painel do site',
  robots: { index: false, follow: false },
};

/**
 * Casca do /admin. O guard de sessao fica no layout do grupo (painel)/ para que
 * /admin/login continue acessivel sem sessao.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-adm-bg font-corpo text-adm-texto" style={{ colorScheme: 'dark' }}>
      {children}
    </div>
  );
}
