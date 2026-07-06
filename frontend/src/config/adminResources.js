export const getAdminResources = (t) => ({
  badges: {
    resource: 'badges',
    titulo: t('admin.badges.titulo'),
    singular: t('admin.badges.singular'),
    colunas: [
      { key: 'nome', label: t('admin.generic.nome') },
      { key: 'nivel', label: t('admin.badges.campos.nivel') },
      { key: 'ponto', label: t('admin.badges.campos.pontos') },
    ],
    campos: [
      { key: 'nome', label: t('admin.generic.nome') },
      { key: 'nivel', label: t('admin.badges.campos.nivel') },
      { key: 'ponto', label: t('admin.badges.campos.pontos'), type: 'number' },
      { key: 'descricao', label: t('admin.generic.descricao'), type: 'textarea' },
    ],
  },
  'learning-paths': {
    resource: 'learning-paths',
    titulo: t('admin.learningPaths.titulo'),
    singular: t('admin.learningPaths.singular'),
    colunas: [
      { key: 'nome', label: t('admin.generic.nome') },
      { key: 'descricao', label: t('admin.generic.descricao') },
    ],
    campos: [
      { key: 'nome', label: t('admin.generic.nome') },
      { key: 'descricao', label: t('admin.generic.descricao'), type: 'textarea' },
    ],
  },
  policies: {
    resource: 'policies',
    titulo: t('admin.policies.titulo'),
    singular: t('admin.policies.singular'),
    colunas: [
      { key: 'titulo', label: t('admin.generic.titulo') },
      { key: 'versao', label: t('admin.policies.campos.versao') },
    ],
    campos: [
      { key: 'titulo', label: t('admin.generic.titulo') },
      { key: 'versao', label: t('admin.policies.campos.versao') },
      { key: 'descricao', label: t('admin.generic.descricao'), type: 'textarea' },
    ],
  },
  notices: {
    resource: 'notices',
    titulo: t('admin.notices.titulo'),
    singular: t('admin.notices.singular'),
    colunas: [
      { key: 'title', label: t('admin.generic.titulo') },
      { key: 'message', label: t('admin.generic.mensagem') },
    ],
    campos: [
      { key: 'title', label: t('admin.generic.titulo') },
      { key: 'message', label: t('admin.generic.mensagem'), type: 'textarea' },
    ],
  },
  information: {
    resource: 'information',
    titulo: t('admin.information.titulo'),
    singular: t('admin.information.singular'),
    colunas: [
      { key: 'titulo', label: t('admin.generic.titulo') },
      { key: 'mensagem', label: t('admin.generic.mensagem') },
    ],
    campos: [
      { key: 'titulo', label: t('admin.generic.titulo') },
      { key: 'mensagem', label: t('admin.generic.mensagem'), type: 'textarea' },
    ],
  },
  'service-lines': {
    resource: 'service-lines',
    titulo: t('admin.serviceLines.titulo'),
    singular: t('admin.serviceLines.singular'),
    colunas: [
      { key: 'nome', label: t('admin.generic.nome') },
      { key: 'descricao', label: t('admin.generic.descricao') },
    ],
    campos: [
      { key: 'nome', label: t('admin.generic.nome') },
      { key: 'descricao', label: t('admin.generic.descricao'), type: 'textarea' },
    ],
  },
  areas: {
    resource: 'areas',
    titulo: t('admin.areas.titulo'),
    singular: t('admin.areas.singular'),
    colunas: [
      { key: 'nome', label: t('admin.generic.nome') },
      { key: 'descricao', label: t('admin.generic.descricao') },
    ],
    campos: [
      { key: 'nome', label: t('admin.generic.nome') },
      { key: 'descricao', label: t('admin.generic.descricao'), type: 'textarea' },
    ],
  },
  levels: {
    resource: 'levels',
    titulo: t('admin.levels.titulo'),
    singular: t('admin.levels.singular'),
    colunas: [
      { key: 'codigo', label: t('admin.levels.campos.codigo') },
      { key: 'nome', label: t('admin.generic.nome') },
      { key: 'ordem', label: t('admin.levels.campos.ordem') },
    ],
    campos: [
      { key: 'codigo', label: t('admin.levels.campos.codigo') },
      { key: 'nome', label: t('admin.generic.nome') },
      { key: 'ordem', label: t('admin.levels.campos.ordem'), type: 'number' },
    ],
  },
  requirements: {
    resource: 'requirements',
    titulo: t('admin.requirements.titulo'),
    singular: t('admin.requirements.singular'),
    colunas: [
      { key: 'titulo', label: t('admin.generic.titulo') },
      { key: 'descricao', label: t('admin.generic.descricao') },
    ],
    campos: [
      { key: 'titulo', label: t('admin.generic.titulo') },
      { key: 'descricao', label: t('admin.generic.descricao'), type: 'textarea' },
    ],
  },
})