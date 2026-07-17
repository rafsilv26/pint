const { DataTypes } = require('sequelize');

const name = '20260717_004_policy_acceptance_decision';

// Regista também a decisão de NÃO aceitar uma política não obrigatória. A
// tabela passa a guardar `accepted`: true = aceitou (compliance), false = viu
// e recusou. Em ambos os casos a política deixa de ser perguntada — mas só as
// aceites (true) contam para efeitos de conformidade/relatórios. Registos
// antigos são todos aceitações, por isso o default é true.
const up = async ({ queryInterface, transaction }) => {
  await queryInterface.addColumn(
    'ACEITACAO_POLITICA_RGPD',
    'accepted',
    { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    { transaction }
  );
};

const down = async ({ queryInterface, transaction }) => {
  await queryInterface.removeColumn('ACEITACAO_POLITICA_RGPD', 'accepted', { transaction });
};

module.exports = { name, up, down };
