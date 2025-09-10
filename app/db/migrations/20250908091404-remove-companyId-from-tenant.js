'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.removeColumn('tenant', 'companyId');
    },

    async down(queryInterface, Sequelize) {
        // In case you need to rollback, add the column back
        await queryInterface.addColumn('tenant', 'companyId', {
            type: Sequelize.STRING,
            allowNull: true,
        });
    },
};
