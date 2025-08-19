'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('user', {
            id: {
                type: Sequelize.UUID,
                primaryKey: true,
                allowNull: false,
                defaultValue: Sequelize.UUIDV4,
            },
            firstName: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            lastName: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            mobile: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            email: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            password: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            profileImage: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            isAdmin: {
                type: Sequelize.ENUM('0', '1'),
                allowNull: false,
                defaultValue: '0',
            },
            status: {
                type: Sequelize.ENUM('1', '0'),
                allowNull: false,
                defaultValue: '1',
                comment: '0 for InActive, 1 for Active',
            },
            roleId: {
                type: Sequelize.UUID,
                references: {
                    model: 'role',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT',
            },
            tenantId: {
                type: Sequelize.UUID,
                references: {
                    model: 'tenant',
                    key: 'id',
                },
                allowNull: true,
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT',
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE,
            },
            createdBy: {
                type: Sequelize.UUID,
                references: {
                    model: 'user',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT',
            },
            updatedAt: {
                allowNull: true,
                type: Sequelize.DATE,
            },
            updatedBy: {
                type: Sequelize.UUID,
                references: {
                    model: 'user',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT',
            },
            deletedAt: {
                allowNull: true,
                type: Sequelize.DATE,
            },
            deletedBy: {
                type: Sequelize.UUID,
                references: {
                    model: 'user',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT',
            },
        });
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('user');
    },
};
