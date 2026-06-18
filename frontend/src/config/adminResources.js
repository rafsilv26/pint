// Configuração dos recursos geridos pelo Admin (CRUD genérico via /catalog/:resource).
// Cada recurso define as colunas da tabela e os campos do formulário.
export const ADMIN_RESOURCES = {
  badges: {
    resource: 'badges',
    titulo: 'Badges',
    singular: 'Badge',
    colunas: [
      { key: 'nome', label: 'Nome' },
      { key: 'nivel', label: 'Nível' },
      { key: 'ponto', label: 'Pontos' },
    ],
    campos: [
      { key: 'nome', label: 'Nome' },
      { key: 'nivel', label: 'Nível' },
      { key: 'ponto', label: 'Pontos', type: 'number' },
      { key: 'descricao', label: 'Descrição', type: 'textarea' },
    ],
  },
  'learning-paths': {
    resource: 'learning-paths',
    titulo: 'Learning Paths',
    singular: 'Learning Path',
    colunas: [
      { key: 'nome', label: 'Nome' },
      { key: 'descricao', label: 'Descrição' },
    ],
    campos: [
      { key: 'nome', label: 'Nome' },
      { key: 'descricao', label: 'Descrição', type: 'textarea' },
    ],
  },
  policies: {
    resource: 'policies',
    titulo: 'Políticas RGPD',
    singular: 'Política',
    colunas: [
      { key: 'titulo', label: 'Título' },
      { key: 'versao', label: 'Versão' },
    ],
    campos: [
      { key: 'titulo', label: 'Título' },
      { key: 'versao', label: 'Versão' },
      { key: 'descricao', label: 'Descrição', type: 'textarea' },
    ],
  },
  notices: {
    resource: 'notices',
    titulo: 'Avisos',
    singular: 'Aviso',
    colunas: [
      { key: 'title', label: 'Título' },
      { key: 'message', label: 'Mensagem' },
    ],
    campos: [
      { key: 'title', label: 'Título' },
      { key: 'message', label: 'Mensagem', type: 'textarea' },
    ],
  },
  information: {
    resource: 'information',
    titulo: 'Informações',
    singular: 'Informação',
    colunas: [
      { key: 'titulo', label: 'Título' },
      { key: 'mensagem', label: 'Mensagem' },
    ],
    campos: [
      { key: 'titulo', label: 'Título' },
      { key: 'mensagem', label: 'Mensagem', type: 'textarea' },
    ],
  },
  'service-lines': {
    resource: 'service-lines',
    titulo: 'Service Lines',
    singular: 'Service Line',
    colunas: [
      { key: 'nome', label: 'Nome' },
      { key: 'descricao', label: 'Descrição' },
    ],
    campos: [
      { key: 'nome', label: 'Nome' },
      { key: 'descricao', label: 'Descrição', type: 'textarea' },
    ],
  },
  areas: {
    resource: 'areas',
    titulo: 'Áreas',
    singular: 'Área',
    colunas: [
      { key: 'nome', label: 'Nome' },
      { key: 'descricao', label: 'Descrição' },
    ],
    campos: [
      { key: 'nome', label: 'Nome' },
      { key: 'descricao', label: 'Descrição', type: 'textarea' },
    ],
  },
  levels: {
    resource: 'levels',
    titulo: 'Níveis',
    singular: 'Nível',
    colunas: [
      { key: 'codigo', label: 'Código' },
      { key: 'nome', label: 'Nome' },
      { key: 'ordem', label: 'Ordem' },
    ],
    campos: [
      { key: 'codigo', label: 'Código' },
      { key: 'nome', label: 'Nome' },
      { key: 'ordem', label: 'Ordem', type: 'number' },
    ],
  },
  requirements: {
    resource: 'requirements',
    titulo: 'Requisitos',
    singular: 'Requisito',
    colunas: [
      { key: 'titulo', label: 'Título' },
      { key: 'descricao', label: 'Descrição' },
    ],
    campos: [
      { key: 'titulo', label: 'Título' },
      { key: 'descricao', label: 'Descrição', type: 'textarea' },
    ],
  },
}
