'use strict';
const bcrypt = require('bcrypt');

module.exports = (sequelize, Sequelize) => {
    const User = sequelize.define(
        'User',
        {
            id: {
                type: Sequelize.UUID,
                primaryKey: true,
                allowNull: false,
                defaultValue: Sequelize.UUIDV4,
            },
            firstName: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            lastName: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            crmUserId: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            countryCode: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            mobile: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            email: {
                type: Sequelize.STRING,
                allowNull: true,
                set(value) {
                    this.setDataValue('email', value?.toLowerCase());
                },
            },
            password: {
                type: Sequelize.STRING,
                allowNull: true,
                set(value) {
                    this.setDataValue('password', bcrypt.hashSync(value, 10));
                },
            },
            roleId: {
                type: Sequelize.UUID,
                allowNull: true,
                association: {
                    model: 'Role',
                    key: 'id',
                    onUpdate: 'CASCADE',
                    onDelete: 'RESTRICT',
                    belongsToAlias: 'Role',
                    hasManyAlias: 'Users',
                },
            },
            departmentId: {
                type: Sequelize.UUID,
                allowNull: true,
                association: {
                    model: 'Department',
                    key: 'id',
                    onUpdate: 'CASCADE',
                    onDelete: 'RESTRICT',
                    belongsToAlias: 'Department',
                    hasManyAlias: 'Users',
                },
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
                    hasManyAlias: 'Users',
                },
            },
            profileImage: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            myOperatorUserId: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            hoduAgentId: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            fcmToken: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            isEmailVerified: {
                type: Sequelize.ENUM('0', '1'),
                allowNull: true,
                defaultValue: '0',
            },
            isPasswordChangeRequired: {
                type: Sequelize.BOOLEAN,
                allowNull: true,
                defaultValue: false,
            },
            status: {
                type: Sequelize.ENUM('0', '1'),
                allowNull: true,
                defaultValue: '1',
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
            tableName: 'user',
            indexes: [{ unique: true, fields: ['email'] }],
            customOptions: {
                createdBy: { value: true },
                updatedBy: { value: true },
                deletedBy: { value: true },
            },
            defaultScope: {
                attributes: {
                    exclude: ['password'],
                },
            },
            scopes: {
                withPassword: {
                    attributes: {
                        include: ['password'],
                    },
                },
            },
        }
    );

    User.hasTenantCondition();
    return User;
};
