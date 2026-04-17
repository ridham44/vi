'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.removeColumn('user', 'mobile');
    },

    async down(queryInterface, Sequelize) {
        // In case you need to rollback, add the column back
        await queryInterface.addColumn('user', 'mobile', {
            type: Sequelize.STRING,
            allowNull: true,
        });
    },
};
