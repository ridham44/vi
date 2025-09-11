'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('tenant', 'isoCode', {
            type: Sequelize.STRING(5),  
            allowNull: true,
            comment: 'ISO country code like IN, US, UK',
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('tenant', 'isoCode');
    },
};
