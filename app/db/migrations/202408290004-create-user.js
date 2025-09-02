'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('user', {
            id: {
                type: Sequelize.UUID,
                allowNull: false,
                primaryKey: true,
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
            // crmUserId: {
            //     type: Sequelize.STRING,
            //     allowNull: true,
            // },
            // countryCode: {
            //     type: Sequelize.STRING,
            //     allowNull: true,
            // },
            mobile: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            email: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            password: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            roleId: {
                type: Sequelize.UUID,
                allowNull: true,
                references: {
                    model: 'role',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT',
            },
            departmentId: {
                type: Sequelize.UUID,
                allowNull: true,
                references: {
                    model: 'department',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT',
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
            profileImage: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            // myOperatorUserId: {
            //     type: Sequelize.STRING,
            //     allowNull: true,
            // },
            // hoduAgentId: {
            //     type: Sequelize.STRING,
            //     allowNull: true,
            // },
            // fcmToken: {
            //     type: Sequelize.STRING,
            //     allowNull: true,
            // },
            // isEmailVerified: {
            //     type: Sequelize.ENUM('0', '1'),
            //     allowNull: true,
            //     defaultValue: '0',
            // },
            // isPasswordChangeRequired: {
            //     type: Sequelize.BOOLEAN,
            //     allowNull: true,
            //     defaultValue: false,
            // },
            status: {
                type: Sequelize.ENUM('0', '1'),
                allowNull: true,
                defaultValue: '1',
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: true,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
            deletedAt: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            createdBy: {
                type: Sequelize.UUID,
                allowNull: true,
            },
            updatedBy: {
                type: Sequelize.UUID,
                allowNull: true,
            },
            deletedBy: {
                type: Sequelize.UUID,
                allowNull: true,
            },
        });

        // Unique index on email
        await queryInterface.addIndex('user', ['email'], {
            unique: true,
            name: 'user_email_unique',
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeIndex('user', 'user_email_unique');
        await queryInterface.dropTable('user');
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_user_isEmailVerified";');
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_user_status";');
    },
};
