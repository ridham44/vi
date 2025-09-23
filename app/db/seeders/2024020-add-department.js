'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert(
            'department',
            [
                {
                    id: 'd1a2b3c4-0001-0000-0000-000000000001',
                    name: 'Sales',
                    description: 'Handles all sales operations and client interactions.',
                    tenantId: '4bb7008c-0f39-4ae0-9da0-4e365f4b995d',
                    // tenantId: '82b238ea-8c94-11f0-96ce-74d83e9d1674',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    deletedAt: null,
                },
                {
                    id: 'd1a2b3c4-0002-0000-0000-000000000002',
                    name: 'Marketing',
                    description: 'Responsible for marketing campaigns and brand promotion.',
                    tenantId: '4bb7008c-0f39-4ae0-9da0-4e365f4b995d',
                    // tenantId: '82b238ea-8c94-11f0-96ce-74d83e9d1674',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    deletedAt: null,
                },
                {
                    id: 'd1a2b3c4-0003-0000-0000-000000000003',
                    name: 'Human Resources',
                    description: 'Manages recruitment, employee relations, and HR policies.',
                    tenantId: '4bb7008c-0f39-4ae0-9da0-4e365f4b995d',
                    // tenantId: '82b238ea-8c94-11f0-96ce-74d83e9d1674',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    deletedAt: null,
                },
                {
                    id: 'd1a2b3c4-0004-0000-0000-000000000004',
                    name: 'Finance',
                    description: 'Handles accounting, budgeting, and financial reporting.',
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
        await queryInterface.bulkDelete('department', {
            id: [
                'd1a2b3c4-0001-0000-0000-000000000001',
                'd1a2b3c4-0002-0000-0000-000000000002',
                'd1a2b3c4-0003-0000-0000-000000000003',
                'd1a2b3c4-0004-0000-0000-000000000004',
            ]
        }, {});
    },
};
