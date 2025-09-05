'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        const now = new Date();
        await queryInterface.bulkInsert(
            'packages',
            [
                {
                    id: '26402d15-8a1c-11f0-87c0-74d83e9d1674',
                    packagesName: 'new  1 year offer',
                    packagesDescription: 'new package',
                    packagesAmount: 1200,
                    noOfMonths: 12,
                    status: '1',

                    createdAt: now,
                    updatedAt: null,
                    deletedAt: null,
                },
            ],
            {}
        );
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('packages', null, {});
    },
};
