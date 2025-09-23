'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkUpdate(
            'callingDetails',
            {
                voiceFilePath:null,
                updatedAt: new Date(),
            },
            {
                id: 'b1c2d3e4-0002-0000-0000-000000000002',
            }
        );
        await queryInterface.bulkUpdate(
            'callingDetails',
            {
                voiceFilePath:null,
                updatedAt: new Date(),
            },
            {
                id: 'b1c2d3e4-0006-0000-0000-000000000006',
            }
        );
        await queryInterface.bulkUpdate(
            'callingDetails',
            {
                voiceFilePath:null,
                updatedAt: new Date(),
            },
            {
                id: 'b1c2d3e4-0007-0000-0000-000000000007',
            }
        );
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkUpdate(
            'callingDetails',
             {
                voiceFilePath:null,
                updatedAt: new Date(),
            },
            {
                id: 'b1c2d3e4-0006-0000-0000-000000000006',
            }
        );
        await queryInterface.bulkUpdate(
            'callingDetails',
             {
                voiceFilePath:null,
                updatedAt: new Date(),
            },
            {
                id: 'b1c2d3e4-0006-0000-0000-000000000006',
            }
        );
         await queryInterface.bulkUpdate(
            'callingDetails',
             {
                voiceFilePath:null,
                updatedAt: new Date(),
            },
            {
                id: 'b1c2d3e4-0006-0000-0000-000000000006',
            }
        );
        

    },
};
