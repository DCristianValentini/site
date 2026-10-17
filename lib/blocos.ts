/**
 * REGISTRO DOS TIPOS DE BLOCO — fonte unica de verdade do CMS.
 *
 * Cada tipo declara seus campos (`Campo[]`); o editor do /admin monta o
 * formulario a partir daqui (components/admin/campo-editor.tsx) e o site
 * renderiza com o componente correspondente (components/site/blocos/index.tsx).
 *
 * Para criar um bloco novo: adicione a entrada aqui + o componente no index dos
 * blocos. Nao precisa mexer em nenhuma API — os dados vao no JSON `blocos.dados`.
 */

export type CampoTipo =
  | 'texto'
  | 'textarea'
  | 'rich'
  | 'imagem'
  | 'cor'
  | 'bool'
  | 'select'
  | 'numero'
  | 'lista';

export interface Campo {
  chave: string;
  label: string;
  tipo: CampoTipo;
  ajuda?: string;
  opcoes?: { valor: string; label: string }[];
  /** Somente para tipo 'lista': os campos de cada item. */
  itemCampos?: Campo[];
  /** Rotulo do item na lista (ex.: "Recurso"). */
  itemLabel?: string;
  /** Ocupa a linha inteira no grid do editor. */
  largo?: boolean;
}

export interface TipoBloco {
  tipo: string;
  nome: string;
  descricao: string;
  campos: Campo[];
  padroes: Record<string, unknown>;
}

const cEyebrow: Campo = {
  chave: 'eyebrow',
  label: 'Etiqueta (texto pequeno acima do título)',
  tipo: 'texto',
};
const cTitulo: Campo = { chave: 'titulo', label: 'Título', tipo: 'texto', largo: true };
const cSubtitulo: Campo = { chave: 'subtitulo', label: 'Subtítulo', tipo: 'textarea', largo: true };

export const TIPOS_BLOCO: TipoBloco[] = [
  {
    tipo: 'hero',
    nome: 'Abertura (hero)',
    descricao: 'Primeira dobra: título grande, subtítulo, botões e selos de confiança.',
    campos: [
      cEyebrow,
      { chave: 'titulo', label: 'Título', tipo: 'textarea', largo: true, ajuda: 'Use [[palavra]] para destacar na cor de acento.' },
      { chave: 'subtitulo', label: 'Subtítulo', tipo: 'rich', largo: true },
      { chave: 'cta1_texto', label: 'Botão principal — texto', tipo: 'texto' },
      { chave: 'cta1_url', label: 'Botão principal — link', tipo: 'texto' },
      { chave: 'cta2_texto', label: 'Botão secundário — texto', tipo: 'texto' },
      { chave: 'cta2_url', label: 'Botão secundário — link', tipo: 'texto' },
      { chave: 'imagem', label: 'Imagem/print do produto', tipo: 'imagem', largo: true },
      {
        chave: 'selos',
        label: 'Selos de confiança',
        tipo: 'lista',
        itemLabel: 'Selo',
        largo: true,
        itemCampos: [{ chave: 'texto', label: 'Texto', tipo: 'texto' }],
      },
    ],
    padroes: {
      eyebrow: 'SOFTWARE DE GESTÃO',
      titulo: 'Sistemas que [[cabem]] na sua operação',
      subtitulo: '<p>Descreva aqui o que a empresa faz.</p>',
      cta1_texto: 'Falar com especialista',
      cta1_url: '/contato',
      cta2_texto: 'Ver produtos',
      cta2_url: '/produtos',
      selos: [],
    },
  },
  {
    tipo: 'recursos',
    nome: 'Diferenciais (grade)',
    descricao: 'Grade de cards curtos — bom para diferenciais e benefícios.',
    campos: [
      cEyebrow,
      cTitulo,
      cSubtitulo,
      {
        chave: 'colunas',
        label: 'Colunas',
        tipo: 'select',
        opcoes: [
          { valor: '2', label: '2 colunas' },
          { valor: '3', label: '3 colunas' },
          { valor: '4', label: '4 colunas' },
        ],
      },
      {
        chave: 'itens',
        label: 'Cards',
        tipo: 'lista',
        itemLabel: 'Card',
        largo: true,
        itemCampos: [
          { chave: 'titulo', label: 'Título', tipo: 'texto' },
          { chave: 'descricao', label: 'Descrição', tipo: 'textarea' },
          {
            chave: 'icone',
            label: 'Ícone',
            tipo: 'select',
            opcoes: [
              { valor: 'layers', label: 'Camadas' },
              { valor: 'shield', label: 'Escudo' },
              { valor: 'zap', label: 'Raio' },
              { valor: 'wifi-off', label: 'Offline' },
              { valor: 'smartphone', label: 'Celular' },
              { valor: 'server', label: 'Servidor' },
              { valor: 'file-text', label: 'Documento' },
              { valor: 'users', label: 'Pessoas' },
              { valor: 'settings', label: 'Engrenagem' },
              { valor: 'trending-up', label: 'Gráfico' },
              { valor: 'lock', label: 'Cadeado' },
              { valor: 'headphones', label: 'Suporte' },
            ],
          },
        ],
      },
    ],
    padroes: { colunas: '3', itens: [] },
  },
  {
    tipo: 'produtos',
    nome: 'Lista de produtos',
    descricao: 'Puxa os produtos do cadastro (/admin/produtos). Índice editorial ou cards.',
    campos: [
      cEyebrow,
      cTitulo,
      cSubtitulo,
      {
        chave: 'estilo',
        label: 'Estilo',
        tipo: 'select',
        opcoes: [
          { valor: 'indice', label: 'Índice numerado (lista)' },
          { valor: 'cards', label: 'Cards' },
        ],
      },
      { chave: 'so_destaques', label: 'Mostrar só os produtos em destaque', tipo: 'bool' },
      { chave: 'limite', label: 'Máximo de produtos (0 = todos)', tipo: 'numero' },
    ],
    padroes: { estilo: 'indice', so_destaques: false, limite: 0 },
  },
  {
    tipo: 'numeros',
    nome: 'Números',
    descricao: 'Faixa com métricas em destaque.',
    campos: [
      cEyebrow,
      cTitulo,
      {
        chave: 'itens',
        label: 'Métricas',
        tipo: 'lista',
        itemLabel: 'Métrica',
        largo: true,
        itemCampos: [
          { chave: 'valor', label: 'Valor (ex.: 12, 99,9%)', tipo: 'texto' },
          { chave: 'rotulo', label: 'Rótulo', tipo: 'texto' },
          { chave: 'detalhe', label: 'Detalhe', tipo: 'texto' },
        ],
      },
    ],
    padroes: { itens: [] },
  },
  {
    tipo: 'texto',
    nome: 'Texto rico (com imagem)',
    descricao: 'Bloco livre de conteúdo formatado, com imagem opcional ao lado.',
    campos: [
      cEyebrow,
      cTitulo,
      { chave: 'conteudo', label: 'Conteúdo', tipo: 'rich', largo: true },
      { chave: 'imagem', label: 'Imagem', tipo: 'imagem' },
      {
        chave: 'posicao_imagem',
        label: 'Posição da imagem',
        tipo: 'select',
        opcoes: [
          { valor: 'direita', label: 'À direita' },
          { valor: 'esquerda', label: 'À esquerda' },
          { valor: 'nenhuma', label: 'Sem imagem' },
        ],
      },
    ],
    padroes: { posicao_imagem: 'direita', conteudo: '' },
  },
  {
    tipo: 'linha_tempo',
    nome: 'Linha do tempo',
    descricao: 'Trajetória da empresa em marcos — ideal para a página Sobre.',
    campos: [
      cEyebrow,
      cTitulo,
      cSubtitulo,
      {
        chave: 'itens',
        label: 'Marcos',
        tipo: 'lista',
        itemLabel: 'Marco',
        largo: true,
        itemCampos: [
          { chave: 'ano', label: 'Ano / período', tipo: 'texto' },
          { chave: 'titulo', label: 'Título', tipo: 'texto' },
          { chave: 'descricao', label: 'Descrição', tipo: 'textarea' },
        ],
      },
    ],
    padroes: { itens: [] },
  },
  {
    tipo: 'depoimentos',
    nome: 'Depoimentos',
    descricao: 'Citações de clientes.',
    campos: [
      cEyebrow,
      cTitulo,
      {
        chave: 'itens',
        label: 'Depoimentos',
        tipo: 'lista',
        itemLabel: 'Depoimento',
        largo: true,
        itemCampos: [
          { chave: 'texto', label: 'Depoimento', tipo: 'textarea' },
          { chave: 'autor', label: 'Nome', tipo: 'texto' },
          { chave: 'cargo', label: 'Cargo', tipo: 'texto' },
          { chave: 'empresa', label: 'Empresa', tipo: 'texto' },
          { chave: 'foto', label: 'Foto', tipo: 'imagem' },
        ],
      },
    ],
    padroes: { itens: [] },
  },
  {
    tipo: 'planos',
    nome: 'Planos',
    descricao: 'Puxa os planos do cadastro (/admin/planos).',
    campos: [
      cEyebrow,
      cTitulo,
      cSubtitulo,
      { chave: 'nota', label: 'Observação abaixo dos planos', tipo: 'textarea', largo: true },
    ],
    padroes: {},
  },
  {
    tipo: 'faq',
    nome: 'Perguntas frequentes',
    descricao: 'Acordeão de dúvidas.',
    campos: [
      cEyebrow,
      cTitulo,
      cSubtitulo,
      {
        chave: 'itens',
        label: 'Perguntas',
        tipo: 'lista',
        itemLabel: 'Pergunta',
        largo: true,
        itemCampos: [
          { chave: 'pergunta', label: 'Pergunta', tipo: 'texto' },
          { chave: 'resposta', label: 'Resposta', tipo: 'rich' },
        ],
      },
    ],
    padroes: { itens: [] },
  },
  {
    tipo: 'logos',
    nome: 'Faixa de logos',
    descricao: 'Logos de clientes/parceiros ou tecnologias.',
    campos: [
      { chave: 'titulo', label: 'Título', tipo: 'texto', largo: true },
      {
        chave: 'itens',
        label: 'Logos',
        tipo: 'lista',
        itemLabel: 'Logo',
        largo: true,
        itemCampos: [
          { chave: 'nome', label: 'Nome', tipo: 'texto' },
          { chave: 'imagem', label: 'Imagem', tipo: 'imagem' },
        ],
      },
    ],
    padroes: { itens: [] },
  },
  {
    tipo: 'cta',
    nome: 'Chamada para ação',
    descricao: 'Faixa de conversão com botão.',
    campos: [
      cTitulo,
      cSubtitulo,
      { chave: 'cta_texto', label: 'Botão — texto', tipo: 'texto' },
      { chave: 'cta_url', label: 'Botão — link', tipo: 'texto' },
      {
        chave: 'estilo',
        label: 'Estilo',
        tipo: 'select',
        opcoes: [
          { valor: 'acento', label: 'Faixa na cor de acento' },
          { valor: 'escuro', label: 'Faixa escura com contorno' },
        ],
      },
    ],
    padroes: { estilo: 'acento', cta_texto: 'Falar com especialista', cta_url: '/contato' },
  },
  {
    tipo: 'contato',
    nome: 'Contato (formulário + dados)',
    descricao: 'Formulário que grava em Mensagens (/admin/leads) + dados de contato.',
    campos: [
      cEyebrow,
      cTitulo,
      cSubtitulo,
      { chave: 'mostrar_form', label: 'Mostrar formulário', tipo: 'bool' },
      { chave: 'mostrar_dados', label: 'Mostrar dados de contato', tipo: 'bool' },
      { chave: 'aviso_sucesso', label: 'Mensagem após enviar', tipo: 'texto', largo: true },
    ],
    padroes: {
      mostrar_form: true,
      mostrar_dados: true,
      aviso_sucesso: 'Recebemos sua mensagem. Retornamos em até 1 dia útil.',
    },
  },
];

export function tipoBloco(tipo: string): TipoBloco | undefined {
  return TIPOS_BLOCO.find((t) => t.tipo === tipo);
}

/** Campos do tipo 'rich' de um bloco — o que precisa passar pelo sanitizador. */
export function camposRich(tipo: string): { chave: string; dentroDeLista?: string }[] {
  const t = tipoBloco(tipo);
  if (!t) return [];
  const out: { chave: string; dentroDeLista?: string }[] = [];
  for (const c of t.campos) {
    if (c.tipo === 'rich') out.push({ chave: c.chave });
    if (c.tipo === 'lista' && c.itemCampos) {
      for (const ic of c.itemCampos) {
        if (ic.tipo === 'rich') out.push({ chave: ic.chave, dentroDeLista: c.chave });
      }
    }
  }
  return out;
}
