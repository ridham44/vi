'use strict';
module.exports = (sequelize, Sequelize) => {
    const UserPhones = sequelize.define(
        'UserPhones',
        {
            id: {
                type: Sequelize.UUID,
                primaryKey: true,
                allowNull: false,
                defaultValue: Sequelize.UUIDV4,
            },
            userId: {
                type: Sequelize.UUID,
                allowNull: false,
                association: {
                    model: 'User',
                    key: 'id',
                    onUpdate: 'CASCADE',
                    onDelete: 'RESTRICT',
                    belongsToAlias: 'User',
                    hasManyAlias: 'userPhones',
                },
            },
            phoneId: {
                type: Sequelize.UUID,
                allowNull: false,
                association: {
                    model: 'Phones',
                    key: 'id',
                    onUpdate: 'CASCADE',
                    onDelete: 'CASCADE',
                    belongsToAlias: 'Phones',
                    hasManyAlias: 'userPhones',
                },
            },
            status: {
                type: Sequelize.ENUM('0', '1'),
                allowNull: false,
                defaultValue: '1',
                comment: '0 for InActive, 1 for Active',
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
            tableName: 'user_phones',
        }
    );

    return UserPhones;
};
