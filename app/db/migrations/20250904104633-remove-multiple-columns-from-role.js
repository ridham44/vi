'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await Promise.all([queryInterface.removeColumn('role', 'systemDefault')]);
    },

    async down(queryInterface, Sequelize) {
        await Promise.all([
            queryInterface.addColumn('role', 'systemDefault', {
                type: Sequelize.STRING,
                allowNull: true,
            }),
        ]);
    },
};
