'use strict';

module.exports = (sequelize, Sequelize) => {
    const Department = sequelize.define(
        'Department',
        {
            id: {
                type: Sequelize.UUID,
                primaryKey: true,
                allowNull: true,
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
                association: {
                    model: 'Tenant',
                    key: 'id',
                    onUpdate: 'CASCADE',
                    onDelete: 'RESTRICT',
                    belongsToAlias: 'Tenant',
                    hasManyAlias: 'Department',
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
            tableName: 'department',
        }
    );

    Department.hasTenantCondition();
    return Department;
};
