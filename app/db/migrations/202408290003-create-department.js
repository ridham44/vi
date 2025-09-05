'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('department', {
            id: {
                type: Sequelize.UUID,
                allowNull: true,
                primaryKey: true,
                defaultValue: Sequelize.UUIDV4,
            },
            name: {
                type: Sequelize.STRING(36),
                allowNull: true,
            },
            description: {
                type: Sequelize.STRING(100),
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
        await queryInterface.dropTable('department');
    },
};
