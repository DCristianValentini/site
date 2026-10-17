import { ErroApi } from './normalizar';

/**
 * Prepara a imagem no navegador antes do upload (o que o `sharp` fazia no servidor): reduz
 * para no maximo 1920px de largura e converte para webp. O nome do arquivo e o inicio do
 * SHA-256 do conteudo, entao a mesma imagem enviada duas vezes cai no mesmo caminho.
 */

const LARGURA_MAX = 1920;
const LIMITE_BYTES = 2 * 1024 * 1024; // o bucket recusa acima disso

export interface ImagemPronta {
  blob: Blob;
  arquivo: string; // AAAA-MM/<hash16>.webp
  largura: number;
  altura: number;
  bytes: number;
}

export async function prepararImagem(file: File): Promise<ImagemPronta> {
  let bmp: ImageBitmap;
  try {
    bmp = await createImageBitmap(file);
  } catch {
    throw new ErroApi('Não consegui ler essa imagem. Use JPG, PNG ou WebP.', 422);
  }

  const escala = Math.min(1, LARGURA_MAX / bmp.width);
  const largura = Math.max(1, Math.round(bmp.width * escala));
  const altura = Math.max(1, Math.round(bmp.height * escala));
  const canvas = document.createElement('canvas');
  canvas.width = largura;
  canvas.height = altura;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new ErroApi('Este navegador não consegue processar imagens.', 500);
  ctx.drawImage(bmp, 0, 0, largura, altura);
  bmp.close();

  const gerar = (q: number) => new Promise<Blob | null>((ok) => canvas.toBlob(ok, 'image/webp', q));
  let blob = await gerar(0.82);
  if (blob && blob.size > LIMITE_BYTES) blob = await gerar(0.6);
  if (!blob || blob.type !== 'image/webp') throw new ErroApi('Este navegador não gera WebP.', 500);
  if (blob.size > LIMITE_BYTES) throw new ErroApi('A imagem ficou maior que 2 MB mesmo comprimida. Use uma menor.', 422);

  const digest = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer());
  const hash = Array.from(new Uint8Array(digest)).slice(0, 8).map((b) => b.toString(16).padStart(2, '0')).join('');
  const hoje = new Date();
  const pasta = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
  return { blob, arquivo: `${pasta}/${hash}.webp`, largura, altura, bytes: blob.size };
}
