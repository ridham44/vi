'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert(
            'tenant',
            [
                {
                    id: '82b238ea-8c94-11f0-96ce-74d83e9d1674',
                    companyName: 'rpa_group',
                    address: 'A-Block, 4th Floor, WTT, World Trade Tower,Ahmedabad, India',
                    phone: '1234554321',
                    email: 'r94698949@gmail.com',
                    status: '1',
                    mobileNoLimit: 10,
                    packagesId: '26402d15-8a1c-11f0-87c0-74d83e9d1674',
                    packagesStartDate: '2025-09-08 14:45:14',
                    packagesEndDate: '2026-09-08 14:48:11',
                    lastRenewDate: '2025-09-08 14:45:14',
                    amount: 1200.00,
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
