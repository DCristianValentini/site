// Faz o `node --test` resolver imports sem extensao ("./sanitize") e o alias "@/" do tsconfig, como o
// Next faz. So para testes: o codigo-fonte continua no estilo do Next.
import { register } from 'node:module';
register('./resolver-hooks.mjs', import.meta.url);
