# CLAUDE.md — site institucional + painel (GitHub Pages + Supabase)

Projeto ÚNICO: o **site público** e o **painel `/admin`** moram aqui. Tudo é **estático**
(Next 15 `output: 'export'`, React 18, TypeScript, Tailwind) publicado no **GitHub Pages**
(`https://dcristianvalentini.github.io/site/`). Não há servidor: o conteúdo vive no
**Supabase** (projeto `site`, id `sfcoluxbnbyhfedtuybw`).

Repositório público próprio: `DCristianValentini/site` (branch `main`). Esta pasta fica ignorada
no repositório `Projetos`. O projeto antigo (`projects/site`, Next + MySQL + API routes) foi removido;
está no histórico do git do `Projetos`.

## Como funciona

- **Site público**: lê o Supabase **no build** (`lib/cms.ts`, chave anon, `fetch` com `force-cache`).
  A RLS só deixa passar o que é público (`publicada`/`visivel`/`ativo`). O HTML sai pronto.
- **Painel `/admin`**: roda no **navegador**. Login = **Supabase Auth e-mail+senha**
  (`lib/admin-auth.ts`, sem supabase-js; sessão no localStorage). Só escreve quem está em
  `public.admins` (papéis `admin`/`editor`) — a **RLS** garante, não o front. Cada
  `cli.put('/api/admin/...')` dos editores cai em `lib/admin-api.ts`, que fala com o PostgREST
  usando o JWT do usuário. **Não existem rotas `/api`** (Pages é estático).
- **Formulário de contato**: `POST /rest/v1/leads` direto (política de INSERT apenas; honeypot `site`).
- **Imagens do CMS**: convertidas a WebP no navegador (`lib/imagem-cliente.ts`) e enviadas ao bucket
  público `site-midias` do Storage. **Prints de telas** (`public/telas/*.webp`) ficam no repositório
  (não passam pelo Storage); referenciados por nome em `produtos.telas`.
- **Publicar**: o workflow `Publicar site` roda em push, 1x/dia (cron), manual e por
  `repository_dispatch` `publicar` (botão "Publicar o site" do painel; token fine-grained do GitHub
  guardado no navegador de quem edita). Edição no painel só aparece no site depois de publicar.

## Rodar / build

```bash
cp .env.example .env.local   # NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_KEY (anon)
npm install && npm run dev   # http://localhost:3010 (painel em /admin)
npm run build                # gera out/ (type-check incluso)
SITE_BASE_PATH=/site npm run build   # simula o Pages de projeto
```
- Tipos sem tocar no `.next`: `npx tsc --noEmit`.
- ⚠️ **Apague `.next` antes de conferir o build** (`rm -rf .next out`): o cache de `fetch` do Next
  guarda as respostas do Supabase e o build local mostra dados velhos. O CI é limpo.
- No Git Bash use `MSYS_NO_PATHCONV=1` ao passar `SITE_BASE_PATH=/site` (senão vira caminho do Windows).

## Acesso ao painel

Supabase → Authentication → Users → Add user; depois `insert into public.admins (user_id, papel)
values ('<uuid>','admin')`. **Desligue "Allow new users to sign up"** (ninguém precisa se cadastrar).
Excluir produto/plano só `admin`. Campo de senha sempre com olho (`<EntradaSenha>`).

## Banco (Supabase)

Tabelas: `config` (chave→jsonb: identidade, contato, redes, seo, nav), `tema` (linha id=1),
`paginas`, `blocos` (tipo + `dados` jsonb + `ordem` + `visivel`), `produtos` + `produto_recursos`,
`planos` + `plano_itens`, `midias`, `leads`, `admins`. Schema `private` guarda as funções da RLS
(`eh_admin`, `eh_papel_admin`). Migrações pelo MCP do Supabase (histórico no próprio projeto);
**nunca edite uma aplicada** — crie nova. Boolean volta do PostgREST como true/false; `lib/admin-dados.ts`
e `lib/cms.ts` convertem para 1/0 (o resto do código foi escrito assim): **`{numero && <JSX/>}` é proibido**
(imprime "0"); use ternário ou `!!valor`.

`produtos` tem, além do básico: `linha` (Sistemas de gestão / Aplicativos / Suíte Enterprise), `area`
(só da suíte), `quem_usa`, `como_acessa`, `exemplo`, `passos` (jsonb), `integracoes` (jsonb de
`{slug, texto}`), `historia` (html), `telas` (jsonb de `{arquivo, titulo, texto}`).

## Motor do CMS

`lib/blocos.ts` é a fonte única: cada tipo de bloco declara seus campos e dele saem o formulário do
painel (`components/admin/campo-editor.tsx`), a renderização (`components/site/blocos.tsx`, `switch`
em `RenderBlocos`) e a normalização (`lib/normalizar.ts`). **Bloco novo = entrada em `TIPOS_BLOCO` +
componente no `switch`.** Tipos hoje: hero, recursos, produtos, telas, numeros, texto, linha_tempo,
depoimentos, planos, faq, logos, cta, contato. HTML de campo `rich` é sanitizado ao salvar
(`lib/sanitize.ts`, whitelist) — o navegador não é fronteira de segurança; a RLS é.

Páginas fixas no código: `/`, `/sobre`, `/produtos`, `/suite`, `/planos`, `/contato`
(cada uma é `<PaginaCms slug=.../>`). Produto: `/produtos/<slug>` (`generateStaticParams`,
`dynamicParams=false`). Página nova com URL própria = criar rota + linha em `paginas`.
No painel, a edição de página é `/admin/paginas/editar?id=N` (query, não rota dinâmica).

## Tema

`app/layout.tsx` lê a tabela `tema` e injeta as variáveis `--sf-*`. As fontes têm import estático
(`app/fontes.ts`); o tema só escolhe qual usar. O painel tem paleta fixa `adm-*`.

## Conteúdo

- **Marca**: `Cristian Valentini` / `CV`. Não usar "Girando Sol". Nada em Projetos tem relação com ela.
- **O texto do site é uma afirmação sobre o produto**: escreva a partir do código, não do roteiro; o que
  falta se diz com o que falta (ex.: meio de pagamento e e-mail dependem de configuração na implantação).
- Depoimentos nascem ocultos e vazios — só ligar com depoimento real.
- Suíte Enterprise: 29 sistemas + 5 pacotes por área (`pacote-*`), vendidos juntos ou separados. Os
  textos "como se usa", "conversa com", "um dia de uso" e os prints vêm do código e do console da suíte
  (`Projetos/suite`); prints: login no console local, só telas com dados de demonstração.
- Contagens por extenso ("29 sistemas") envelhecem em silêncio — conferir contra `select count(*)`.

## Convenções

- Imagem: sempre WebP, arquivo (nunca base64). `<img>` simples não ganha `basePath`: use `urlMidia()` /
  `urlTela()` (`lib/cms-padroes.ts`), que já prefixam.
- Links internos com `next/link` (prefixa `basePath`); evitar `<a href="/...">` cru.
- Next 15 (não 14: CVE de bypass no middleware). Componentes de UI feitos à mão (`components/admin/ui.tsx`);
  não usar shadcn CLI.
- Responsividade: tipografia fluida (`clamp`), menu em gaveta no mobile, modal em folha inferior.
- **Nunca** commitar `.env*`. A chave secreta do Supabase não vai para o código nem para o navegador.
