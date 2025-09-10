'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.changeColumn('role', 'status', {
             type: Sequelize.ENUM('0', '1'),
            allowNull: false,
            defaultValue: '1',
        });
    },

    async down(queryInterface, Sequelize) {
        // Rollback: change it back to STRING
        await queryInterface.changeColumn('role', 'status', {
            type: Sequelize.STRING,
            allowNull: true,
        });
    },
};
