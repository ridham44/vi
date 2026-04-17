'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert(
            'department',
            [
                {
                    id: 'd3b07384-d9a1-11ec-9d64-0242ac120002',
                    name: 'Human Resources',
                    description: 'Handles recruitment and employee management',
                    tenantId: '4bb7008c-0f39-4ae0-9da0-4e365f4b995d',
                    createdAt: '2025-08-20T10:00:00Z',
                    updatedAt: '2025-08-20T10:00:00Z',
                    deletedAt: null,
                },
                {
                    id: 'e4b07384-d9a1-11ec-9d64-0242ac120003',
                    name: 'IT Support',
                    description: 'Manages tech infrastructure',
                    tenantId: '4bb7008c-0f39-4ae0-9da0-4e365f4b995d',
                    createdAt: '2025-08-20T10:05:00Z',
                    updatedAt: '2025-08-20T10:05:00Z',
                    deletedAt: null,
                },
            ],
            {}
        );
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('department', null, {});
    },
};
