'use client';

import { useState } from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

/** Formulario publico. Grava em `leads` (visivel no /admin/leads). */
export function FormContato({
  produtos,
  avisoSucesso,
}: {
  produtos: { slug: string; nome: string }[];
  avisoSucesso: string;
}) {
  const [enviando, setEnviando] = useState(false);
  const [pronto, setPronto] = useState(false);
  const [erro, setErro] = useState('');

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro('');
    setEnviando(true);
    const fd = new FormData(e.currentTarget);
    try {
      const dados = Object.fromEntries(fd.entries()) as Record<string, string>;
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (supabaseUrl) {
        // Site estatico (GitHub Pages): sem servidor, grava direto no Supabase. A RLS so
        // deixa INSERIR em `leads` (nunca ler) e o banco confere nome/e-mail/tamanhos.
        const txt = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
        if (txt(dados.site, 50)) {
          setPronto(true); // honeypot: robo recebe "sucesso" e nada e gravado
          return;
        }
        const nome = txt(dados.nome, 140);
        const email = txt(dados.email, 190);
        const mensagem = txt(dados.mensagem, 4000);
        if (!nome || !email || !mensagem) throw new Error('Preencha nome, e-mail e mensagem.');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw new Error('E-mail inválido.');
        const chave = process.env.NEXT_PUBLIC_SUPABASE_KEY ?? '';
        const res = await fetch(`${supabaseUrl.replace(/\/+$/, '')}/rest/v1/leads`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', apikey: chave, Authorization: `Bearer ${chave}`, Prefer: 'return=minimal' },
          body: JSON.stringify({
            nome, email, mensagem,
            telefone: txt(dados.telefone, 40) || null,
            empresa: txt(dados.empresa, 140) || null,
            interesse: txt(dados.interesse, 120) || null,
            origem: txt(dados.origem, 80) || 'site',
          }),
        });
        if (!res.ok) throw new Error('Não foi possível enviar agora.');
        setPronto(true);
        return;
      }
      const res = await fetch('/api/contato', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.erro || 'Não foi possível enviar agora.');
      setPronto(true);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível enviar agora.');
    } finally {
      setEnviando(false);
    }
  }

  if (pronto) {
    return (
      <div className="card flex flex-col items-start gap-4 p-8">
        <CheckCircle2 size={26} style={{ color: 'var(--sf-acento-2)' }} />
        <p className="t-h3">Mensagem enviada</p>
        <p style={{ color: 'var(--sf-texto-suave)' }}>
          {avisoSucesso || 'Recebemos sua mensagem. Retornamos em breve.'}
        </p>
      </div>
    );
  }

  const campo =
    'w-full rounded-[10px] border bg-transparent px-3.5 py-3 text-[0.95rem] outline-none transition-colors focus:border-[var(--sf-acento)]';
  const rotulo = 'mb-1.5 block text-[0.82rem] font-medium';

  return (
    <form onSubmit={enviar} className="card p-6 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={rotulo} htmlFor="nome">
            Nome <span style={{ color: 'var(--sf-acento)' }}>*</span>
          </label>
          <input id="nome" name="nome" required maxLength={140} className={campo} style={{ borderColor: 'var(--sf-linha)' }} />
        </div>
        <div>
          <label className={rotulo} htmlFor="empresa">
            Empresa
          </label>
          <input id="empresa" name="empresa" maxLength={140} className={campo} style={{ borderColor: 'var(--sf-linha)' }} />
        </div>
        <div>
          <label className={rotulo} htmlFor="email">
            E-mail <span style={{ color: 'var(--sf-acento)' }}>*</span>
          </label>
          <input id="email" name="email" type="email" required maxLength={190} className={campo} style={{ borderColor: 'var(--sf-linha)' }} />
        </div>
        <div>
          <label className={rotulo} htmlFor="telefone">
            Telefone / WhatsApp
          </label>
          <input id="telefone" name="telefone" maxLength={40} className={campo} style={{ borderColor: 'var(--sf-linha)' }} />
        </div>
        <div className="sm:col-span-2">
          <label className={rotulo} htmlFor="interesse">
            Interesse
          </label>
          <select id="interesse" name="interesse" className={campo} style={{ borderColor: 'var(--sf-linha)', background: 'var(--sf-superficie)' }} defaultValue="">
            <option value="">Não sei ainda / quero orientação</option>
            {produtos.map((p) => (
              <option key={p.slug} value={p.nome}>
                {p.nome}
              </option>
            ))}
            <option value="Suporte">Sou cliente e preciso de suporte</option>
            <option value="Parceria">Parceria / revenda</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className={rotulo} htmlFor="mensagem">
            Como sua operação funciona hoje? <span style={{ color: 'var(--sf-acento)' }}>*</span>
          </label>
          <textarea
            id="mensagem"
            name="mensagem"
            required
            rows={5}
            maxLength={4000}
            className={`${campo} resize-y`}
            style={{ borderColor: 'var(--sf-linha)' }}
            placeholder="Quantas pessoas usam o sistema, o que trava hoje, qual prazo você tem em mente."
          />
        </div>
      </div>

      {/* isca anti-robo: campo escondido que humano nao preenche */}
      <input type="text" name="site" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

      {erro && (
        <p className="mt-4 rounded-[10px] px-3.5 py-2.5 text-[0.88rem]" style={{ background: 'rgba(255,90,90,.12)', color: '#ff9a9a' }}>
          {erro}
        </p>
      )}

      <button type="submit" disabled={enviando} className="btn btn-acento mt-6 w-full py-3.5 disabled:opacity-60">
        {enviando ? 'Enviando…' : 'Enviar mensagem'}
        {!enviando && <ArrowRight size={15} />}
      </button>
      <p className="mt-3 text-center text-[0.78rem]" style={{ color: 'var(--sf-texto-suave)' }}>
        Seus dados são usados apenas para responder este contato.
      </p>
    </form>
  );
}
