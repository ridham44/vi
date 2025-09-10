'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkUpdate(
            'tenant',
            {
                phone: '9876543210',
                countryCode: '91', 
                packagesId: '26402d15-8a1c-11f0-87c0-74d83e9d1674',
                packagesStartDate: '2025-09-08 14:45:14',
                packagesEndDate: '2026-09-08 14:48:11',
                lastRenewDate: '2025-09-08 14:45:14',
                amount: 1200.0,
                updatedAt: new Date(), 
            },
            {
                id: 'c8ee3fcd-6c4e-11ef-936e-34415d71a6fb', 
            }
        );
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkUpdate(
            'tenant',
            {
                phone: '+91-9876543210',
                countryCode: null, 
                packagesId: null,
                packagesStartDate: null,
                packagesEndDate: null,
                lastRenewDate: null,
                amount: null,
                updatedAt: new Date(),
            },
            {
                id: 'c8ee3fcd-6c4e-11ef-936e-34415d71a6fb',
            }
        );
    },
};
