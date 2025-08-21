'use strict';
module.exports = (sequelize, Sequelize) => {
    const MenuOrder = sequelize.define(
        'MenuOrder',
        {
            id: {
                type: Sequelize.UUID,
                primaryKey: true,
                allowNull: false,
                defaultValue: Sequelize.UUIDV4,
            },
            name: {
                type: Sequelize.STRING(100),
                allowNull: false,
            },
            url: {
                type: Sequelize.STRING(150),
                allowNull: true,
            },
            icon: {
                type: Sequelize.STRING(100),
                allowNull: true,
            },
            subMenu: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            level: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            key: {
                type: Sequelize.STRING(100),
                allowNull: true,
            },
            parentId: {
                type: Sequelize.UUID,
                allowNull: true,
                association: {
                    model: 'MenuOrder',
                    key: 'id',
                    onUpdate: 'CASCADE',
                    onDelete: 'RESTRICT',
                    belongsToAlias: 'Parent',
                    hasManyAlias: 'MenuOrder',
                },
            },
            type: {
                type: Sequelize.ENUM('1', '2', '3'),
                allowNull: false,
                defaultValue: '1',
                comment: '1 for group, 2 for module, 3 for right',
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
            deletedAt: {
                type: Sequelize.DATE,
            },
        },
        {
            tableName: 'menu_order',
            customOptions: {
                createdBy: { value: true },
                updatedBy: { value: true },
                deletedBy: { value: true },
            },
        }
    );

    MenuOrder.hasTenantCondition(false);

    return MenuOrder;
};
