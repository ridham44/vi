'use strict';
module.exports = (sequelize, Sequelize) => {
    const MenuOrderTenant = sequelize.define(
        'MenuOrderTenant',
        {
            id: {
                type: Sequelize.UUID,
                primaryKey: true,
                allowNull: false,
                defaultValue: Sequelize.UUIDV4,
            },
            tenantId: {
                type: Sequelize.UUID,
                allowNull: false,
                association: {
                    model: 'Tenant',
                    key: 'id',
                    onUpdate: 'CASCADE',
                    onDelete: 'RESTRICT',
                    belongsToAlias: 'Tenant',
                    hasManyAlias: 'MenuOrderTenant',
                },
            },
            menuOrderId: {
                type: Sequelize.UUID,
                allowNull: false,
                association: {
                    model: 'MenuOrder',
                    key: 'id',
                    onUpdate: 'CASCADE',
                    onDelete: 'CASCADE',
                    belongsToAlias: 'MenuOrder',
                    hasManyAlias: 'MenuOrderTenant',
                },
            },
            level: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            forWhom: {
                type: Sequelize.ENUM('Tenant', 'Master', 'Both'),
                allowNull: false,
                defaultValue: 'Both',
            },
            status: {
                type: Sequelize.ENUM('0', '1'),
                allowNull: false,
                defaultValue: '1',
                comment: '0 for InActive, 1 for Active',
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
        },
        {
            tableName: 'menu_order_tenant',
        }
    );

    MenuOrderTenant.hasTenantCondition();

    return MenuOrderTenant;
};
