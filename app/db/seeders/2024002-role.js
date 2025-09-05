'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert(
            'role',
            [
                {
                    id: '6cff3d9f-02d8-11ef-8c8d-74563c332520',
                    name: 'Main Admin',
                    // isSystemAdmin: '0',
                    // isAdmin: '0',
                    isMasterAdmin: '1',
                    // systemDefault: true,
                    description: 'Main Admin',
                    status: '1',
                    //tenantId: 'c8ee3fcd-6c4e-11ef-936e-34415d71a6fb',
                    createdAt: '2024-04-25 09:49:44',
                    updatedAt: '2024-04-25 09:49:44',
                },
                {
                    id: '78210376-02d8-11ef-8c8d-74563c332520',
                    name: 'Employee',
                    // isSystemAdmin: '1',
                    // isAdmin: '0',
                    // systemDefault: true,
                    description: 'Employee',
                    status: '1',
                    tenantId: 'c8ee3fcd-6c4e-11ef-936e-34415d71a6fb',
                    createdAt: '2024-04-25 09:50:11',
                    updatedAt: '2024-04-25 09:50:11',
                },
            ],
            {}
        );
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('role', null, {});
    },
};
