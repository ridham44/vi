'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkUpdate(
            'menu_order',
            {
                forWhom: 'Tenant',
                updatedAt: new Date(),
            },
            {
                id: 'c19ec780-7a3a-4021-98c7-e9195f53caf4',
            }
        );
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkUpdate(
            'menu_order',
            {
                forWhom: 'Both',
                updatedAt: new Date(),
            },
            {
                id: 'c19ec780-7a3a-4021-98c7-e9195f53caf4',
            }
        );
    },
};
