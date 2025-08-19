'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert(
            'tenant',
            [
                {
                    id: 'c8ee3fcd-6c4e-11ef-936e-34415d71a6fb',
                    companyId: '1',
                    companyName: 'Developer(CHPL)',
                    subDomain: 'https://dev.my-company.app/india/',
                    mycoBackendUrl: 'https://dev.my-company.app/india/crmApi',
                    frontendUrl: 'http://localhost:3000/india/crm',
                    createdAt: '2024-09-06 18:13:26',
                    updatedAt: '2024-11-08 10:30:18',
                    deletedAt: null,
                },
            ],
            {}
        );
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('tenant', null, {});
    },
};
