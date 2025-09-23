'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert(
            'department',
            [
                {
                    id: '3265de68-9850-11f0-8b3b-ce033aec326d',
                   name:"HR",
                   tenantId:"4bb7008c-0f39-4ae0-9da0-4e365f4b995d"
                },
                {
                    id: '3265e6f6-9850-11f0-8b3b-ce033aec326d',
                   name:"Accountant",
                   tenantId:"4bb7008c-0f39-4ae0-9da0-4e365f4b995d"
                },
               
            ],
            {}
        );
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('department', null, {});
    },
};
