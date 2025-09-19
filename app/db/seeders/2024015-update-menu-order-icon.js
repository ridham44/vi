'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkUpdate(
            'menu_order',
            {
                icon: 'mdi:account-cog-outline',
                updatedAt: new Date(),
            },
            {
                id: '21eee5da-8a1f-11f0-87c0-74d83e9d1674',
            }
        );

        await queryInterface.bulkUpdate(
            'menu_order',
            {
                icon: 'mdi:phone-plus',
                updatedAt: new Date(),
            },
            {
                id: '91a50a22-8a28-11f0-87c0-74d83e9d1674',
            }
        );
        await queryInterface.bulkUpdate(
            'menu_order',
            {
                icon: 'mdi:credit-card-outline',
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
                icon: 'mdi:playlist-plus',
                updatedAt: new Date(),
            },
            {
                id: '21eee5da-8a1f-11f0-87c0-74d83e9d1674',
            }
        );

        await queryInterface.bulkUpdate(
            'menu_order',
            {
                icon: 'mdi:playlist-plus',
                updatedAt: new Date(),
            },
            {
                id: '91a50a22-8a28-11f0-87c0-74d83e9d1674',
            }
        );
        await queryInterface.bulkUpdate(
            'menu_order',
            {
                icon: 'mdi:currency-usd',
                updatedAt: new Date(),
            },
            {
                id: 'c1234567-89ab-4cde-8f01-234567890def',
            }
        );
    },
};
