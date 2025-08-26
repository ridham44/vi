'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert(
            'menu_order',
            [
                {
                    id: 'f49400ac-819a-11f0-8973-74d83e9d1674',
                    name: 'Add Tenant',
                    subMenu: '0',
                    type: '1',
                    level: '1',
                    status: '1',
                    forWhom: 'CRM Main Admin',
                    createdAt: '2024-08-31 14:48:59',
                },
            ],
            {}
        );
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('menu_order', null, {});
    },
};
