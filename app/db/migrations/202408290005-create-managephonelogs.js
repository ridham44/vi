'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('managePhoneLogs', {
            id: {
                type: Sequelize.UUID,
                allowNull: true,
                primaryKey: true,
                defaultValue: Sequelize.UUIDV4,
            },
            oldUserName: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            newUserName: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            oldDepartment: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            newDepartment: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            mobile: {
                type: Sequelize.STRING(20),
                allowNull: true,
            },
            tenantId: {
                type: Sequelize.UUID,
                allowNull: true,
                references: {
                    model: 'tenant',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT',
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: true,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
            deletedAt: {
                type: Sequelize.DATE,
                allowNull: true,
            },
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('managePhoneLogs');
    },
};
