const { DataTypes } = require('sequelize');

const name = '20260717_003_email_signature_optional_badge';

// Permite guardar uma assinatura de email SEM badge associada. Perfis que não
// são consultores (Service Line Leader, Talent Manager, Admin) não têm badges
// conquistadas, por isso a assinatura deles não pode depender de um badgeId.
const up = async ({ queryInterface, transaction }) => {
  await queryInterface.changeColumn(
    'EMAIL_ASSINATURA',
    'badgeId',
    { type: DataTypes.INTEGER, allowNull: true },
    { transaction }
  );
};

const down = async ({ queryInterface, transaction }) => {
  await queryInterface.changeColumn(
    'EMAIL_ASSINATURA',
    'badgeId',
    { type: DataTypes.INTEGER, allowNull: false },
    { transaction }
  );
};

module.exports = { name, up, down };
