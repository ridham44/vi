'use strict';
module.exports = (sequelize, Sequelize) => {
    const Packages = sequelize.define(
        'Packages',
        {
            id: {
                type: Sequelize.UUID,
                primaryKey: true,
                allowNull: false,
                defaultValue: Sequelize.UUIDV4,
            },
            packagesName: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            packagesDescription: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            packagesAmount: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
            },
            noOfMonths:{
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 1,
            },
            status: {
                type: Sequelize.ENUM('0', '1'),
                allowNull: false,
                defaultValue: '1',
                comment: '0=Inactive, 1=Active',
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
                allowNull: true,
            },
        },
        {
            tableName: 'packages',
        }
    );

    Packages.hasTenantCondition(false);

    return Packages;
};
