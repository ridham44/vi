'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface) {
    const roleId = "78210376-02d8-11ef-8c8d-74563c332520";
    const menuIds = [
      "0448f4aa-4823-419f-adbb-d4576ba868ce",
      "c19ec780-7a3a-4021-98c7-e9195f53caf4",
      "a1234567-89ab-4cde-8f01-234567890abc",
      "b938d270-d191-4e4f-a87e-6a3c1a06cc40"
    ];

    const now = new Date();

    const records = menuIds.map(menuId => ({
      id: uuidv4(),
      roleId,
      menuOrderId: menuId,
      level: null,
      status: '1',
      createdAt: now,
      updatedAt: now,
      deletedAt: null
    }));

    return queryInterface.bulkInsert('menu_order_role', records, {});
  },

  async down(queryInterface) {
    return queryInterface.bulkDelete('menu_order_role', {
      roleId: "78210376-02d8-11ef-8c8d-74563c332520"
    }, {});
  }
};
