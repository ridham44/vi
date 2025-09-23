'use strict';
 
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert(
            'phones',
            [
                {
                    id: '3265de68-9850-11f0-8b3b-ce033aec326d',
                    name: 'rajesh',
                    number: '9876543210',
                    countryCode: '91',
                    departmentId: "3265de68-9850-11f0-8b3b-ce033aec326d", 
                    tenantId: '4bb7008c-0f39-4ae0-9da0-4e365f4b995d',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    deletedAt: null,
                },
                {
                    id: '3265e6f6-9850-11f0-8b3b-ce033aec326d',
                    name: 'ramesh',
                    number: '9876543211',
                    countryCode: '91',
                    departmentId: "3265de68-9850-11f0-8b3b-ce033aec326d", 
                    tenantId: '4bb7008c-0f39-4ae0-9da0-4e365f4b995d',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    deletedAt: null,
                },
                {
                    id: '3265e9a2-9850-11f0-8b3b-ce033aec326d',
                    name: 'rakesh',
                    number: '9876543212',
                    countryCode: '91',
                    departmentId: "3265de68-9850-11f0-8b3b-ce033aec326d", // Assign departmentId if available
                    tenantId: '4bb7008c-0f39-4ae0-9da0-4e365f4b995d',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    deletedAt: null,
                },
                {
                    id: '3265eb4c-9850-11f0-8b3b-ce033aec326d',
                    name: 'keshav',
                    number: '9876543213',
                    countryCode: '91',
                    departmentId: "3265e6f6-9850-11f0-8b3b-ce033aec326d",
                    tenantId: '4bb7008c-0f39-4ae0-9da0-4e365f4b995d',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    deletedAt: null,
                },
                {
                    id: '3265ed08-9850-11f0-8b3b-ce033aec326d',
                    name: 'himesh',
                    number: '9876543214',
                    countryCode: '91',
                    departmentId: "3265e6f6-9850-11f0-8b3b-ce033aec326d",
                    tenantId: '4bb7008c-0f39-4ae0-9da0-4e365f4b995d',
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
                '3265eb4c-9850-11f0-8b3b-ce033aec326d',
                '3265ed08-9850-11f0-8b3b-ce033aec326d',
            ]
        }, {});
    },
};