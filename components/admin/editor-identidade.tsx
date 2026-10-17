'use client';

import { useState } from 'react';
import { Save } from 'lucide-react';
import type { ConfigSite } from '@/lib/tipos';
import { cli, msgErro } from '@/lib/cliente';
import { Alternar, Aviso, Botao, Campo, Cartao, Entrada, AreaTexto } from './ui';
import { SeletorImagem } from './seletor-imagem';

/**
 * Identidade, contato, redes, SEO padrao e menu. Cada bloco salva a sua chave em
 * `config` (JSON) — o site le tudo isso no cabecalho, rodape e metadados.
 */
export function EditorIdentidade({ inicial }: { inicial: ConfigSite }) {
  const [c, setC] = useState<ConfigSite>(inicial);
  const [salvando, setSalvando] = useState('');
  const [aviso, setAviso] = useState('');
  const [erro, setErro] = useState('');

  async function salvar(chave: keyof ConfigSite) {
    setSalvando(chave);
    setErro('');
    try {
      await cli.put('/api/admin/config', { chave, valor: c[chave] });
      setAviso('Salvo. Recarregue o site para ver.');
      setTimeout(() => setAviso(''), 2500);
    } catch (e) {
      setErro(msgErro(e));
    } finally {
      setSalvando('');
    }
  }

  const BotaoSalvar = ({ chave }: { chave: keyof ConfigSite }) => (
    <Botao variante="primario" carregando={salvando === chave} onClick={() => salvar(chave)}>
      <Save size={14} /> Salvar
    </Botao>
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[1.3rem] font-semibold tracking-tight">Identidade e contato</h1>
        <p className="mt-1 text-[0.86rem] text-adm-suave">
          Nome da empresa, logo, dados de contato, redes sociais, menu e SEO padrão do site.
        </p>
      </div>

      {aviso && <Aviso texto={aviso} />}
      {erro && <Aviso texto={erro} erro />}

      <Cartao titulo="Empresa" acao={<BotaoSalvar chave="identidade" />}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo label="Nome da empresa" ajuda="Aparece no cabeçalho, rodapé e no título das páginas.">
            <Entrada
              value={c.identidade.nome}
              onChange={(e) => setC({ ...c, identidade: { ...c.identidade, nome: e.target.value } })}
            />
          </Campo>
          <Campo label="Sigla (2–3 letras)" ajuda="Usada no selo quadrado quando não há logo.">
            <Entrada
              value={c.identidade.sigla}
              onChange={(e) => setC({ ...c, identidade: { ...c.identidade, sigla: e.target.value } })}
            />
          </Campo>
          <Campo label="Frase da empresa (tagline)" largo>
            <Entrada
              value={c.identidade.tagline}
              onChange={(e) => setC({ ...c, identidade: { ...c.identidade, tagline: e.target.value } })}
            />
          </Campo>
          <Campo label="Descrição curta" ajuda="Aparece no rodapé." largo>
            <AreaTexto
              rows={3}
              value={c.identidade.descricao}
              onChange={(e) => setC({ ...c, identidade: { ...c.identidade, descricao: e.target.value } })}
            />
          </Campo>
          <Campo label="Logo" ajuda="Se vazio, mostra o selo com a sigla. Prefira PNG/SVG com fundo transparente." largo>
            <SeletorImagem
              valor={c.identidade.logo ?? ''}
              onChange={(v) => setC({ ...c, identidade: { ...c.identidade, logo: v || null } })}
            />
          </Campo>
        </div>
      </Cartao>

      <Cartao titulo="Contato" acao={<BotaoSalvar chave="contato" />}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo label="E-mail">
            <Entrada value={c.contato.email} onChange={(e) => setC({ ...c, contato: { ...c.contato, email: e.target.value } })} />
          </Campo>
          <Campo label="Telefone">
            <Entrada value={c.contato.telefone} onChange={(e) => setC({ ...c, contato: { ...c.contato, telefone: e.target.value } })} />
          </Campo>
          <Campo label="WhatsApp" ajuda="Só números com país e DDD: 5551999998888.">
            <Entrada value={c.contato.whatsapp} onChange={(e) => setC({ ...c, contato: { ...c.contato, whatsapp: e.target.value } })} />
          </Campo>
          <Campo label="CNPJ" ajuda="Aparece no rodapé, se preenchido.">
            <Entrada value={c.contato.cnpj} onChange={(e) => setC({ ...c, contato: { ...c.contato, cnpj: e.target.value } })} />
          </Campo>
          <Campo label="Endereço">
            <Entrada value={c.contato.endereco} onChange={(e) => setC({ ...c, contato: { ...c.contato, endereco: e.target.value } })} />
          </Campo>
          <Campo label="Cidade / UF">
            <Entrada value={c.contato.cidade} onChange={(e) => setC({ ...c, contato: { ...c.contato, cidade: e.target.value } })} />
          </Campo>
          <Campo label="Horário de atendimento" largo>
            <Entrada value={c.contato.horario} onChange={(e) => setC({ ...c, contato: { ...c.contato, horario: e.target.value } })} />
          </Campo>
        </div>
      </Cartao>

      <Cartao titulo="Redes sociais" acao={<BotaoSalvar chave="redes" />}>
        <div className="grid gap-4 sm:grid-cols-2">
          {(['instagram', 'linkedin', 'facebook', 'youtube', 'github'] as const).map((k) => (
            <Campo key={k} label={k[0].toUpperCase() + k.slice(1)} ajuda="URL completa. Vazio = ícone não aparece.">
              <Entrada
                value={c.redes[k]}
                placeholder="https://…"
                onChange={(e) => setC({ ...c, redes: { ...c.redes, [k]: e.target.value } })}
              />
            </Campo>
          ))}
        </div>
      </Cartao>

      <Cartao titulo="Menu do site" acao={<BotaoSalvar chave="nav" />}>
        <div className="space-y-3">
          {c.nav.itens.map((it, i) => (
            <div key={i} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
              <Entrada
                value={it.label}
                placeholder="Texto"
                onChange={(e) => {
                  const itens = [...c.nav.itens];
                  itens[i] = { ...itens[i], label: e.target.value };
                  setC({ ...c, nav: { ...c.nav, itens } });
                }}
              />
              <Entrada
                value={it.href}
                placeholder="/produtos"
                onChange={(e) => {
                  const itens = [...c.nav.itens];
                  itens[i] = { ...itens[i], href: e.target.value };
                  setC({ ...c, nav: { ...c.nav, itens } });
                }}
              />
              <Botao variante="perigo" onClick={() => setC({ ...c, nav: { ...c.nav, itens: c.nav.itens.filter((_, k) => k !== i) } })}>
                Remover
              </Botao>
            </div>
          ))}
          <Botao onClick={() => setC({ ...c, nav: { ...c.nav, itens: [...c.nav.itens, { label: '', href: '' }] } })}>
            Adicionar item
          </Botao>

          <div className="grid gap-4 border-t border-adm-linha pt-4 sm:grid-cols-2">
            <Campo label="Botão do cabeçalho — texto" ajuda="Vazio esconde o botão.">
              <Entrada value={c.nav.cta_texto} onChange={(e) => setC({ ...c, nav: { ...c.nav, cta_texto: e.target.value } })} />
            </Campo>
            <Campo label="Botão do cabeçalho — link">
              <Entrada value={c.nav.cta_url} onChange={(e) => setC({ ...c, nav: { ...c.nav, cta_url: e.target.value } })} />
            </Campo>
          </div>
        </div>
      </Cartao>

      <Cartao titulo="SEO padrão" acao={<BotaoSalvar chave="seo" />}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo label="Título padrão do site" ajuda="Usado quando a página não tem título próprio." largo>
            <Entrada value={c.seo.titulo} onChange={(e) => setC({ ...c, seo: { ...c.seo, titulo: e.target.value } })} />
          </Campo>
          <Campo label="Descrição padrão" largo>
            <AreaTexto rows={3} value={c.seo.descricao} onChange={(e) => setC({ ...c, seo: { ...c.seo, descricao: e.target.value } })} />
          </Campo>
          <Campo label="Imagem de compartilhamento padrão" largo>
            <SeletorImagem valor={c.seo.imagem ?? ''} onChange={(v) => setC({ ...c, seo: { ...c.seo, imagem: v || null } })} />
          </Campo>
        </div>
      </Cartao>
    </div>
  );
}
