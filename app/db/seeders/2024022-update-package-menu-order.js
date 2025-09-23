'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
       
        await queryInterface.bulkUpdate(
            'menu_order',
            {
                name:"Packages",
                updatedAt: new Date(),
            },
            {
                id: 'c1234567-89ab-4cde-8f01-234567890def',
            }
        );
    },

    async down(queryInterface, Sequelize) {
       
         await queryInterface.bulkUpdate(
            'menu_order',
            {
                name:"packages",
                updatedAt: new Date(),
            },
            {
                id: 'c1234567-89ab-4cde-8f01-234567890def',
            }
        );
        

    },
};
