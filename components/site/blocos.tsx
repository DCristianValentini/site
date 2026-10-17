import Link from 'next/link';
import {
  ArrowRight, ArrowUpRight, Check, Minus, Layers, Shield, Zap, WifiOff, Smartphone, Server,
  FileText, Users, Settings, TrendingUp, Lock, Headphones, Quote, Mail, Phone, MapPin, Clock,
  MessageCircle,
} from 'lucide-react';
import type { Bloco, ConfigSite, Dados, Plano, Produto } from '@/lib/tipos';
import { urlMidia } from '@/lib/cms';
import { FormContato } from './form-contato';
import { GaleriaTelas } from './galeria-telas';

/**
 * Renderizador dos blocos do CMS. O mapa `RENDER` liga o `tipo` gravado no banco
 * ao componente — os campos disponiveis em cada tipo estao em lib/blocos.ts
 * (mesma fonte que monta o formulario do /admin).
 */

const ICONES: Record<string, typeof Layers> = {
  layers: Layers, shield: Shield, zap: Zap, 'wifi-off': WifiOff, smartphone: Smartphone,
  server: Server, 'file-text': FileText, users: Users, settings: Settings,
  'trending-up': TrendingUp, lock: Lock, headphones: Headphones,
};

// ---------- helpers ----------

const s = (d: Dados, k: string): string => (typeof d[k] === 'string' ? (d[k] as string) : '');
const b = (d: Dados, k: string): boolean => d[k] === true || d[k] === 1 || d[k] === '1';
const n = (d: Dados, k: string): number => Number(d[k] ?? 0) || 0;
const lista = (d: Dados, k: string): Dados[] => (Array.isArray(d[k]) ? (d[k] as Dados[]) : []);

/** "texto com [[destaque]]" -> destaque na cor de acento. */
function comDestaque(texto: string) {
  const partes = String(texto).split(/\[\[(.+?)\]\]/g);
  return partes.map((p, i) =>
    i % 2 === 1 ? (
      <span key={i} style={{ color: 'var(--sf-acento)' }}>
        {p}
      </span>
    ) : (
      <span key={i}>{p}</span>
    ),
  );
}

function Rico({ html, className = '' }: { html: string; className?: string }) {
  if (!html) return null;
  return <div className={`rico ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
}

function CabecalhoSecao({
  eyebrow,
  titulo,
  subtitulo,
  centro = false,
}: {
  eyebrow?: string;
  titulo?: string;
  subtitulo?: string;
  centro?: boolean;
}) {
  if (!eyebrow && !titulo && !subtitulo) return null;
  return (
    <div className={`max-w-2xl ${centro ? 'mx-auto text-center' : ''}`}>
      {eyebrow && (
        <div className={`flex items-center gap-3 ${centro ? 'justify-center' : ''}`}>
          <span className="h-px w-8" style={{ background: 'var(--sf-acento)' }} />
          <span className="etiqueta">{eyebrow}</span>
        </div>
      )}
      {titulo && <h2 className="t-h2 mt-5">{comDestaque(titulo)}</h2>}
      {subtitulo && (
        <p className="mt-4 text-[1.02rem] leading-relaxed" style={{ color: 'var(--sf-texto-suave)' }}>
          {subtitulo}
        </p>
      )}
    </div>
  );
}

function Botoes({ d }: { d: Dados }) {
  const t1 = s(d, 'cta1_texto');
  const t2 = s(d, 'cta2_texto');
  if (!t1 && !t2) return null;
  return (
    <div className="mt-9 flex flex-wrap gap-3">
      {t1 && (
        <Link href={s(d, 'cta1_url') || '/contato'} className="btn btn-acento">
          {t1} <ArrowRight size={15} />
        </Link>
      )}
      {t2 && (
        <Link href={s(d, 'cta2_url') || '/produtos'} className="btn btn-linha">
          {t2}
        </Link>
      )}
    </div>
  );
}

// ---------- blocos ----------

function Hero({ d, primeiro }: { d: Dados; primeiro: boolean }) {
  const img = urlMidia(s(d, 'imagem'));
  const selos = lista(d, 'selos');
  return (
    <section className={`relative overflow-hidden ${primeiro ? 'pt-[132px]' : 'pt-24'} pb-16 sm:pb-24`}>
      <div className="grade-fundo" aria-hidden />
      {/* brilho difuso atras do titulo */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[min(900px,95vw)] -translate-x-1/2 opacity-[0.16] blur-[90px]"
        style={{ background: 'radial-gradient(ellipse at center, var(--sf-acento), transparent 70%)' }}
        aria-hidden
      />
      <div className="limite relative">
        {s(d, 'eyebrow') && (
          <div className="animate-surge flex items-center gap-3">
            <span className="h-px w-10" style={{ background: 'var(--sf-acento)' }} />
            <span className="etiqueta">{s(d, 'eyebrow')}</span>
          </div>
        )}
        <h1 className="t-hero animate-sobe mt-6 max-w-[17ch]" style={{ animationDelay: '.06s' }}>
          {comDestaque(s(d, 'titulo'))}
        </h1>
        <div className="animate-sobe mt-7 max-w-xl text-[1.06rem]" style={{ animationDelay: '.14s' }}>
          <Rico html={s(d, 'subtitulo')} />
        </div>
        <div className="animate-sobe" style={{ animationDelay: '.22s' }}>
          <Botoes d={d} />
        </div>

        {selos.length > 0 && (
          <ul
            className="animate-sobe mt-12 flex flex-wrap gap-x-7 gap-y-3 border-t pt-6"
            style={{ borderColor: 'var(--sf-linha)', animationDelay: '.3s' }}
          >
            {selos.map((sl, i) => (
              <li key={i} className="flex items-center gap-2 text-[0.86rem]" style={{ color: 'var(--sf-texto-suave)' }}>
                <Check size={14} style={{ color: 'var(--sf-acento-2)' }} />
                {s(sl, 'texto')}
              </li>
            ))}
          </ul>
        )}

        {img && (
          <div
            className="animate-sobe card mt-14 overflow-hidden p-1.5"
            style={{ animationDelay: '.38s', background: 'var(--sf-superficie-2)' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img} alt="" className="w-full rounded-[calc(var(--sf-raio)-6px)]" />
          </div>
        )}
      </div>
    </section>
  );
}

function ListaProdutos({ lst, cards }: { lst: Produto[]; cards: boolean }) {
  return cards ? (
      <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {lst.map((p) => (
          <Link
            key={p.id}
            href={`/produtos/${p.slug}`}
            className="card group relative flex flex-col overflow-hidden p-7 transition-transform duration-300 hover:-translate-y-1"
          >
            <span
              className="absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100"
              style={{ background: p.cor || 'var(--sf-acento)' }}
            />
            <div className="flex items-center justify-between">
              <span
                className="rounded-md px-2 py-1 font-mono text-[0.66rem] font-medium tracking-[0.14em]"
                style={{ background: `${p.cor || '#FF7A2F'}1f`, color: p.cor || 'var(--sf-acento)' }}
              >
                {p.sigla || p.nome.slice(0, 3).toUpperCase()}
              </span>
              <ArrowUpRight
                size={17}
                className="opacity-30 transition-all group-hover:translate-x-0.5 group-hover:opacity-100"
              />
            </div>
            <h3 className="t-h3 mt-5">{p.nome}</h3>
            {p.tagline && (
              <p className="mt-2 text-[0.95rem] font-medium" style={{ color: p.cor || 'var(--sf-acento)' }}>
                {p.tagline}
              </p>
            )}
            {p.resumo && (
              <p className="mt-3 flex-1 text-[0.92rem] leading-relaxed" style={{ color: 'var(--sf-texto-suave)' }}>
                {p.resumo}
              </p>
            )}
            <div
              className="mt-6 flex items-center justify-between border-t pt-4 text-[0.78rem]"
              style={{ borderColor: 'var(--sf-linha)', color: 'var(--sf-texto-suave)' }}
            >
              <span>{p.categoria}</span>
              <span className="font-mono">{p.plataformas}</span>
            </div>
          </Link>
        ))}
      </div>
  ) : (
      <ul className="mt-12">
        {lst.map((p, i) => (
          <li key={p.id}>
            <Link
              href={`/produtos/${p.slug}`}
              className="group grid grid-cols-[auto_1fr_auto] items-center gap-x-5 gap-y-2 border-t py-7 transition-colors sm:grid-cols-[auto_minmax(0,20ch)_1fr_auto] sm:gap-x-8"
              style={{ borderColor: 'var(--sf-linha)' }}
            >
              <span
                className="font-mono text-[0.8rem] tabular-nums transition-colors"
                style={{ color: 'var(--sf-texto-suave)' }}
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="t-h3 col-start-2 transition-transform duration-300 group-hover:translate-x-1">
                {p.nome}
              </span>
              <span
                className="col-span-2 col-start-2 text-[0.92rem] sm:col-span-1 sm:col-start-3"
                style={{ color: 'var(--sf-texto-suave)' }}
              >
                {p.tagline || p.categoria}
              </span>
              <span
                className="col-start-3 row-start-1 flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-300 sm:col-start-4"
                style={{ borderColor: 'var(--sf-linha)' }}
              >
                <ArrowUpRight
                  size={16}
                  className="transition-transform duration-300 group-hover:rotate-45"
                  style={{ color: p.cor || 'var(--sf-acento)' }}
                />
              </span>
            </Link>
          </li>
        ))}
      </ul>
  );
}

function BlocoProdutos({ d, produtos }: { d: Dados; produtos: Produto[] }) {
  let lst = produtos;
  const linha = s(d, 'linha').trim();
  if (linha) lst = lst.filter((p) => p.linha === linha);
  if (b(d, 'so_destaques')) lst = lst.filter((p) => p.destaque);
  const lim = n(d, 'limite');
  if (lim > 0) lst = lst.slice(0, lim);
  if (!lst.length) return null;

  const cards = s(d, 'estilo') === 'cards';
  const agrupar = b(d, 'agrupar');
  // grupos na ordem em que aparecem: linha e, dentro dela, area (so a suite tem area)
  const grupos: { linha: string; areas: { area: string; itens: Produto[] }[] }[] = [];
  if (agrupar) {
    for (const p of lst) {
      const nl = p.linha ?? '';
      const na = p.area ?? '';
      let g = grupos.find((x) => x.linha === nl);
      if (!g) grupos.push((g = { linha: nl, areas: [] }));
      let ar = g.areas.find((x) => x.area === na);
      if (!ar) g.areas.push((ar = { area: na, itens: [] }));
      ar.itens.push(p);
    }
  }

  return (
    <section className="secao">
      <div className="limite">
        <CabecalhoSecao eyebrow={s(d, 'eyebrow')} titulo={s(d, 'titulo')} subtitulo={s(d, 'subtitulo')} />

        {agrupar ? (
          <div className="mt-12 space-y-16">
            {grupos.map((g) => (
              <div key={g.linha}>
                {g.linha && <h3 className="t-h2">{g.linha}</h3>}
                {g.areas.map((ar) => (
                  <div key={ar.area} className="mt-8">
                    {ar.area && (
                      <h4 className="etiqueta mb-2" style={{ color: 'var(--sf-texto-suave)' }}>
                        {ar.area}
                      </h4>
                    )}
                    <ListaProdutos lst={ar.itens} cards={cards} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <ListaProdutos lst={lst} cards={cards} />
        )}
      </div>
    </section>
  );
}

function Recursos({ d }: { d: Dados }) {
  const itens = lista(d, 'itens');
  if (!itens.length) return null;
  const cols = s(d, 'colunas') || '3';
  const grid =
    cols === '2' ? 'sm:grid-cols-2' : cols === '4' ? 'sm:grid-cols-2 xl:grid-cols-4' : 'sm:grid-cols-2 lg:grid-cols-3';
  return (
    <section className="secao" style={{ background: 'var(--sf-superficie)' }}>
      <div className="limite">
        <CabecalhoSecao eyebrow={s(d, 'eyebrow')} titulo={s(d, 'titulo')} subtitulo={s(d, 'subtitulo')} />
        <div className={`mt-12 grid gap-x-8 gap-y-10 ${grid}`}>
          {itens.map((it, i) => {
            const Icone = ICONES[s(it, 'icone')] ?? Layers;
            return (
              <div key={i} className="group">
                <span
                  className="grid h-11 w-11 place-items-center rounded-[10px] border transition-colors group-hover:border-[var(--sf-acento)]"
                  style={{ borderColor: 'var(--sf-linha)', background: 'var(--sf-superficie-2)' }}
                >
                  <Icone size={18} style={{ color: 'var(--sf-acento)' }} />
                </span>
                <h3 className="mt-5 text-[1.05rem] font-semibold tracking-tight">{s(it, 'titulo')}</h3>
                <p className="mt-2 text-[0.93rem] leading-relaxed" style={{ color: 'var(--sf-texto-suave)' }}>
                  {s(it, 'descricao')}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Numeros({ d }: { d: Dados }) {
  const itens = lista(d, 'itens');
  if (!itens.length) return null;
  return (
    <section className="secao">
      <div className="limite">
        <CabecalhoSecao eyebrow={s(d, 'eyebrow')} titulo={s(d, 'titulo')} />
        <dl className="mt-10 grid gap-px overflow-hidden sm:grid-cols-2 lg:grid-cols-4" style={{ background: 'var(--sf-linha)' }}>
          {itens.map((it, i) => (
            <div key={i} className="p-7" style={{ background: 'var(--sf-fundo)' }}>
              <dd className="num-display text-[clamp(2.6rem,5vw,3.8rem)] font-bold leading-none" style={{ color: 'var(--sf-acento)' }}>
                {s(it, 'valor')}
              </dd>
              <dt className="mt-3 text-[0.95rem] font-medium">{s(it, 'rotulo')}</dt>
              {s(it, 'detalhe') && (
                <p className="mt-1 text-[0.82rem]" style={{ color: 'var(--sf-texto-suave)' }}>
                  {s(it, 'detalhe')}
                </p>
              )}
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function Texto({ d }: { d: Dados }) {
  const img = urlMidia(s(d, 'imagem'));
  const pos = s(d, 'posicao_imagem') || 'direita';
  const comImagem = img && pos !== 'nenhuma';
  return (
    <section className="secao">
      <div className={`limite grid items-center gap-12 ${comImagem ? 'lg:grid-cols-2' : ''}`}>
        <div className={comImagem && pos === 'esquerda' ? 'lg:order-2' : ''}>
          <CabecalhoSecao eyebrow={s(d, 'eyebrow')} titulo={s(d, 'titulo')} />
          <div className="mt-6 text-[1rem]">
            <Rico html={s(d, 'conteudo')} />
          </div>
        </div>
        {comImagem && (
          <div className="card overflow-hidden p-1.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img!} alt="" className="w-full rounded-[calc(var(--sf-raio)-6px)]" />
          </div>
        )}
      </div>
    </section>
  );
}

function LinhaTempo({ d }: { d: Dados }) {
  const itens = lista(d, 'itens');
  if (!itens.length) return null;
  return (
    <section className="secao" style={{ background: 'var(--sf-superficie)' }}>
      <div className="limite">
        <CabecalhoSecao eyebrow={s(d, 'eyebrow')} titulo={s(d, 'titulo')} subtitulo={s(d, 'subtitulo')} />
        <ol className="mt-12 border-l pl-7 sm:pl-10" style={{ borderColor: 'var(--sf-linha)' }}>
          {itens.map((it, i) => (
            <li key={i} className="relative pb-10 last:pb-0">
              <span
                className="absolute -left-[calc(1.75rem+5px)] top-1.5 h-[9px] w-[9px] rounded-full sm:-left-[calc(2.5rem+5px)]"
                style={{ background: 'var(--sf-acento)' }}
              />
              <span className="etiqueta" style={{ color: 'var(--sf-acento)' }}>
                {s(it, 'ano')}
              </span>
              <h3 className="t-h3 mt-2">{s(it, 'titulo')}</h3>
              <p className="mt-2 max-w-2xl text-[0.95rem] leading-relaxed" style={{ color: 'var(--sf-texto-suave)' }}>
                {s(it, 'descricao')}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Telas({ d }: { d: Dados }) {
  const itens = lista(d, 'itens').map((it) => ({ arquivo: s(it, 'arquivo'), titulo: s(it, 'titulo'), texto: s(it, 'texto') }));
  if (!itens.length) return null;
  return (
    <section className="secao">
      <div className="limite">
        <CabecalhoSecao eyebrow={s(d, 'eyebrow')} titulo={s(d, 'titulo')} subtitulo={s(d, 'subtitulo')} />
        <div className="mt-12">
          <GaleriaTelas telas={itens} />
        </div>
      </div>
    </section>
  );
}

function Depoimentos({ d }: { d: Dados }) {
  const itens = lista(d, 'itens');
  if (!itens.length) return null;
  return (
    <section className="secao">
      <div className="limite">
        <CabecalhoSecao eyebrow={s(d, 'eyebrow')} titulo={s(d, 'titulo')} />
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {itens.map((it, i) => {
            const foto = urlMidia(s(it, 'foto'));
            return (
              <figure key={i} className="card flex flex-col p-7">
                <Quote size={22} style={{ color: 'var(--sf-acento)' }} />
                <blockquote className="mt-4 flex-1 text-[0.97rem] leading-relaxed">{s(it, 'texto')}</blockquote>
                <figcaption className="mt-6 flex items-center gap-3 border-t pt-4" style={{ borderColor: 'var(--sf-linha)' }}>
                  {foto ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={foto} alt="" className="h-10 w-10 rounded-full object-cover" />
                  ) : null}
                  <span className="text-[0.86rem]">
                    <span className="block font-semibold">{s(it, 'autor')}</span>
                    <span style={{ color: 'var(--sf-texto-suave)' }}>
                      {[s(it, 'cargo'), s(it, 'empresa')].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                </figcaption>
              </figure>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Planos({ d, planos }: { d: Dados; planos: Plano[] }) {
  if (!planos.length) return null;
  return (
    <section className="secao" style={{ background: 'var(--sf-superficie)' }}>
      <div className="limite">
        <CabecalhoSecao eyebrow={s(d, 'eyebrow')} titulo={s(d, 'titulo')} subtitulo={s(d, 'subtitulo')} centro />
        <div className="mt-12 grid items-start gap-5 lg:grid-cols-3">
          {planos.map((p) => (
            <div
              key={p.id}
              className="card relative flex flex-col p-7"
              style={
                p.destaque
                  ? { borderColor: 'var(--sf-acento)', background: 'var(--sf-superficie-2)' }
                  : undefined
              }
            >
              {/* ternario, nao `&&`: destaque vem do MySQL como 0/1 e `{0 && ...}`
                  faria o React imprimir o literal "0" na tela. */}
              {p.destaque ? (
                <span
                  className="absolute -top-3 left-7 rounded-full px-3 py-1 font-mono text-[0.64rem] font-semibold tracking-[0.14em]"
                  style={{ background: 'var(--sf-acento)', color: 'var(--sf-acento-texto)' }}
                >
                  MAIS ESCOLHIDO
                </span>
              ) : null}
              <h3 className="t-h3">{p.nome}</h3>
              {p.descricao && (
                <p className="mt-2 text-[0.9rem] leading-relaxed" style={{ color: 'var(--sf-texto-suave)' }}>
                  {p.descricao}
                </p>
              )}
              <div className="mt-6 flex items-end gap-2 border-y py-5" style={{ borderColor: 'var(--sf-linha)' }}>
                <span className="num-display text-[2.1rem] font-bold leading-none">{p.preco}</span>
                {p.periodo && (
                  <span className="pb-1 text-[0.82rem]" style={{ color: 'var(--sf-texto-suave)' }}>
                    {p.periodo}
                  </span>
                )}
              </div>
              <ul className="mt-6 flex-1 space-y-3">
                {(p.itens ?? []).map((it) => (
                  <li key={it.id} className="flex items-start gap-2.5 text-[0.9rem]">
                    {it.incluso ? (
                      <Check size={15} className="mt-0.5 shrink-0" style={{ color: 'var(--sf-acento-2)' }} />
                    ) : (
                      <Minus size={15} className="mt-0.5 shrink-0 opacity-40" />
                    )}
                    <span style={{ color: it.incluso ? 'var(--sf-texto)' : 'var(--sf-texto-suave)', opacity: it.incluso ? 1 : 0.65 }}>
                      {it.texto}
                    </span>
                  </li>
                ))}
              </ul>
              <Link
                href={p.cta_url || '/contato'}
                className={`btn mt-7 w-full ${p.destaque ? 'btn-acento' : 'btn-linha'}`}
              >
                {p.cta_texto || 'Pedir proposta'}
              </Link>
              {p.observacao && (
                <p className="mt-3 text-center text-[0.76rem]" style={{ color: 'var(--sf-texto-suave)' }}>
                  {p.observacao}
                </p>
              )}
            </div>
          ))}
        </div>
        {s(d, 'nota') && (
          <p className="mx-auto mt-8 max-w-2xl text-center text-[0.86rem]" style={{ color: 'var(--sf-texto-suave)' }}>
            {s(d, 'nota')}
          </p>
        )}
      </div>
    </section>
  );
}

function Faq({ d }: { d: Dados }) {
  const itens = lista(d, 'itens');
  if (!itens.length) return null;
  return (
    <section className="secao">
      <div className="limite grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <CabecalhoSecao eyebrow={s(d, 'eyebrow')} titulo={s(d, 'titulo')} subtitulo={s(d, 'subtitulo')} />
        <div>
          {itens.map((it, i) => (
            <details key={i} className="group border-t py-5" style={{ borderColor: 'var(--sf-linha)' }}>
              <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-[1.02rem] font-medium">
                {s(it, 'pergunta')}
                <span
                  className="mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full border transition-transform group-open:rotate-45"
                  style={{ borderColor: 'var(--sf-linha)' }}
                >
                  <span className="relative block h-[9px] w-[9px]">
                    <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2" style={{ background: 'var(--sf-acento)' }} />
                    <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2" style={{ background: 'var(--sf-acento)' }} />
                  </span>
                </span>
              </summary>
              <div className="mt-3 max-w-2xl text-[0.95rem]">
                <Rico html={s(it, 'resposta')} />
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function Logos({ d }: { d: Dados }) {
  const itens = lista(d, 'itens');
  if (!itens.length) return null;
  return (
    <section className="border-y py-12" style={{ borderColor: 'var(--sf-linha)' }}>
      <div className="limite">
        {s(d, 'titulo') && <p className="etiqueta text-center">{s(d, 'titulo')}</p>}
        <div className="mt-7 flex flex-wrap items-center justify-center gap-x-12 gap-y-7">
          {itens.map((it, i) => {
            const img = urlMidia(s(it, 'imagem'));
            return img ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                key={i}
                src={img}
                alt={s(it, 'nome')}
                className="h-7 w-auto opacity-45 grayscale transition hover:opacity-100 hover:grayscale-0"
              />
            ) : (
              <span key={i} className="text-[1.05rem] font-semibold opacity-45">
                {s(it, 'nome')}
              </span>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Cta({ d }: { d: Dados }) {
  const acento = (s(d, 'estilo') || 'acento') === 'acento';
  return (
    <section className="secao">
      <div className="limite">
        <div
          className="relative overflow-hidden px-7 py-14 text-center sm:px-14"
          style={{
            borderRadius: 'var(--sf-raio)',
            background: acento ? 'var(--sf-acento)' : 'var(--sf-superficie)',
            border: acento ? 'none' : '1px solid var(--sf-linha)',
            color: acento ? 'var(--sf-acento-texto)' : 'var(--sf-texto)',
          }}
        >
          {!acento && (
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.13] blur-[70px]"
              style={{ background: 'radial-gradient(circle at 50% 120%, var(--sf-acento), transparent 65%)' }}
              aria-hidden
            />
          )}
          <h2 className="t-h2 relative mx-auto max-w-[26ch]">{comDestaque(s(d, 'titulo'))}</h2>
          {s(d, 'subtitulo') && (
            <p
              className="relative mx-auto mt-4 max-w-xl text-[1rem]"
              style={{ opacity: acento ? 0.78 : 1, color: acento ? 'inherit' : 'var(--sf-texto-suave)' }}
            >
              {s(d, 'subtitulo')}
            </p>
          )}
          {s(d, 'cta_texto') && (
            <Link
              href={s(d, 'cta_url') || '/contato'}
              className={`btn relative mt-8 ${acento ? 'btn-escuro' : 'btn-acento'}`}
            >
              {s(d, 'cta_texto')} <ArrowRight size={15} />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

function Contato({ d, config, produtos, primeiro }: { d: Dados; config: ConfigSite; produtos: Produto[]; primeiro: boolean }) {
  const { contato } = config;
  const wa = contato.whatsapp?.replace(/\D/g, '');
  return (
    <section className={`${primeiro ? 'pt-[132px]' : 'secao'} pb-16 sm:pb-24`}>
      <div className="limite">
        <CabecalhoSecao eyebrow={s(d, 'eyebrow')} titulo={s(d, 'titulo')} subtitulo={s(d, 'subtitulo')} />
        <div className="mt-12 grid gap-10 lg:grid-cols-[1.25fr_0.75fr]">
          {b(d, 'mostrar_form') && (
            <FormContato
              produtos={produtos.map((p) => ({ slug: p.slug, nome: p.nome }))}
              avisoSucesso={s(d, 'aviso_sucesso')}
            />
          )}
          {b(d, 'mostrar_dados') && (
            <div className="space-y-3">
              {contato.email && (
                <a href={`mailto:${contato.email}`} className="card flex items-start gap-3 p-5 transition-colors hover:border-[var(--sf-acento)]">
                  <Mail size={17} className="mt-0.5" style={{ color: 'var(--sf-acento)' }} />
                  <span>
                    <span className="etiqueta block">E-mail</span>
                    <span className="mt-1 block text-[0.95rem]">{contato.email}</span>
                  </span>
                </a>
              )}
              {contato.telefone && (
                <a href={`tel:${contato.telefone.replace(/\D/g, '')}`} className="card flex items-start gap-3 p-5 transition-colors hover:border-[var(--sf-acento)]">
                  <Phone size={17} className="mt-0.5" style={{ color: 'var(--sf-acento)' }} />
                  <span>
                    <span className="etiqueta block">Telefone</span>
                    <span className="mt-1 block text-[0.95rem]">{contato.telefone}</span>
                  </span>
                </a>
              )}
              {wa && (
                <a
                  href={`https://wa.me/${wa}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card flex items-start gap-3 p-5 transition-colors hover:border-[var(--sf-acento-2)]"
                >
                  <MessageCircle size={17} className="mt-0.5" style={{ color: 'var(--sf-acento-2)' }} />
                  <span>
                    <span className="etiqueta block">WhatsApp</span>
                    <span className="mt-1 block text-[0.95rem]">Conversar agora</span>
                  </span>
                </a>
              )}
              {(contato.endereco || contato.cidade) && (
                <div className="card flex items-start gap-3 p-5">
                  <MapPin size={17} className="mt-0.5" style={{ color: 'var(--sf-acento)' }} />
                  <span>
                    <span className="etiqueta block">Endereço</span>
                    <span className="mt-1 block text-[0.95rem]">
                      {contato.endereco}
                      {contato.endereco && contato.cidade ? <br /> : null}
                      {contato.cidade}
                    </span>
                  </span>
                </div>
              )}
              {contato.horario && (
                <div className="card flex items-start gap-3 p-5">
                  <Clock size={17} className="mt-0.5" style={{ color: 'var(--sf-acento)' }} />
                  <span>
                    <span className="etiqueta block">Atendimento</span>
                    <span className="mt-1 block text-[0.95rem]">{contato.horario}</span>
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ---------- entrada ----------

export function RenderBlocos({
  blocos,
  produtos,
  planos,
  config,
}: {
  blocos: Bloco[];
  produtos: Produto[];
  planos: Plano[];
  config: ConfigSite;
}) {
  return (
    <>
      {blocos.map((bl, i) => {
        const d = bl.dados ?? {};
        const primeiro = i === 0;
        switch (bl.tipo) {
          case 'hero':
            return <Hero key={bl.id} d={d} primeiro={primeiro} />;
          case 'produtos':
            return <BlocoProdutos key={bl.id} d={d} produtos={produtos} />;
          case 'recursos':
            return <Recursos key={bl.id} d={d} />;
          case 'numeros':
            return <Numeros key={bl.id} d={d} />;
          case 'texto':
            return <Texto key={bl.id} d={d} />;
          case 'linha_tempo':
            return <LinhaTempo key={bl.id} d={d} />;
          case 'telas':
            return <Telas key={bl.id} d={d} />;
          case 'depoimentos':
            return <Depoimentos key={bl.id} d={d} />;
          case 'planos':
            return <Planos key={bl.id} d={d} planos={planos} />;
          case 'faq':
            return <Faq key={bl.id} d={d} />;
          case 'logos':
            return <Logos key={bl.id} d={d} />;
          case 'cta':
            return <Cta key={bl.id} d={d} />;
          case 'contato':
            return <Contato key={bl.id} d={d} config={config} produtos={produtos} primeiro={primeiro} />;
          default:
            return null;
        }
      })}
    </>
  );
}
