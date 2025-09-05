'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('tenant', 'subDomain');
        await queryInterface.removeColumn('tenant', 'mycoBackendUrl');
        await queryInterface.removeColumn('tenant', 'frontendUrl');
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('tenant', 'companyId', {
            type: Sequelize.STRING,
            allowNull: false,
        });
        await queryInterface.addColumn('tenant', 'subDomain', {
            type: Sequelize.STRING,
            allowNull: true,
        });
        await queryInterface.addColumn('tenant', 'mycoBackendUrl', {
            type: Sequelize.STRING,
            allowNull: true,
        });
        await queryInterface.addColumn('tenant', 'frontendUrl', {
            type: Sequelize.STRING,
            allowNull: true,
        });
    },
};
