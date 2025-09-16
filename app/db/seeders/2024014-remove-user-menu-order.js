'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkUpdate(
            'menu_order_role',
            {
                deletedAt: new Date(),
            },
            {
                id: '5448f4aa-4823-419f-adbb-d4576ba86128',
            }
        );
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkUpdate(
            'menu_order_role',
            {
                deletedAt: null,
            },
            {
                id: '5448f4aa-4823-419f-adbb-d4576ba86128',
            }
        );
    },
};
