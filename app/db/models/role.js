'use strict';
module.exports = (sequelize, Sequelize) => {
    const Role = sequelize.define(
        'Role',
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
      
            isMasterAdmin: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
                allowNull: false,
            },
       
            description: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            status: {
                type: Sequelize.ENUM('1', '0'),
                allowNull: false,
                defaultValue: '1',
                comment: '0 for InActive, 1 for Active',
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
            tableName: 'role',
            // customOptions: {
            //     createdBy: { value: true },
            //     updatedBy: { value: true },
            //     deletedBy: { value: true },
            // },
            defaultScope: {
                where: {
                    deletedAt: null,
                },
            },
            scopes: {
                withDeleted: {
                    where: {},
                },
            },
        }
    );

    Role.hasTenantCondition();

    return Role;
};
