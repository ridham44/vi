'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert(
            'role',
            [
                {
                    id: 'f0bd3222-8c92-11f0-96ce-74d83e9d1674',
                    name: 'Tenant',
                    isMasterAdmin: false,
                    description: 'Tenant',
                    status: '1',
                    tenantId: '82b238ea-8c94-11f0-96ce-74d83e9d1674',
                    createdAt: '2024-04-25 09:49:44',
                    updatedAt: '2024-04-25 09:49:44',
                },
            ],
            {}
        );
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('role', null, {});
    },
};
