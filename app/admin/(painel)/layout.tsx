import { GuardaPainel } from '@/components/admin/guarda-painel';

/** Guard do painel: confere a sessao no navegador (o site e estatico, sem servidor). */
export default function PainelLayout({ children }: { children: React.ReactNode }) {
  return <GuardaPainel>{children}</GuardaPainel>;
}
