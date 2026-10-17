// Envia os prints de public/telas ao Storage (bucket publico `site-midias`, pasta `telas/`).
//
//   node scripts/enviar-telas.mjs            # envia o que esta em telas-local/ (substitui o que ja existe)
//   node scripts/enviar-telas.mjs <arquivo>  # so um arquivo (ex.: oms-1-pedidos.webp)
//
// Precisa de SUPABASE_SECRET_KEY no .env.local (chave de SERVIDOR: nunca vai para o codigo/GitHub).
// Depois de enviar, o site le as imagens do Storage (lib/cms-padroes.ts -> urlTela) e trocar um print
// passa a ser so reenviar o arquivo com o mesmo nome, sem novo deploy.
import fs from 'node:fs';
import path from 'node:path';

const RAIZ = path.resolve(import.meta.dirname, '..');
const env = Object.fromEntries(
  fs.readFileSync(path.join(RAIZ, '.env.local'), 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.includes('=') && !l.trimStart().startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
);
const URL_BASE = (env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/+$/, '');
const CHAVE = env.SUPABASE_SECRET_KEY || '';
if (!URL_BASE || !CHAVE) {
  console.error('ERRO: faltam NEXT_PUBLIC_SUPABASE_URL e/ou SUPABASE_SECRET_KEY no .env.local');
  process.exit(1);
}

// telas-local/ e ignorada pelo git: o Storage e a fonte; esta pasta so recebe o print novo a enviar.
const PASTA = path.join(RAIZ, 'telas-local');
if (!fs.existsSync(PASTA)) {
  console.error('ERRO: crie a pasta telas-local/ e ponha nela os .webp a enviar');
  process.exit(1);
}
const alvo = process.argv[2];
const arquivos = fs.readdirSync(PASTA).filter((f) => /^[a-z0-9._-]+\.webp$/i.test(f) && (!alvo || f === alvo));
let ok = 0;
const falhas = [];
for (const f of arquivos) {
  const res = await fetch(`${URL_BASE}/storage/v1/object/site-midias/telas/${f}`, {
    method: 'POST',
    headers: { apikey: CHAVE, Authorization: `Bearer ${CHAVE}`, 'Content-Type': 'image/webp', 'x-upsert': 'true', 'cache-control': 'max-age=3600' },
    body: fs.readFileSync(path.join(PASTA, f)),
  });
  if (res.ok) ok++;
  else falhas.push(`${f}: ${res.status} ${(await res.text()).slice(0, 120)}`);
}
console.log(`ENVIADAS: ${ok} de ${arquivos.length}`);
if (falhas.length) {
  console.log('FALHAS:\n' + falhas.join('\n'));
  process.exit(2);
}
