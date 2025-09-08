'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert(
            'menu_order_role',
            [
                {
                    id: '0d5e6420-8c95-11f0-8218-97d04d0f63c3',
                    menuOrderId: '91a50a22-8a28-11f0-87c0-74d83e9d1674', //phone
                    roleId: '6cff3d9f-02d8-11ef-8c8d-74563c332520',
                    status: '1',
                    createdAt: new Date(),
                },
                {
                    id: 'b63e9d63-8c93-11f0-8218-97d04d0f63c3',
                    menuOrderId: 'c0bcd9c5-8a28-11f0-87c0-74d83e9d1674', //add phone
                    roleId: '6cff3d9f-02d8-11ef-8c8d-74563c332520',
                    status: '1',
                    createdAt: new Date(),
                },
                {
                    id: '752e6c43-8c9e-11f0-96ce-74d83e9d1674',
                    menuOrderId: '0448f4aa-4823-419f-adbb-d4576ba868ce', //deshboard
                    roleId: 'f0bd3222-8c92-11f0-96ce-74d83e9d1674',
                    status: '1',
                    createdAt: new Date(),
                },
                {
                    id: '752e7e9b-8c9e-11f0-96ce-74d83e9d1674',
                    menuOrderId: '122e6d52-f280-4198-a8ef-c04961cd3988', //change password
                    roleId: 'f0bd3222-8c92-11f0-96ce-74d83e9d1674',
                    status: '1',
                    createdAt: new Date(),
                },
                {
                    id: 'ac9c4dab-8c9e-11f0-96ce-74d83e9d1674',
                    menuOrderId: 'a1234567-89ab-4cde-8f01-234567890abc', //manage phone
                    roleId: 'f0bd3222-8c92-11f0-96ce-74d83e9d1674',
                    status: '1',
                    createdAt: new Date(),
                },
                {
                    id: 'ac9c89a0-8c9e-11f0-96ce-74d83e9d1674',
                    menuOrderId: 'b204e522-e051-449a-8ba3-fafd4c3ec715', //department
                    roleId: 'f0bd3222-8c92-11f0-96ce-74d83e9d1674',
                    status: '1',
                    createdAt: new Date(),
                },
                {
                    id: 'cb4ee865-8c9e-11f0-96ce-74d83e9d1674',
                    menuOrderId: 'b938d270-d191-4e4f-a87e-6a3c1a06cc40', //user
                    roleId: 'f0bd3222-8c92-11f0-96ce-74d83e9d1674',
                    status: '1',
                    createdAt: new Date(),
                },
                {
                    id: 'cb4f12f6-8c9e-11f0-96ce-74d83e9d1674',
                    menuOrderId: 'c19ec780-7a3a-4021-98c7-e9195f53caf4', //call logs
                    roleId: 'f0bd3222-8c92-11f0-96ce-74d83e9d1674',
                    status: '1',
                    createdAt: new Date(),
                },
                {
                    id: 'e3d33d10-8c9e-11f0-96ce-74d83e9d1674',
                    menuOrderId: 'ec385572-e30c-4fb3-9613-8e3052f886a7', //profile
                    roleId: 'f0bd3222-8c92-11f0-96ce-74d83e9d1674',
                    status: '1',
                    createdAt: new Date(),
                },
                {
                    id: 'e3d37440-8c9e-11f0-96ce-74d83e9d1674',
                    menuOrderId: 'ee59343e-49d0-42d9-a1a9-8a0e80576c0f', //deshboard view
                    roleId: 'f0bd3222-8c92-11f0-96ce-74d83e9d1674',
                    status: '1',
                    createdAt: new Date(),
                },
                {
                    id: '080bfcf6-8c9f-11f0-96ce-74d83e9d1674',
                    menuOrderId: 'f49400ac-819a-11f0-8973-74d83e9d1623', //add department
                    roleId: 'f0bd3222-8c92-11f0-96ce-74d83e9d1674',
                    status: '1',
                    createdAt: new Date(),
                },
                {
                    id: '76decbc7-8c9f-11f0-96ce-74d83e9d1674',
                    menuOrderId: '21eee5da-8a1f-11f0-87c0-74d83e9d1674', //Role and Rights
                    roleId: 'f0bd3222-8c92-11f0-96ce-74d83e9d1674',
                    status: '1',
                    createdAt: new Date(),
                },
                {
                    id: '76df0ade-8c9f-11f0-96ce-74d83e9d1674',
                    menuOrderId: '9bd70502-8a1f-11f0-87c0-74d83e9d1674', //add Role and Rights
                    roleId: 'f0bd3222-8c92-11f0-96ce-74d83e9d1674',
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
