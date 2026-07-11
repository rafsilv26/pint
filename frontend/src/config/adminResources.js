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
      { key: 'title', label: t('admin.generic.titulo') },
      { key: 'message', label: t('admin.generic.mensagem') },
    ],
    campos: [
      { key: 'title', label: t('admin.generic.titulo') },
      { key: 'message', label: t('admin.generic.mensagem'), type: 'textarea' },
      { key: 'startDate', label: 'Data de início', type: 'date', optional: true },
      { key: 'endDate', label: 'Data de fim', type: 'date', optional: true },
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
      ],
    },
requirements: {
    resource: 'requirements',
    titulo: t('admin.requirements.titulo'),
    singular: t('admin.requirements.singular'),
    colunas: [
      { key: 'nivelId', label: t('admin.levels.singular') },
      { key: 'titulo', label: t('admin.generic.titulo') },
      { key: 'obrigatorio', label: 'Obrigatório' },
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
        { key: 'active', label: 'Ativo' },
      ],
      campos: [
        { key: 'title', label: t('admin.generic.titulo') },
        { key: 'version', label: 'Versão' },
        { key: 'description', label: t('admin.generic.descricao'), type: 'textarea' },
        { key: 'effectiveDate', label: 'Data de Eficácia', type: 'date' },
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