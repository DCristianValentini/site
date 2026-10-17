# Site institucional (publico)

Site estatico publicado no **GitHub Pages**. O conteudo (paginas, blocos, produtos, planos, tema)
mora no **Supabase** (projeto `site`) e e lido **na hora do build** pela chave publicavel.

> Esta pasta e **gerada** a partir de `Projetos/projects/site` (`node scripts/montar-publico.mjs`).
> Nao edite os arquivos aqui: a proxima geracao sobrescreve. O painel de edicao (`/admin`) fica no
> projeto de origem, roda na maquina do dono e grava no mesmo Supabase.

## Como o site se atualiza
- **Editou no painel** -> botao **Publicar** (dispara este workflow) ou espere o agendamento diario.
- Manualmente: aba **Actions** -> *Publicar site* -> *Run workflow*.
- O formulario de contato grava direto no Supabase (so inserir; a politica nao deixa ler).

## Rodar local
```bash
cp .env.example .env.local   # preencher NEXT_PUBLIC_SUPABASE_KEY (anon)
npm install && npm run dev   # http://localhost:3010
```
