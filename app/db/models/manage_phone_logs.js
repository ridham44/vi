'use strict';

module.exports = (sequelize, Sequelize) => {
    const ManagePhoneLogin = sequelize.define(
        'ManagePhoneLogs',
        {
            id: {
                type: Sequelize.UUID,
                primaryKey: true,
                allowNull: true,
                defaultValue: Sequelize.UUIDV4,
            },
            oldUserName: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            newUserName: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            oldDepartment: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            newDepartment: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            mobile: {
                type: Sequelize.STRING(20),
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
                    hasManyAlias: 'ManagePhoneLog',
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
            tableName: 'managePhoneLogs',
        }
    );
    ManagePhoneLogin.hasTenantCondition();
    return ManagePhoneLogin;
};
