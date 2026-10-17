import { Header } from '@/components/site/header';
import { Footer } from '@/components/site/footer';
import { getConfig, getProdutos, urlMidia } from '@/lib/cms';

/** Layout do site publico (o /admin tem o seu, sem cabecalho/rodape). */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [config, produtos] = await Promise.all([getConfig(), getProdutos()]);
  return (
    <>
      <Header identidade={config.identidade} nav={config.nav} logoUrl={urlMidia(config.identidade.logo)} />
      <main>{children}</main>
      <Footer config={config} produtos={produtos} />
    </>
  );
}
