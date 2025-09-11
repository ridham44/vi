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
            companyName: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            address: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            phone: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            countryCode: {
                type: Sequelize.STRING(10),
                allowNull: true,
                comment: 'Country dialing code like +91, +1',
            },
            email: {
                type: Sequelize.STRING,
                allowNull: false,
                unique: true,
            },
            status: {
                type: Sequelize.ENUM('0', '1'),
                allowNull: false,
                defaultValue: '1',
                comment: '0=Inactive, 1=Active',
            },
            remarks: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            mobileNoLimit: {
                type: Sequelize.INTEGER,
                allowNull: true,
                defaultValue: 0,
            },
            isoCode: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            packagesId: {
                type: Sequelize.UUID,
                allowNull: true,
                association: {
                    model: 'Packages',
                    key: 'id',
                    onUpdate: 'CASCADE',
                    onDelete: 'RESTRICT',
                    belongsToAlias: 'packages',
                    hasManyAlias: 'Tenants',
                },
            },
            packagesStartDate: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            packagesEndDate: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            trialDays: {
                type: Sequelize.INTEGER,
                allowNull: true,
                defaultValue: 0,
                comment: 'Number of trial days',
            },
            lastRenewDate: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            amount: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: true,
                defaultValue: 0.0,
            },
            paymentStatus: {
                type: Sequelize.ENUM('0', '1'),
                allowNull: true,
                defaultValue: '1',
                comment: '0=Unpaid, 1=Paid',
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
            tableName: 'tenant',
        }
    );

    Tenant.hasTenantCondition(false);

    return Tenant;
};
