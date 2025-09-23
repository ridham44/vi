'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert(
            'phones',
            [
                {
                    id: '3265de68-9850-11f0-8b3b-ce033aec326d',
                    name: 'HR',
                    number: '+919876543210',
                    countryCode: '+91',
                    departmentId:'d1a2b3c4-0003-0000-0000-000000000003',
                    tenantId: '4bb7008c-0f39-4ae0-9da0-4e365f4b995d',
                    // tenantId: '82b238ea-8c94-11f0-96ce-74d83e9d1674',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    deletedAt: null,
                },
                {
                    id: '3265e6f6-9850-11f0-8b3b-ce033aec326d',
                    name: 'Marketing',
                    number: '+919876543211',
                    countryCode: '+91',
                    departmentId: 'd1a2b3c4-0002-0000-0000-000000000002',
                    tenantId: '4bb7008c-0f39-4ae0-9da0-4e365f4b995d',
                    // tenantId: '82b238ea-8c94-11f0-96ce-74d83e9d1674',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    deletedAt: null,
                },
                {
                    id: '3265e9a2-9850-11f0-8b3b-ce033aec326d',
                    name: 'Sales',
                    number: '+919876543212',
                    countryCode: '+91',
                    departmentId: 'd1a2b3c4-0001-0000-0000-000000000001',
                    tenantId: '4bb7008c-0f39-4ae0-9da0-4e365f4b995d',
                    // tenantId: '82b238ea-8c94-11f0-96ce-74d83e9d1674',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    deletedAt: null,
                },
                {
                    id: '3265ed08-9850-11f0-8b3b-ce033aec326d',
                    name: 'Finance',
                    number: '+919876543214',
                    countryCode: '+91',
                    departmentId: 'd1a2b3c4-0004-0000-0000-000000000004',
                    tenantId: '4bb7008c-0f39-4ae0-9da0-4e365f4b995d',
                    // tenantId: '82b238ea-8c94-11f0-96ce-74d83e9d1674',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    deletedAt: null,
                },
            ],
            {}
        );
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('phones', {
            id: [
                '3265de68-9850-11f0-8b3b-ce033aec326d',
                '3265e6f6-9850-11f0-8b3b-ce033aec326d',
                '3265e9a2-9850-11f0-8b3b-ce033aec326d',
                '3265ed08-9850-11f0-8b3b-ce033aec326d',
            ]
        }, {});
    },
};
