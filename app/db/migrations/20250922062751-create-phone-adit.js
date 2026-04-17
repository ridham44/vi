'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('phone_audit', {
            id: {
                type: Sequelize.UUID,
                allowNull: false,
                primaryKey: true,
                defaultValue: Sequelize.UUIDV4,
            },
            recordId: {
                type: Sequelize.UUID,
                allowNull: true,
                references: {
                    model: 'phone_logs',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT',
            },
            field: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            oldValue: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            newValue: {
                type: Sequelize.TEXT,
                allowNull: true,
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
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('phone_audit');
    },
};
