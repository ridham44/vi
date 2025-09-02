'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('tenant', {
            id: {
                type: Sequelize.UUID,
                primaryKey: true,
                allowNull: false,
                defaultValue: Sequelize.UUIDV4,
            },
            // companyId: {
            //     type: Sequelize.STRING,
            //     allowNull: false,
            // },
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
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE,
            },
            updatedAt: {
                allowNull: true,
                type: Sequelize.DATE,
            },
            deletedAt: {
                allowNull: true,
                type: Sequelize.DATE,
            },
        });
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('tenant');
    },
};
