'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert(
            'menu_order_role',
            [
                {
                    id: 'f3465dd6-8a1f-11f0-87c0-74d83e9d1674',
                    menuOrderId: '21eee5da-8a1f-11f0-87c0-74d83e9d1674',
                    roleId: '6cff3d9f-02d8-11ef-8c8d-74563c332520',
                    status: '1',
                    createdAt: new Date(),
                },
                {
                    id: 'f346704d-8a1f-11f0-87c0-74d83e9d1674',
                    menuOrderId: '9bd70502-8a1f-11f0-87c0-74d83e9d1674',
                    roleId: '6cff3d9f-02d8-11ef-8c8d-74563c332520',
                    status: '1',
                    createdAt: new Date(),
                },
            ],
            {}
        );
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('menu_order_role', null, {});
    },
};
