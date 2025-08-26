'use strict';
module.exports = (sequelize, Sequelize) => {
    const MenuOrderRole = sequelize.define(
        'MenuOrderRole',
        {
            id: {
                type: Sequelize.UUID,
                primaryKey: true,
                allowNull: false,
                defaultValue: Sequelize.UUIDV4,
            },
            roleId: {
                type: Sequelize.UUID,
                allowNull: false,
                association: {
                    model: 'Role',
                    key: 'id',
                    onUpdate: 'CASCADE',
                    onDelete: 'RESTRICT',
                    belongsToAlias: 'Role',
                    hasManyAlias: 'MenuOrderRole',
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
                    hasManyAlias: 'MenuOrderRole',
                },
            },
            level: {
                type: Sequelize.INTEGER,
                allowNull: true,
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
            tableName: 'menu_order_role',
        }
    );


    return MenuOrderRole;
};
