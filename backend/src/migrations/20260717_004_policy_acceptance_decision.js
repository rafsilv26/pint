const { DataTypes } = require('sequelize');

const name = '20260717_004_policy_acceptance_decision';

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
