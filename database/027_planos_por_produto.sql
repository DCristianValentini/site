-- 027_planos_por_produto
-- Cada plano passa a pertencer a um produto (slug de public.produtos). NAO destrutiva e idempotente:
--   * coluna nullable (plano sem produto continua valido e aparece em "Planos gerais");
--   * sem FK de proposito: o slug do produto pode ser editado/desativado no painel sem travar o plano;
--   * as politicas RLS existentes (planos: site_le_planos = ativo; plano_itens: site_le_itens) nao mudam:
--     coluna nova herda a politica da linha, entao o anon continua lendo so planos ativos.
-- Backfill: os 3 planos que ja existiam (ids 1, 2, 3: Essencial, Profissional, Corporativo) sao do ERP.

alter table public.planos add column if not exists produto_slug varchar;

update public.planos set produto_slug = 'erp'
where produto_slug is null and id in (1, 2, 3);

create index if not exists ix_planos_produto on public.planos (produto_slug, ordem);
