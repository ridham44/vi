'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('menu_order_role', {
            id: {
                type: Sequelize.UUID,
                primaryKey: true,
                allowNull: true,
                defaultValue: Sequelize.UUIDV4,
            },
            menuOrderId: {
                type: Sequelize.UUID,
                references: {
                    model: 'menu_order',
                    key: 'id',
                },
                allowNull: false,
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            roleId: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'role',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT',
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
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE,
            },
            updatedAt: {
                allowNull: true,
                type: Sequelize.DATE,
            },
        });
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('menu_order_role');
    },
};
