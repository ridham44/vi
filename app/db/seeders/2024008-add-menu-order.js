'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert(
            'menu_order',
            [
                {
                    id: '90d80a62-83cd-11f0-a943-74d83e9d1674',
                    name: 'Add Menu Order',
                    subMenu: '0',
                    type: '1', // 1 = group, 2 = module, 3 = right
                    level: '1',
                    status: '1',
                    forWhom: 'System Admin',
                    createdAt: '2024-08-31 14:48:59',
                },
            ],
            {}
        );
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('menu_order', {
            id: '90d80a62-83cd-11f0-a943-74d83e9d1674',
        });
    },
};
