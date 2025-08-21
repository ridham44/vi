'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('menu_order', {
            id: {
                type: Sequelize.UUID,
                primaryKey: true,
                allowNull: false,
                defaultValue: Sequelize.UUIDV4,
            },
            name: {
                type: Sequelize.STRING(100),
                allowNull: false,
            },
            url: {
                type: Sequelize.STRING(150),
                allowNull: true,
            },
            icon: {
                type: Sequelize.STRING(100),
                allowNull: true,
            },
            subMenu: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            level: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            status: {
                type: Sequelize.ENUM('0', '1'),
                allowNull: false,
                defaultValue: '1',
                comment: '0 for InActive, 1 for Active',
            },
            key: {
                type: Sequelize.STRING(100),
                allowNull: true,
            },
            type: {
                type: Sequelize.ENUM('1', '2', '3'),
                allowNull: true,
                defaultValue: '1',
                comment: '1 for group, 2 for module, 3 for right',
            },
            parentId: {
                type: Sequelize.UUID,
                allowNull: true,
                references: {
                    model: 'menu_order',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT',
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
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
                type: Sequelize.DATE,
                allowNull: true,
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
                type: Sequelize.DATE,
                allowNull: true,
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
        await queryInterface.dropTable('menu_order');
    },
};
