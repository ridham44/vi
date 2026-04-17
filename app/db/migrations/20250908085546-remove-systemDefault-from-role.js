'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.removeColumn('role', 'systemDefault');
    },

    async down(queryInterface, Sequelize) {
        // In case you need to rollback, add the column back
        await queryInterface.addColumn('role', 'systemDefault', {
            type: Sequelize.STRING,
            allowNull: true,
        });
    },
};
