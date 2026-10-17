import { despachar } from './admin-api';
import { ErroAuth } from './admin-auth';

/**
 * Cliente do painel (roda no navegador). Mantem a interface `cli.get/post/put/...` que os
 * editores ja usavam; em vez de HTTP para um servidor proprio, cada chamada vai para
 * `admin-api.ts`, que fala com o Supabase usando o login do usuario.
 */

export class ErroCliente extends Error {
  status: number;
  constructor(mensagem: string, status: number) {
    super(mensagem);
    this.status = status;
  }
}

async function pedir<T>(metodo: string, url: string, corpo?: unknown): Promise<T> {
  try {
    return (await despachar(metodo, url, corpo)) as T;
  } catch (e) {
    if (e instanceof ErroCliente) throw e;
    const status = (e as { status?: number }).status;
    if (e instanceof ErroAuth || status === 401) {
      throw new ErroCliente(e instanceof Error ? e.message : 'Sessão expirada. Entre novamente.', 401);
    }
    throw new ErroCliente(e instanceof Error ? e.message : 'Erro inesperado', typeof status === 'number' ? status : 500);
  }
}

export const cli = {
  get: <T>(url: string) => pedir<T>('GET', url),
  post: <T>(url: string, corpo?: unknown) => pedir<T>('POST', url, corpo),
  put: <T>(url: string, corpo?: unknown) => pedir<T>('PUT', url, corpo),
  patch: <T>(url: string, corpo?: unknown) => pedir<T>('PATCH', url, corpo),
  del: <T>(url: string) => pedir<T>('DELETE', url),
  upload: <T>(url: string, fd: FormData) => pedir<T>('POST', url, fd),
};

/** Mensagem de erro amigavel a partir de qualquer throw. */
export function msgErro(e: unknown): string {
  return e instanceof Error ? e.message : 'Erro inesperado';
}
