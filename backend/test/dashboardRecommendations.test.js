const assert = require('node:assert/strict');
const { test } = require('node:test');

// O controller importa os modelos Sequelize, mas este teste usa apenas a
// função pura exportada. Uma URL de ligação sintaticamente válida evita que o
// Sequelize falhe no carregamento, sem abrir uma ligação à BD.
process.env.DATABASE_URL ||= 'postgres://test:test@localhost:5432/test';

const { __private__ } = require('../src/controllers/dashboardController');

const badge = (ordem, areaId = 1) => ({ Level: { ordem, areaId } });
const award = (ordem, areaId = 1) => ({ Badge: badge(ordem, areaId) });

test('recomenda o nível seguinte ao nível mais alto concluído na área do consultor', () => {
  const result = __private__.planoDeProgressao({
    acquiredBadges: [award('A'), award('B')],
    badges: [badge('A'), badge('B'), badge('C'), badge('D')],
    areaId: 1
  });

  assert.deepEqual(result, { ultimoNivelConcluido: 'B', nivelAlvo: 'C' });
});

test('ignora badges concluídas noutra área ao decidir o próximo nível', () => {
  const result = __private__.planoDeProgressao({
    acquiredBadges: [award('C', 2), award('A', 1)],
    badges: [badge('A'), badge('B'), badge('C')],
    areaId: 1
  });

  assert.deepEqual(result, { ultimoNivelConcluido: 'A', nivelAlvo: 'B' });
});

test('recomenda o primeiro nível disponível quando o consultor ainda não conquistou badges', () => {
  const result = __private__.planoDeProgressao({
    acquiredBadges: [],
    badges: [badge('C'), badge('A'), badge('B')],
    areaId: 1
  });

  assert.deepEqual(result, { ultimoNivelConcluido: null, nivelAlvo: 'A' });
});
