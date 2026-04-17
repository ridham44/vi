'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('phone_logs', {
            id: {
                type: Sequelize.UUID,
                allowNull: false,
                primaryKey: true,
                defaultValue: Sequelize.UUIDV4,
            },
            event: {
                type: Sequelize.ENUM('Create', 'Update', 'Delete'),
                allowNull: false,
            },
            phoneId: {
                type: Sequelize.UUID,
                allowNull: true,
                references: {
                    model: 'phones',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT',
            },
            ipAddress: {
                type: Sequelize.STRING(45),
                allowNull: false,
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
                onUpdate: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
            deletedAt: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            createdBy: {
                type: Sequelize.UUID,
                references: {
                    model: 'user',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL',
            },
            updatedBy: {
                type: Sequelize.UUID,
                references: {
                    model: 'user',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL',
            },
            deletedBy: {
                type: Sequelize.UUID,
                references: {
                    model: 'user',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL',
            },
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('phone_logs');
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_phone_logs_event";');
    },
};
