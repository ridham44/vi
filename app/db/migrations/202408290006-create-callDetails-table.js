'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('callingDetails', {
            id: {
                type: Sequelize.UUID,
                allowNull: true,
                primaryKey: true,
                defaultValue: Sequelize.UUIDV4,
            },
            sourcePbxCallId: {
                type: Sequelize.STRING(36),
                allowNull: true,
            },
            agentId: {
                type: Sequelize.STRING(36),
                allowNull: true,
            },
            callingNumber: {
                type: Sequelize.STRING(20),
                allowNull: false,
            },
            calledNumber: {
                type: Sequelize.STRING(20),
                allowNull: true,
            },
            callType: {
                type: Sequelize.ENUM('IN', 'OUT'),
                allowNull: false,
            },
            callBack: {
                type: Sequelize.ENUM('YES', 'NO'),
                allowNull: false,
            },
            callConnected: {
                type: Sequelize.ENUM('YES', 'NO'),
                allowNull: false,
            },
            conversationDuration: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            callStartTime: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            callEndTime: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            callStatus: {
                type: Sequelize.ENUM('ANSWERED', 'NOT ANSWERED', 'MISSED', 'BUSY', 'NOT-REACHABLE'),
                allowNull: true,
            },
            ringDuration: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            voiceFilePath: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            stationId: {
                type: Sequelize.STRING(36),
                allowNull: true,
            },
            tenantId: {
                type: Sequelize.UUID,
                allowNull: true,
                references: {
                    model: 'tenant',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT',
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
            updatedAt: {
                allowNull: true,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
            deletedAt: {
                type: Sequelize.DATE,
                allowNull: true,
            },
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('callingDetails');
    },
};
