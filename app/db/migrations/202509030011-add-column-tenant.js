'use strict';
module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Modify companyName to not allow null
        await queryInterface.changeColumn('tenant', 'companyName', {
            type: Sequelize.STRING,
            allowNull: false,
        });

        // Add new columns
        await queryInterface.addColumn('tenant', 'address', {
            type: Sequelize.STRING(255),
            allowNull: false,
        });
        await queryInterface.addColumn('tenant', 'phone', {
            type: Sequelize.STRING(15),
            allowNull: false,
        });
        await queryInterface.addColumn('tenant', 'email', {
            type: Sequelize.STRING(100),
            allowNull: false,
            unique: true,
        });
        await queryInterface.addColumn('tenant', 'status', {
            type: Sequelize.ENUM('0', '1'),
            allowNull: false,
            defaultValue: '1',
            comment: '0=Inactive, 1=Active',
        });
        await queryInterface.addColumn('tenant', 'remarks', {
            type: Sequelize.STRING,
            allowNull: true,
        });
        await queryInterface.addColumn('tenant', 'mobileNoLimit', {
            type: Sequelize.INTEGER,
            allowNull: true,
            defaultValue: 0,
            comment: '0=Unlimited, >0=Limit',
        });
        await queryInterface.addColumn('tenant', 'packagesId', {
            type: Sequelize.UUID,
            allowNull: true,
            references: {
                model: 'packages',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT',
        });
        await queryInterface.addColumn('tenant', 'packagesStartDate', {
            type: Sequelize.DATE,
            allowNull: true,
        });
        await queryInterface.addColumn('tenant', 'packagesEndDate', {
            type: Sequelize.DATE,
            allowNull: true,
        });
        await queryInterface.addColumn('tenant', 'trialDays', {
            type: Sequelize.INTEGER,
            allowNull: true,
            defaultValue: 0,
            comment: 'Number of trial days',
        });
        await queryInterface.addColumn('tenant', 'lastRenewDate', {
            type: Sequelize.DATE,
            allowNull: true,
        });
        await queryInterface.addColumn('tenant', 'amount', {
            type: Sequelize.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: 0.00,
        });
        await queryInterface.addColumn('tenant', 'paymentStatus', {
            type: Sequelize.ENUM('0', '1'),
            allowNull: true,
            defaultValue: '1',
            comment: '0=Pending, 1=Paid',
        });
    },

    down: async (queryInterface, Sequelize) => {
        // Remove new columns
        await queryInterface.removeColumn('tenant', 'address');
        await queryInterface.removeColumn('tenant', 'phone');
        await queryInterface.removeColumn('tenant', 'email');
        await queryInterface.removeColumn('tenant', 'status');
        await queryInterface.removeColumn('tenant', 'remarks');
        await queryInterface.removeColumn('tenant', 'mobileNoLimit');
        await queryInterface.removeColumn('tenant', 'packagesId');
        await queryInterface.removeColumn('tenant', 'packagesStartDate');
        await queryInterface.removeColumn('tenant', 'packagesEndDate');
        await queryInterface.removeColumn('tenant', 'trialDays');
        await queryInterface.removeColumn('tenant', 'lastRenewDate');
        await queryInterface.removeColumn('tenant', 'amount');
        await queryInterface.removeColumn('tenant', 'paymentStatus');

        // Revert companyName to nullable
        await queryInterface.changeColumn('tenant', 'companyName', {
            type: Sequelize.STRING,
            allowNull: true,
        });

        // Drop ENUM type if Postgres
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_tenant_status";');
    },
};
