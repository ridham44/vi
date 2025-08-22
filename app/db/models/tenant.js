'use strict';
module.exports = (sequelize, Sequelize) => {
    const Tenant = sequelize.define(
        'Tenant',
        {
            id: {
                type: Sequelize.UUID,
                primaryKey: true,
                allowNull: false,
                defaultValue: Sequelize.UUIDV4,
            },
            companyId: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            companyName: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            subDomain: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            mycoBackendUrl: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            frontendUrl: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            // mobileRegex: {
            //     type: Sequelize.STRING,
            //     allowNull: true,
            // },
            // isOTPEnable: {
            //     type: Sequelize.ENUM('0', '1'),
            //     allowNull: true,
            //     defaultValue: '1',
            //     comment: '0 for disable, 1 for enable',
            // },
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
            tableName: 'tenant',
        }
    );

    Tenant.hasTenantCondition(false);

    return Tenant;
};
