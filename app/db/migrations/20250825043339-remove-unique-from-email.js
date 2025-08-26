'use strict';

module.exports = {
    up: async (queryInterface) => {
        await queryInterface.removeConstraint('user', 'user_email_unique');
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.addConstraint('user', {
            fields: ['email'],
            type: 'unique',
            name: 'user_email_unique',
        });
    },
};
