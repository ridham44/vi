'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert(
            'user',
            [
                {
                    id: '7772c23e-8c99-11f0-96ce-74d83e9d1674',
                    firstName: 'rpa',
                    lastName: 'group',
                    mobile: '1234234423',
                    email: 'rpa@gmail.com',
                    password: '$2b$10$9BEv6xyfn//eV4VTNUy49OwgnRp7Is2wSKRZZd0Lp80NVMpzmBVui', //Admin@123
                    tenantId: '82b238ea-8c94-11f0-96ce-74d83e9d1674',
                    roleId: 'f0bd3222-8c92-11f0-96ce-74d83e9d1674',
                    profileImage: '',
                    status: '1',
                    createdAt: '2022-09-16 07:20:00',
                    updatedAt: '2022-09-16 07:22:55',
                    deletedAt: null,
                    // createdBy: 'f2b13458-ac56-4c54-a6cb-53f879dbfe6c',
                    // updatedBy: 'f2b13458-ac56-4c54-a6cb-53f879dbfe6c',
                    // deletedBy: null,
                },
            ],
            {}
        );
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('user', null, {});
    },
};
