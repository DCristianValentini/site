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

## Banco
Migrações aplicadas no Supabase (histórico no próprio projeto). A de acesso do painel está em
`database/005_admin_por_supabase_auth.sql`. O MySQL antigo (`erp_tenant_site`) segue como backup.
