'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await Promise.all([queryInterface.removeColumn('role', 'isSystemAdmin'), queryInterface.removeColumn('role', 'isAdmin')]);
    },

    async down(queryInterface, Sequelize) {
        await Promise.all([
            queryInterface.addColumn('role', 'isSystemAdmin', {
                type: Sequelize.STRING,
                allowNull: true,
            }),
            queryInterface.addColumn('role', 'isAdmin', {
                type: Sequelize.UUID,
                allowNull: true,
            }),
        ]);
    },
};
