'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert(
            'menu_order_role',
            [
                {
                    id: '0448f4aa-4823-419f-adbb-d4576ba86123',
                    menuOrderId: '0448f4aa-4823-419f-adbb-d4576ba868ce',
                    roleId: '6cff3d9f-02d8-11ef-8c8d-74563c332520',
                    status: '1',
                    createdAt: new Date(),
                },
                {
                    id: '1448f4aa-4823-419f-adbb-d4576ba86124',
                    menuOrderId: 'ec385572-e30c-4fb3-9613-8e3052f886a7',
                    roleId: '6cff3d9f-02d8-11ef-8c8d-74563c332520',
                    status: '1',
                    createdAt: new Date(),
                },
                {
                    id: '2448f4aa-4823-419f-adbb-d4576ba86125',
                    menuOrderId: '122e6d52-f280-4198-a8ef-c04961cd3988',
                    roleId: '6cff3d9f-02d8-11ef-8c8d-74563c332520',
                    status: '1',
                    createdAt: new Date(),
                },
                {
                    id: '3448f4aa-4823-419f-adbb-d4576ba86126',
                    menuOrderId: 'ee59343e-49d0-42d9-a1a9-8a0e80576c0f',
                    roleId: '6cff3d9f-02d8-11ef-8c8d-74563c332520',
                    status: '1',
                    createdAt: new Date(),
                },
                {
                    id: '4448f4aa-4823-419f-adbb-d4576ba86127',
                    menuOrderId: 'c19ec780-7a3a-4021-98c7-e9195f53caf4',
                    roleId: '6cff3d9f-02d8-11ef-8c8d-74563c332520',
                    status: '1',
                    createdAt: new Date(),
                },
                {
                    id: '5448f4aa-4823-419f-adbb-d4576ba86828',
                    menuOrderId: 'b938d270-d191-4e4f-a87e-6a3c1a06cc40',
                    roleId: '6cff3d9f-02d8-11ef-8c8d-74563c332520',
                    status: '1',
                    createdAt: new Date(),
                },
                {
                    id: '6448f4aa-4823-419f-adbb-d4576ba86129',
                    menuOrderId: 'f49400ac-819a-11f0-8973-74d83e9d1673',
                    roleId: '6cff3d9f-02d8-11ef-8c8d-74563c332520',
                    status: '1',
                    createdAt: new Date(),
                },
                {
                    id: '7448f4aa-4823-419f-adbb-d4576ba86130',
                    menuOrderId: 'f49400ac-819a-11f0-8973-74d83e9d1674',
                    roleId: '6cff3d9f-02d8-11ef-8c8d-74563c332520',
                    status: '1',
                    createdAt: new Date(),
                },
                {
                    id: '8448f4aa-4823-419f-adbb-d4576ba86131',
                    menuOrderId: 'a1234567-89ab-4cde-8f01-234567890abc',
                    roleId: '6cff3d9f-02d8-11ef-8c8d-74563c332520',
                    status: '1',
                    createdAt: new Date(),
                },
                {
                    id: '9448f4aa-4823-419f-adbb-d4576ba86132',
                    menuOrderId: 'b204e522-e051-449a-8ba3-fafd4c3ec715',
                    roleId: '6cff3d9f-02d8-11ef-8c8d-74563c332520',
                    status: '1',
                    createdAt: new Date(),
                },
                {
                    id: 'a448f4aa-4823-419f-adbb-d4576ba86133',
                    menuOrderId: 'f49400ac-819a-11f0-8973-74d83e9d1623',
                    roleId: '6cff3d9f-02d8-11ef-8c8d-74563c332520',
                    status: '1',
                    createdAt: new Date(),
                },
                {
                    id: 'b448f4aa-4823-419f-adbb-d4576ba86134',
                    menuOrderId: 'c1234567-89ab-4cde-8f01-234567890def',
                    roleId: '6cff3d9f-02d8-11ef-8c8d-74563c332520',
                    status: '1',
                    createdAt: new Date(),
                },
                {
                    id: 'c448f4aa-4823-419f-adbb-d4576ba86135',
                    menuOrderId: 'd1234567-89ab-4cde-8f01-234567890fed',
                    roleId: '6cff3d9f-02d8-11ef-8c8d-74563c332520',
                    status: '1',
                    createdAt: new Date(),
                },
                // {
                //     id: 'f3465dd6-8a1f-11f0-87c0-74d83e9d1674',
                //     menuOrderId: '21eee5da-8a1f-11f0-87c0-74d83e9d1674',
                //     roleId: '6cff3d9f-02d8-11ef-8c8d-74563c332520',
                //     status: '1',
                //     createdAt: new Date(),
                // },
                // {
                //     id: 'f346704d-8a1f-11f0-87c0-74d83e9d1674',
                //     menuOrderId: '9bd70502-8a1f-11f0-87c0-74d83e9d1674',
                //     roleId: '6cff3d9f-02d8-11ef-8c8d-74563c332520',
                //     status: '1',
                //     createdAt: new Date(),
                // },
            ],
            {}
        );
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('menu_order_role', null, {});
    },
};
