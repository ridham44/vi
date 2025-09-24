'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkUpdate(
            'user',
            {
                email: 'superchplgroup123@gmail.com',
                updatedAt: new Date(),
            },
            {
                id: 'f2b13458-ac56-4c54-a6cb-53f879dbfe6c',
            }
        );
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkUpdate(
            'user',
            {
                email: 'superadmin@gmail.com',
                updatedAt: new Date(),
            },
            {
                id: 'f2b13458-ac56-4c54-a6cb-53f879dbfe6c',
            }
        );
    },
};
