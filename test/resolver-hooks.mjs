import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve as caminho } from 'node:path';

const raiz = caminho(dirname(fileURLToPath(import.meta.url)), '..');
const EXT = ['.ts', '.mts', '.tsx', '/index.ts'];

function tentar(base) {
  if (existsSync(base) && !base.endsWith('/') && /\.[a-z]+$/i.test(base)) return base;
  for (const e of EXT) if (existsSync(base + e)) return base + e;
  return null;
}

export async function resolve(especificador, contexto, proximo) {
  let alvo = null;
  if (especificador.startsWith('@/')) alvo = tentar(caminho(raiz, especificador.slice(2)));
  else if ((especificador.startsWith('./') || especificador.startsWith('../')) && contexto.parentURL?.startsWith('file:')) {
    alvo = tentar(caminho(dirname(fileURLToPath(contexto.parentURL)), especificador));
  }
  if (alvo) return proximo(pathToFileURL(alvo).href, contexto);
  return proximo(especificador, contexto);
}
