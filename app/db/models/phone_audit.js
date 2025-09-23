'use strict';

module.exports = (sequelize, Sequelize) => {
    const PhoneAudit = sequelize.define(
        'PhoneAudit',
        {
            id: {
                type: Sequelize.UUID,
                primaryKey: true,
                allowNull: false,
                defaultValue: Sequelize.UUIDV4,
            },
            recordId: {
                type: Sequelize.UUID,
                allowNull: true,
                association: {
                    model: 'PhoneLogs',
                    key: 'id',
                    onUpdate: 'CASCADE',
                    onDelete: 'RESTRICT',
                    belongsToAlias: 'PhoneLogs',
                    hasManyAlias: 'PhoneAudit',
                },
            },
            field: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            oldValue: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            newValue: {
                type: Sequelize.TEXT,
                allowNull: true,
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
            tableName: 'phone_audit',
        }
    );

    PhoneAudit.hasTenantCondition();
    return PhoneAudit;
};
