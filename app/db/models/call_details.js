'use strict';

module.exports = (sequelize, Sequelize) => {
    const CallDetails = sequelize.define(
        'CallDetails',
        {
            id: {
                type: Sequelize.UUID,
                primaryKey: true,
                allowNull: true,
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
                association: {
                    model: 'Tenant',
                    key: 'id',
                    onUpdate: 'CASCADE',
                    onDelete: 'RESTRICT',
                    belongsToAlias: 'Tenant',
                    hasManyAlias: 'CallDetails',
                },
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
                onCreate: sequelize.literal('CURRENT_TIMESTAMP'),
            },
            updatedAt: {
                type: Sequelize.DATE,
                onUpdate: sequelize.literal('CURRENT_TIMESTAMP'),
            },
            deletedAt: {
                type: Sequelize.DATE,
            },
        },
        {
            tableName: 'callingDetails',
            customOptions: {
                createdBy: { value: true },
                updatedBy: { value: true },
                deletedBy: { value: true },
            },
        }
    );

    CallDetails.hasTenantCondition();
    return CallDetails;
};
