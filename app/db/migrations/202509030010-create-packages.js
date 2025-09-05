'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('packages', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      packagesName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      packagesDescription: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      packagesAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      noOfMonths:{
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      status: {
        type: Sequelize.ENUM('0', '1'),
        allowNull: false,
        defaultValue: '1',
        comment: '0=Inactive, 1=Active',
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        onUpdate: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('packages');
  },
};
