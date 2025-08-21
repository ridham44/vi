'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert(
            'role',
            [
                {
                    id: '6cff3d9f-02d8-11ef-8c8d-74563c332520',
                    name: 'CRM Main Admin',
                    isSystemAdmin: '0',
                    isAdmin: '0',
                    isMasterAdmin: '1',
                    systemDefault: true,
                    description: 'CRM Main Admin',
                    status: '1',
                    level: 2,
                    createdAt: '2024-04-25 09:49:44',
                    updatedAt: '2024-04-25 09:49:44',
                },
                {
                    id: '78210376-02d8-11ef-8c8d-74563c332520',
                    name: 'Employee',
                    isSystemAdmin: '1',
                    isAdmin: '0',
                    systemDefault: true,
                    description: 'Employee',
                    status: '1',
                    level: 3,
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
