'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert(
            'user',
            [
                {
                    id: 'f2b13458-ac56-4c54-a6cb-53f879dbfe6c',
                    firstName: 'System',
                    lastName: 'admin',
                    mobile: '1234567890',
                    email: 'superadmin@gmail.com',
                    password: '$2b$10$9BEv6xyfn//eV4VTNUy49OwgnRp7Is2wSKRZZd0Lp80NVMpzmBVui', //Admin@123
                    tenantId: 'c8ee3fcd-6c4e-11ef-936e-34415d71a6fb',
                    roleId: '6cff3d9f-02d8-11ef-8c8d-74563c332520',
                    profileImage: '',
                    status: '1',
                    createdAt: '2022-09-16 07:20:00',
                    updatedAt: '2022-09-16 07:22:55',
                    deletedAt: null,
                    createdBy: 'f2b13458-ac56-4c54-a6cb-53f879dbfe6c',
                    updatedBy: 'f2b13458-ac56-4c54-a6cb-53f879dbfe6c',
                    deletedBy: null,
                },
            ],
            {}
        );
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('user', null, {});
    },
};
