# Site institucional + painel (GitHub Pages + Supabase)

Projeto único: o **site público** e o **painel `/admin`** moram aqui, ambos estáticos, publicados no
GitHub Pages. Não há servidor: o conteúdo vive no **Supabase** (projeto `site`).

- **Site público** — lê o Supabase **na hora do build** (chave anon; a RLS só deixa passar o que é público).
- **Painel `/admin`** — roda no navegador, entra com **e-mail e senha do Supabase Auth** e grava direto no
  banco com o JWT do usuário. Só escreve quem está na tabela `public.admins` (a RLS garante, não o front).
- **Formulário de contato** — insere em `leads` (só inserir; a política não deixa ler).
- **Imagens** — convertidas para WebP no navegador e enviadas ao bucket `site-midias` do Storage.

## Publicar
O site é refeito (workflow `Publicar site`) em: push, uma vez por dia, manualmente (aba Actions) e pelo
botão **Publicar o site** do painel (precisa de um token fine-grained do GitHub, só deste repositório, com
*Contents: Read and write*; fica guardado no navegador de quem edita).

## Acesso ao painel
1. Supabase → Authentication → Users → **Add user** (e-mail + senha).
2. Dar acesso: `insert into public.admins (user_id, papel) values ('<uuid do usuário>', 'admin');`
   (`admin` pode excluir produtos/planos; `editor` não).
3. Desligue **Allow new users to sign up** (Authentication → Sign In / Providers): ninguém precisa se cadastrar.

## Rodar local
```bash
cp .env.example .env.local   # URL + chave anon do projeto "site"
npm install && npm run dev   # http://localhost:3010 (painel em /admin)
npm run build                # gera out/ (type-check incluso)
```
Para simular o Pages de projeto: `SITE_BASE_PATH=/site npm run build`.

## Testes
```bash
npm test          # 47 testes, sem navegador (Node 22+ le TypeScript direto)
npm run typecheck
```
- `test/sanitize.test.mts` — o HTML do editor rico vai para o site público; ataca o sanitizador com payloads
  de XSS (atributo `style` com aspas, `href`, `javascript:`, `<scr<script>ipt>`, escape CSS) e confere
  invariantes sobre a saída. Também prova que ele é idempotente: roda ao salvar **e** ao renderizar.
- `test/cms-motor.test.mts` — `normalizar`, catálogo de blocos, tema → CSS e a ligação entre o catálogo
  (`lib/blocos.ts`) e o renderizador (`components/site/blocos.tsx`): tipo sem renderizador faz a página sumir.
- `test/seo.test.mts`, `test/cor-legivel.test.mts` — título/descrição no limite do buscador e contraste da
  cor de produto.
- `test/rls.test.mjs` — **black-box contra o banco real**, com a chave pública que o site já embute: prova o
  que um visitante *não* consegue (ler `leads`/`admins`, escrever, forjar `lido`/`id`, chamar as funções de
  admin, listar o bucket). Só faz tentativas que devem falhar: nunca cria nem altera dado em produção.
  Precisa de `NEXT_PUBLIC_SUPABASE_URL` (no `.env.local`) e `NEXT_PUBLIC_SUPABASE_KEY`; sem elas, **pula** (não
  passa em branco). Para rodar sem gravar a chave em arquivo:
  `NEXT_PUBLIC_SUPABASE_KEY=sb_publishable_... npm test`.

### Navegador (Playwright, Python)
Em `e2e/`, contra o site rodando (`npm run dev`, porta 3010) ou o `out/` servido. Páginas públicas usam
`--sem-login`; o `/admin` precisa de `E2E_LOGIN` e `E2E_SENHA` de uma conta de teste (nunca no repositório).
```bash
pip install playwright && python -m playwright install chromium
P=",produtos/,planos/,sobre/,contato/"
python -I e2e/responsividade.py --base http://localhost:3010 --paginas "$P" --sem-login   # 7 tamanhos, alvo de toque 44 px
python -I e2e/contraste.py      --base http://localhost:3010 --paginas "$P" --sem-login   # WCAG 4,5:1
python -I e2e/acessibilidade.py --base http://localhost:3010 --paginas "$P" --sem-login --axe node_modules/axe-core/axe.min.js
python -I e2e/seo.py            --base http://localhost:3010 --paginas "$P" [--estrito]   # lang, title, h1, canonical, og, links, sitemap
```
`seo.py` acusa também **texto de exemplo esquecido no conteúdo** (e-mail `@exemplo.com.br`, `(00) 0000-0000`,
`Cidade / UF`, lorem ipsum): o site vai ao ar com o que estiver no banco. É aviso; `--estrito` reprova.

## Segurança do conteúdo
O banco só tem RLS (a chave pública é embutida no site), e o painel valida **no navegador** de quem edita —
quem é admin também escreve direto pela API. Por isso o conteúdo é filtrado de novo **na renderização**:
`sanitizarHtml` em todo `dangerouslySetInnerHTML` e `lib/tema-css.ts` em cada valor do tema que vira CSS
(um valor `red}</style><script>` não pode fechar o `<style>` do layout).

## Banco
Migrações aplicadas no Supabase (histórico no próprio projeto). A de acesso do painel está em
`database/005_admin_por_supabase_auth.sql`. O MySQL antigo (`erp_tenant_site`) segue como backup.
