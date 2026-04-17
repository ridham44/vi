'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('phones', 'countryCode', {
            type: Sequelize.STRING(10),
            allowNull: true,
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('phones', 'countryCode');
    },
};
