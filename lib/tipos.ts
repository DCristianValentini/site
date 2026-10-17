/** Tipos das entidades do CMS (espelham as tabelas de database/migrations). */

export type Dados = Record<string, unknown>;

export interface Tema {
  cor_fundo: string;
  cor_superficie: string;
  cor_superficie_2: string;
  cor_texto: string;
  cor_texto_suave: string;
  cor_acento: string;
  cor_acento_texto: string;
  cor_acento_2: string;
  cor_linha: string;
  fonte_display: string;
  fonte_corpo: string;
  raio: string;
  largura: string;
  grao: number;
  grade: number;
}

export interface Identidade {
  nome: string;
  sigla: string;
  tagline: string;
  descricao: string;
  logo: string | null;
}

export interface Contato {
  email: string;
  telefone: string;
  whatsapp: string;
  endereco: string;
  cidade: string;
  horario: string;
  cnpj: string;
}

export interface Redes {
  instagram: string;
  linkedin: string;
  facebook: string;
  youtube: string;
  github: string;
}

export interface Seo {
  titulo: string;
  descricao: string;
  imagem: string | null;
}

export interface ItemNav {
  label: string;
  href: string;
}

export interface Nav {
  itens: ItemNav[];
  cta_texto: string;
  cta_url: string;
}

export interface ConfigSite {
  identidade: Identidade;
  contato: Contato;
  redes: Redes;
  seo: Seo;
  nav: Nav;
}

export interface Pagina {
  id: number;
  slug: string;
  titulo: string;
  seo_titulo: string | null;
  seo_descricao: string | null;
  seo_imagem: string | null;
  publicada: number;
  sistema: number;
  ordem: number;
}

export interface Bloco {
  id: number;
  pagina_id: number;
  tipo: string;
  dados: Dados;
  ordem: number;
  visivel: number;
}

export interface ProdutoRecurso {
  id: number;
  produto_id: number;
  titulo: string;
  descricao: string | null;
  icone: string | null;
  grupo: string | null;
  ordem: number;
}

export interface Produto {
  id: number;
  slug: string;
  nome: string;
  sigla: string | null;
  categoria: string | null;
  linha: string | null;
  area: string | null;
  como_acessa?: string | null;
  quem_usa?: string | null;
  exemplo?: string | null;
  passos?: { titulo: string; texto: string }[];
  integracoes?: { slug: string; texto: string }[];
  tagline: string | null;
  resumo: string | null;
  descricao: string | null;
  cor: string | null;
  imagem: string | null;
  plataformas: string | null;
  destaque: number;
  ativo: number;
  ordem: number;
  seo_titulo: string | null;
  seo_descricao: string | null;
  recursos?: ProdutoRecurso[];
}

export interface PlanoItem {
  id: number;
  plano_id: number;
  texto: string;
  incluso: number;
  ordem: number;
}

export interface Plano {
  id: number;
  nome: string;
  descricao: string | null;
  preco: string | null;
  periodo: string | null;
  observacao: string | null;
  cta_texto: string | null;
  cta_url: string | null;
  destaque: number;
  ativo: number;
  ordem: number;
  itens?: PlanoItem[];
}

export interface Midia {
  id: number;
  arquivo: string;
  nome: string;
  alt: string | null;
  largura: number | null;
  altura: number | null;
  bytes: number | null;
  criado_em: string;
}

export interface Lead {
  id: number;
  nome: string;
  email: string;
  telefone: string | null;
  empresa: string | null;
  interesse: string | null;
  mensagem: string | null;
  origem: string | null;
  lido: number;
  criado_em: string;
}
