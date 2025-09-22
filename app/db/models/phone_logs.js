'use strict';

module.exports = (sequelize, Sequelize) => {
    const PhoneLogs = sequelize.define(
        'PhoneLogs',
        {
            id: {
                type: Sequelize.UUID,
                primaryKey: true,
                allowNull: false,
                defaultValue: Sequelize.UUIDV4,
            },
            event: {
                type: Sequelize.ENUM('Create,Update,Delete'),
                allowNull: false,
            },
            phoneId: {
                type: Sequelize.UUID,
                allowNull: true,
                association: {
                    model: 'Phones',
                    key: 'id',
                    onUpdate: 'CASCADE',
                    onDelete: 'RESTRICT',
                    belongsToAlias: 'Phones',
                    hasManyAlias: 'PhoneLogs',
                },
            },
            ipAddress: {
                type: Sequelize.STRING(45),
                allowNull: false,
            },
            tenantId: {
                type: Sequelize.UUID,
                allowNull: true,
                association: {
                    model: 'Tenant',
                    key: 'id',
                    onUpdate: 'CASCADE',
                    onDelete: 'RESTRICT',
                    belongsToAlias: 'Tenant',
                    hasManyAlias: 'PhoneLogs',
                },
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
                onCreate: sequelize.literal('CURRENT_TIMESTAMP'),
            },
            updatedAt: {
                type: Sequelize.DATE,
                onUpdate: sequelize.literal('CURRENT_TIMESTAMP'),
            },
            deletedAt: {
                type: Sequelize.DATE,
            },
        },
        {
            tableName: 'phone_logs',
            customOptions: {
                createdBy: { value: true },
                updatedBy: { value: true },
                deletedBy: { value: true },
            },
        }
    );

    PhoneLogs.hasTenantCondition();
    return PhoneLogs;
};
