'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('menu_order_role', 'deletedAt', {
            allowNull: true,
            type: Sequelize.DATE,
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('menu_order_role', 'deletedAt');
    },
};
