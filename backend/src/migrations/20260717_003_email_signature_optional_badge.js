const { DataTypes } = require('sequelize');

const name = '20260717_003_email_signature_optional_badge';

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
