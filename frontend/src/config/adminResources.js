export const getAdminResources = (t) => ({
  badges: {
    resource: 'badges',
    titulo: t('admin.badges.titulo'),
    singular: t('admin.badges.singular'),
    colunas: [
      { key: 'nome', label: t('admin.generic.nome') },
      { key: 'nivelId', label: t('admin.badges.campos.nivel') },
      { key: 'tipo', label: 'Tipo' },
      { key: 'fornecedor', label: 'Fornecedor' },
      { key: 'ponto', label: t('admin.badges.campos.pontos') },
      { key: 'ativo', label: 'Ativo' },
    ],
    campos: [
      { key: 'nome', label: t('admin.generic.nome') },
      // Dropdown para o nível (mostra "Nome do Nível (Área)", tal como em Requisitos).
      {
        key: 'nivelId',
        label: t('admin.badges.campos.nivel'),
        type: 'select',
        optionsResource: 'levels',
        optionLabel: (item, areasMap) => {
          const nomeArea = areasMap[item.areaId] || 'Área Desconhecida';
          return `${item.nome || 'Nível'} (${nomeArea})`;
        }
      },
      { key: 'descricao', label: t('admin.generic.descricao'), type: 'textarea' },
      { key: 'tipo', label: 'Tipo (Certificação, Formação, Conquista...)', optional: true },
      { key: 'fornecedor', label: 'Fornecedor (ex: AWS, Microsoft...)', optional: true },
      { key: 'ponto', label: t('admin.badges.campos.pontos'), type: 'number' },
      { key: 'custoEstimado', label: 'Custo Estimado (€)', type: 'number', optional: true },
      { key: 'duracaoMeses', label: 'Duração até Expirar (meses)', type: 'number', optional: true },
      { key: 'expiracao', label: 'Data Absoluta de Expiração', type: 'date', optional: true },
      { key: 'imagem', label: 'URL da Imagem/Ícone', optional: true },
      { key: 'slug', label: 'Slug (identificador público)', optional: true },
      {
        key: 'ativo',
        label: 'Está ativo?',
        type: 'select',
        options: [{ value: true, label: 'Sim' }, { value: false, label: 'Não' }],
        optional: true,
      },
    ],
  },
  'badge-premium': {
    resource: 'badge-premium',
    titulo: t('admin.badgePremium.titulo'),
    singular: t('admin.badgePremium.singular'),
    colunas: [
      { key: 'name', label: t('admin.generic.nome') },
      { key: 'icon', label: 'Ícone' },
      { key: 'active', label: 'Ativo' },
    ],
    campos: [
      { key: 'name', label: t('admin.generic.nome') },
      { key: 'description', label: t('admin.generic.descricao'), type: 'textarea', optional: true },
      { key: 'icon', label: 'Ícone', optional: true },
      { key: 'criteriaDescription', label: 'Critério de Atribuição', type: 'textarea', optional: true },
      {
        key: 'active',
        label: 'Está ativo?',
        type: 'select',
        options: [{ value: true, label: 'Sim' }, { value: false, label: 'Não' }],
        optional: true,
      },
    ],
  },
  'learning-paths': {
    resource: 'learning-paths',
    titulo: t('admin.learningPaths.titulo'),
    singular: t('admin.learningPaths.singular'),
    colunas: [
      { key: 'nome', label: t('admin.generic.nome') },
      { key: 'descricao', label: t('admin.generic.descricao') },
      { key: 'ativo', label: 'Ativo' },
    ],
    campos: [
      { key: 'nome', label: t('admin.generic.nome') },
      { key: 'descricao', label: t('admin.generic.descricao'), type: 'textarea' },
      {
        key: 'ativo',
        label: 'Está ativo?',
        type: 'select',
        options: [{ value: true, label: 'Sim' }, { value: false, label: 'Não' }],
        optional: true,
      },
    ],
  },
  notices: {
    resource: 'notices',
    titulo: t('admin.notices.titulo'),
    singular: t('admin.notices.singular'),
    colunas: [
      { key: 'userId', label: t('admin.notices.destinatario') },
      { key: 'title', label: t('admin.generic.titulo') },
      { key: 'message', label: t('admin.generic.mensagem') },
      { key: 'type', label: t('admin.generic.tipo') },
      { key: 'read', label: t('admin.generic.lida') },
      { key: 'createdAt', label: t('admin.generic.data'), type: 'date' },
    ],
    campos: [
      {
        key: 'userId',
        label: t('admin.notices.destinatario'),
        type: 'select',
        optionsLoader: 'consultores',
        allOption: t('admin.notices.todosConsultores'),
        optional: true,
      },
      { key: 'title', label: t('admin.generic.titulo') },
      { key: 'message', label: t('admin.generic.mensagem'), type: 'textarea' },
      {
        key: 'type',
        label: t('admin.generic.tipo'),
        type: 'select',
        options: [
          { value: 'info', label: 'Informação' },
          { value: 'warning', label: 'Aviso' },
          { value: 'success', label: 'Sucesso' },
          { value: 'error', label: 'Erro' },
        ],
        optional: true,
      },
    ],
  },
  information: {
    resource: 'information',
    titulo: t('admin.information.titulo'),
    singular: t('admin.information.singular'),
    colunas: [
      { key: 'title', label: t('admin.generic.titulo') },
      { key: 'message', label: t('admin.generic.mensagem') },
      { key: 'type', label: t('admin.generic.tipo') },
      { key: 'active', label: t('admin.generic.ativo') },
      { key: 'startDate', label: t('admin.generic.dataInicio'), type: 'date' },
      { key: 'endDate', label: t('admin.generic.dataFim'), type: 'date' },
    ],
    campos: [
      { key: 'title', label: t('admin.generic.titulo') },
      { key: 'message', label: t('admin.generic.mensagem'), type: 'textarea' },
      { key: 'type', label: t('admin.generic.tipo'), optional: true },
      { key: 'startDate', label: t('admin.generic.dataInicio'), type: 'date', optional: true },
      { key: 'endDate', label: t('admin.generic.dataFim'), type: 'date', optional: true },
      {
        key: 'active',
        label: t('admin.generic.ativo'),
        type: 'select',
        options: [{ value: true, label: 'Sim' }, { value: false, label: 'Não' }],
        optional: true,
      },
    ],
  },
  'service-lines': {
    resource: 'service-lines',
    titulo: t('admin.serviceLines.titulo'),
    singular: t('admin.serviceLines.singular'),
    colunas: [
      { key: 'nome', label: t('admin.generic.nome') },
      { key: 'learningPathId', label: t('admin.learningPaths.singular') }, // Adicionado à tabela
      { key: 'descricao', label: t('admin.generic.descricao') },
      { key: 'ativo', label: 'Ativo' },
    ],
    campos: [
      { key: 'nome', label: t('admin.generic.nome') },

      // AQUI ESTÁ A MAGIA DO DROPDOWN:
      {
        key: 'learningPathId',
        label: t('admin.learningPaths.singular'),
        type: 'select',
        optionsResource: 'learning-paths' // Liga diretamente à API dos learning-paths
      },

      { key: 'descricao', label: t('admin.generic.descricao'), type: 'textarea', optional: true },
      {
        key: 'ativo',
        label: 'Está ativo?',
        type: 'select',
        options: [{ value: true, label: 'Sim' }, { value: false, label: 'Não' }],
        optional: true,
      },
    ],
  },
  areas: {
      resource: 'areas',
      titulo: t('admin.areas.titulo'),
      singular: t('admin.areas.singular'),
      colunas: [
        { key: 'nome', label: t('admin.generic.nome') },
        // Opcional: Adicionar a coluna para veres o ID na tabela
        { key: 'serviceLineId', label: t('admin.serviceLines.singular') },
        { key: 'descricao', label: t('admin.generic.descricao') },
        { key: 'ativo', label: 'Ativo' },
      ],
      campos: [
        { key: 'nome', label: t('admin.generic.nome') },

        // O NOVO DROPDOWN PARA A SERVICE LINE:
        {
          key: 'serviceLineId',
          label: t('admin.serviceLines.singular'),
          type: 'select',
          optionsResource: 'service-lines' // Vai buscar a lista à API das service lines
        },

        { key: 'descricao', label: t('admin.generic.descricao'), type: 'textarea', optional: true },
        {
          key: 'ativo',
          label: 'Está ativo?',
          type: 'select',
          options: [{ value: true, label: 'Sim' }, { value: false, label: 'Não' }],
          optional: true,
        },
      ],
    },
  levels: {
      resource: 'levels',
      titulo: t('admin.levels.titulo'),
      singular: t('admin.levels.singular'),
      colunas: [
        { key: 'areaId', label: t('admin.areas.singular') }, // Adicionado para veres a Área na tabela
        { key: 'nome', label: t('admin.generic.nome') },
        { key: 'ordem', label: t('admin.levels.campos.ordem') },
        { key: 'ativo', label: 'Ativo' },
      ],
      campos: [
        // 1. O Dropdown mágico para a Área
        {
          key: 'areaId',
          label: t('admin.areas.singular'),
          type: 'select',
          optionsResource: 'areas'
        },

        { key: 'nome', label: t('admin.generic.nome'), optional: true },

        // Como na BD é CHAR(1) (ex: 'A', 'B', 'C'), tirei o type: 'number' para permitir letras
        { key: 'ordem', label: t('admin.levels.campos.ordem') },
        {
          key: 'ativo',
          label: 'Está ativo?',
          type: 'select',
          options: [{ value: true, label: 'Sim' }, { value: false, label: 'Não' }],
          optional: true,
        },
      ],
    },
requirements: {
    resource: 'requirements',
    titulo: t('admin.requirements.titulo'),
    singular: t('admin.requirements.singular'),
    colunas: [
      { key: 'nivelId', label: t('admin.levels.singular') },
      { key: 'titulo', label: t('admin.generic.titulo') },
      { key: 'icone', label: 'Ícone' },
      { key: 'obrigatorio', label: 'Obrigatório' },
      { key: 'ordem', label: 'Ordem' },
    ],
    campos: [
      {
        key: 'nivelId',
        label: t('admin.levels.singular'),
        type: 'select',
        optionsResource: 'levels',
        // Usa o mapa de áreas injetado pelo componente para mostrar "Nome da Área"
        optionLabel: (item, areasMap) => {
          const nomeArea = areasMap[item.areaId] || 'Área Desconhecida';
          return `${item.nome || 'Nível'} (${nomeArea})`;
        }
      },

      { key: 'titulo', label: t('admin.generic.titulo') },
      { key: 'descricao', label: t('admin.generic.descricao'), type: 'textarea', optional: true },
      { key: 'icone', label: 'Ícone', optional: true },

      {
        key: 'obrigatorio',
        label: 'Obrigatório?',
        type: 'select',
        options: [
          { value: true, label: 'Sim' },
          { value: false, label: 'Não' }
        ],
        optional: true
      },
      { key: 'ordem', label: 'Ordem', type: 'number', optional: true },
    ],
  },
  policies: {
      resource: 'policies',
      titulo: t('admin.policies.titulo'),
      singular: t('admin.policies.singular'),
      colunas: [
        { key: 'policyId', label: 'ID' }, // Adicionado para veres o ID
        { key: 'title', label: t('admin.generic.titulo') },
        { key: 'version', label: 'Versão' },
        { key: 'effectiveDate', label: 'Data de Eficácia' },
        { key: 'expirationDate', label: 'Data de Expiração' },
        { key: 'active', label: 'Ativo' },
        { key: 'mandatory', label: 'Obrigatório' },
      ],
      campos: [
        { key: 'title', label: t('admin.generic.titulo') },
        { key: 'version', label: 'Versão' },
        { key: 'description', label: t('admin.generic.descricao'), type: 'textarea' },
        { key: 'effectiveDate', label: 'Data de Eficácia', type: 'date' },
        { key: 'expirationDate', label: 'Data de Expiração', type: 'date', optional: true },
        {
          key: 'active',
          label: 'Está Ativo?',
          type: 'select',
          options: [{value: true, label: 'Sim'}, {value: false, label: 'Não'}]
        },
        {
          key: 'mandatory',
          label: 'É Obrigatório?',
          type: 'select',
          options: [{value: true, label: 'Sim'}, {value: false, label: 'Não'}]
        }
      ],
    },
});