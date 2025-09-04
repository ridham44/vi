'use strict';

module.exports = (sequelize, Sequelize) => {
    const Phones = sequelize.define(
        'Phones',
        {
            id: {
                type: Sequelize.UUID,
                primaryKey: true,
                allowNull: false,
                defaultValue: Sequelize.UUIDV4,
            },
            name: {
                type: Sequelize.STRING(36),
                allowNull: false,
            },
            number: {
                type: Sequelize.STRING(36),
                allowNull: false,
            },
            departmentId: {
                type: Sequelize.UUID,
                allowNull: true,
                association: {
                    model: 'Department',
                    key: 'id',
                    onUpdate: 'CASCADE',
                    onDelete: 'RESTRICT',
                    belongsToAlias: 'Department',
                    hasManyAlias: 'Phones',
                },
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
                    hasManyAlias: 'Phones',
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
            tableName: 'phones',
        }
    );

    Phones.hasTenantCondition();
    return Phones;
};
