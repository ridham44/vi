'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        return queryInterface.bulkInsert('user', [
            {
                id: '01672d73-adee-4f14-becf-4fcccc4fba77',
                firstName: 'Sophia',
                lastName: null,
                email: 'sophia@gmail.com',
                password: '$2b$10$jJ5v09jhfuR9m1Yvs.kxLOJ401zC5FeT/HN8XoK.h1bcF1E1XvKnS',
                roleId: '78210376-02d8-11ef-8c8d-74563c332520',
                departmentId: null,
                tenantId: '4bb7008c-0f39-4ae0-9da0-4e365f4b995d',
                profileImage: null,
                status: '1',
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
            },
        ]);
    },

    async down(queryInterface, Sequelize) {
        return queryInterface.bulkDelete('user', {
            id: '01672d73-adee-4f14-becf-4fcccc4fba77',
        });
    },
};
