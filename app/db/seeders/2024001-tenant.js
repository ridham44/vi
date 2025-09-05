'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert(
            'tenant',
            [
                {
                    id: 'c8ee3fcd-6c4e-11ef-936e-34415d71a6fb',
                    companyName: 'Developer(CHPL)',
                    address: 'A-Block, 5th Floor, WTT, World Trade Tower,Ahmedabad, India',
                    phone: '+91-9876543210',
                    email: 'chpl@gmail.com',
                    status: '1', 
                    remarks: 'Migrated from old schema',
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
