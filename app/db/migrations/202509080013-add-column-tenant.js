'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Add new column: countryCode
        await queryInterface.addColumn('tenant', 'countryCode', {
            type: Sequelize.STRING(10),  
            allowNull: true,
            comment: 'Country dialing code like +91, +1',
        });
    },

    down: async (queryInterface, Sequelize) => {
        // Remove countryCode column
        await queryInterface.removeColumn('tenant', 'countryCode');
    },
};
