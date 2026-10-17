import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, ArrowUpRight, Check } from 'lucide-react';
import { getProduto, getProdutos, urlMidia } from '@/lib/cms';
import { htmlParaTexto } from '@/lib/sanitize';

export const dynamic = 'force-static';
export const dynamicParams = false;

/** Para o build estatico (GitHub Pages): uma pagina por produto ativo. No site dinamico nao muda nada. */
export async function generateStaticParams() {
  return (await getProdutos()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProduto(slug);
  if (!p) return {};
  const desc = p.seo_descricao || p.resumo || htmlParaTexto(p.descricao, 300);
  return {
    title: p.seo_titulo || `${p.nome} — ${p.tagline ?? p.categoria ?? ''}`.trim(),
    description: desc,
    alternates: { canonical: `/produtos/${p.slug}` },
    openGraph: {
      title: p.nome,
      description: desc,
      images: urlMidia(p.imagem) ? [urlMidia(p.imagem) as string] : undefined,
    },
  };
}

export default async function ProdutoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const produto = await getProduto(slug);
  if (!produto || !produto.ativo) notFound();

  const todos = await getProdutos();
  const outros = todos.filter((p) => p.id !== produto.id);
  const cor = produto.cor || 'var(--sf-acento)';
  const imagem = urlMidia(produto.imagem);

  // agrupa os recursos preservando a ordem de cadastro
  const grupos: { nome: string; itens: typeof produto.recursos }[] = [];
  for (const r of produto.recursos ?? []) {
    const nome = r.grupo || 'Recursos';
    const atual = grupos.find((g) => g.nome === nome);
    if (atual) atual.itens!.push(r);
    else grupos.push({ nome, itens: [r] });
  }

  return (
    <>
      {/* ---------- abertura ---------- */}
      <section className="relative overflow-hidden pb-16 pt-[132px]">
        <div className="grade-fundo" aria-hidden />
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-[380px] w-[min(820px,95vw)] -translate-x-1/2 opacity-[0.15] blur-[90px]"
          style={{ background: `radial-gradient(ellipse at center, ${cor}, transparent 70%)` }}
          aria-hidden
        />
        <div className="limite relative">
          <Link
            href="/produtos"
            className="inline-flex items-center gap-2 text-[0.85rem] transition-colors hover:text-[var(--sf-texto)]"
            style={{ color: 'var(--sf-texto-suave)' }}
          >
            <ArrowLeft size={14} /> Produtos
          </Link>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <span
              className="rounded-md px-2.5 py-1.5 font-mono text-[0.7rem] font-medium tracking-[0.16em]"
              style={{ background: `${cor}22`, color: cor }}
            >
              {produto.sigla || produto.nome.slice(0, 3).toUpperCase()}
            </span>
            {produto.categoria && <span className="etiqueta">{produto.categoria}</span>}
          </div>

          <h1 className="t-hero animate-sobe mt-5 max-w-[16ch]">{produto.nome}</h1>

          {produto.tagline && (
            <p
              className="animate-sobe mt-5 max-w-2xl text-[clamp(1.1rem,2.1vw,1.5rem)] font-medium leading-snug"
              style={{ color: cor, animationDelay: '.08s' }}
            >
              {produto.tagline}
            </p>
          )}

          {produto.resumo && (
            <p
              className="animate-sobe mt-6 max-w-2xl text-[1.02rem] leading-relaxed"
              style={{ color: 'var(--sf-texto-suave)', animationDelay: '.14s' }}
            >
              {produto.resumo}
            </p>
          )}

          <div className="animate-sobe mt-9 flex flex-wrap gap-3" style={{ animationDelay: '.2s' }}>
            <Link href="/contato" className="btn btn-acento">
              Pedir demonstração <ArrowRight size={15} />
            </Link>
            <Link href="/planos" className="btn btn-linha">
              Ver planos
            </Link>
          </div>

          <dl
            className="mt-12 grid gap-px overflow-hidden border-t sm:grid-cols-3"
            style={{ borderColor: 'var(--sf-linha)', background: 'var(--sf-linha)' }}
          >
            {[
              { r: 'Plataforma', v: produto.plataformas || '—' },
              { r: 'Categoria', v: produto.categoria || '—' },
              { r: 'Recursos documentados', v: String((produto.recursos ?? []).length) },
            ].map((x) => (
              <div key={x.r} className="p-5" style={{ background: 'var(--sf-fundo)' }}>
                <dt className="etiqueta">{x.r}</dt>
                <dd className="mt-2 text-[0.98rem]">{x.v}</dd>
              </div>
            ))}
          </dl>

          {imagem && (
            <div className="card mt-12 overflow-hidden p-1.5" style={{ background: 'var(--sf-superficie-2)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imagem} alt={produto.nome} className="w-full rounded-[calc(var(--sf-raio)-6px)]" />
            </div>
          )}
        </div>
      </section>

      {/* ---------- texto de apresentacao ---------- */}
      {produto.descricao && (
        <section className="secao" style={{ background: 'var(--sf-superficie)' }}>
          <div className="limite grid gap-10 lg:grid-cols-[0.32fr_0.68fr]">
            <div>
              <div className="flex items-center gap-3">
                <span className="h-px w-8" style={{ background: cor }} />
                <span className="etiqueta">Por dentro</span>
              </div>
              <h2 className="t-h2 mt-5">O que esse sistema resolve</h2>
            </div>
            <div className="rico text-[1.02rem]" dangerouslySetInnerHTML={{ __html: produto.descricao }} />
          </div>
        </section>
      )}

      {/* ---------- recursos por grupo ---------- */}
      {grupos.length > 0 && (
        <section className="secao">
          <div className="limite">
            <div className="flex items-center gap-3">
              <span className="h-px w-8" style={{ background: cor }} />
              <span className="etiqueta">Tudo que vem dentro</span>
            </div>
            <h2 className="t-h2 mt-5 max-w-2xl">
              {(produto.recursos ?? []).length} recursos, organizados por área
            </h2>

            <div className="mt-14 space-y-14">
              {grupos.map((g) => (
                <div key={g.nome} className="grid gap-8 lg:grid-cols-[0.24fr_0.76fr]">
                  <h3 className="t-h3 lg:sticky lg:top-24 lg:self-start" style={{ color: cor }}>
                    {g.nome}
                  </h3>
                  <ul className="grid gap-x-8 gap-y-7 sm:grid-cols-2">
                    {(g.itens ?? []).map((r) => (
                      <li key={r.id} className="border-t pt-5" style={{ borderColor: 'var(--sf-linha)' }}>
                        <div className="flex items-start gap-2.5">
                          <Check size={15} className="mt-1 shrink-0" style={{ color: cor }} />
                          <div>
                            <h4 className="text-[1rem] font-semibold tracking-tight">{r.titulo}</h4>
                            {r.descricao && (
                              <p
                                className="mt-1.5 text-[0.92rem] leading-relaxed"
                                style={{ color: 'var(--sf-texto-suave)' }}
                              >
                                {r.descricao}
                              </p>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---------- outros produtos ---------- */}
      {outros.length > 0 && (
        <section className="secao" style={{ background: 'var(--sf-superficie)' }}>
          <div className="limite">
            <h2 className="t-h2">Outros sistemas</h2>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {outros.map((p) => (
                <Link
                  key={p.id}
                  href={`/produtos/${p.slug}`}
                  className="card group flex flex-col p-6 transition-transform duration-300 hover:-translate-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="rounded-md px-2 py-1 font-mono text-[0.64rem] tracking-[0.14em]"
                      style={{ background: `${p.cor || '#FF7A2F'}1f`, color: p.cor || 'var(--sf-acento)' }}
                    >
                      {p.sigla || p.nome.slice(0, 3).toUpperCase()}
                    </span>
                    <ArrowUpRight size={15} className="opacity-30 transition-opacity group-hover:opacity-100" />
                  </div>
                  <h3 className="mt-4 text-[1.05rem] font-semibold tracking-tight">{p.nome}</h3>
                  <p className="mt-1.5 text-[0.88rem]" style={{ color: 'var(--sf-texto-suave)' }}>
                    {p.categoria}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---------- fechamento ---------- */}
      <section className="secao">
        <div className="limite">
          <div
            className="px-7 py-14 text-center sm:px-14"
            style={{ borderRadius: 'var(--sf-raio)', background: cor, color: 'var(--sf-acento-texto)' }}
          >
            {/* Sem artigo: o nome vem do cadastro e nao tem genero gravado. Com "o" fixo
                sai "o Gestao de Agua", "o Comanda", "o Minha Agua". */}
            <h2 className="t-h2 mx-auto max-w-[24ch]">Quer ver {produto.nome} rodando?</h2>
            <p className="mx-auto mt-4 max-w-xl text-[1rem] opacity-75">
              A demonstração é feita por quem construiu o sistema — com o seu cenário, não com dados fictícios.
            </p>
            <Link href="/contato" className="btn btn-escuro mt-8">
              Agendar demonstração <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
