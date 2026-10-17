'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn } from 'lucide-react';
import { entrar as entrarNoPainel } from '@/lib/admin-auth';
import { msgErro } from '@/lib/cliente';
import { Aviso, Botao, Campo, Entrada, EntradaSenha } from '@/components/admin/ui';

export default function LoginAdmin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [entrando, setEntrando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setEntrando(true);
    try {
      await entrarNoPainel(email, senha);
      router.replace('/admin/');
    } catch (err) {
      setErro(msgErro(err));
      setEntrando(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-7 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-adm-acento text-[0.9rem] font-bold text-[#08101f]">
            CMS
          </span>
          <h1 className="mt-4 text-[1.3rem] font-semibold tracking-tight">Painel do site</h1>
          <p className="mt-1 text-[0.85rem] text-adm-suave">Entre para editar o conteúdo</p>
        </div>

        <form onSubmit={entrar} className="space-y-4 rounded-xl border border-adm-linha bg-adm-card p-6">
          <Campo label="E-mail">
            <Entrada
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoCapitalize="none"
              autoComplete="username"
              required
            />
          </Campo>
          <Campo label="Senha">
            <EntradaSenha
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              autoComplete="current-password"
              required
            />
          </Campo>
          {erro && <Aviso texto={erro} erro />}
          <Botao type="submit" variante="primario" carregando={entrando} className="w-full justify-center py-2.5">
            <LogIn size={15} /> Entrar
          </Botao>
        </form>
      </div>
    </div>
  );
}
