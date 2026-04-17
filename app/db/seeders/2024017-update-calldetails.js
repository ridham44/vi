'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Updates with station, agentId, tenantId and callType
    const updates = [
      {
        id: 'a1b2c3d4-0001-0000-0000-000000000001',
        stationId: 'GUJARAT',
        agentId: '6987054321',
        tenantId: '82b238ea-8c94-11f0-96ce-74d83e9d1674',
        callType: 'IN',
      },
      {
        id: 'a1b2c3d4-0002-0000-0000-000000000002',
        stationId: 'RAJASTHAN',
        agentId: '6987054322',
        tenantId: '82b238ea-8c94-11f0-96ce-74d83e9d1674',
        callType: 'IN',
      },
      {
        id: 'a1b2c3d4-0003-0000-0000-000000000003',
        stationId: 'GOA',
        agentId: '6987054323',
        tenantId: '82b238ea-8c94-11f0-96ce-74d83e9d1674',
        callType: 'OUT',
      },
      {
        id: 'a1b2c3d4-0004-0000-0000-000000000004',
        stationId: 'MAHARASHTRA',
        agentId: '6987054324',
        tenantId: '82b238ea-8c94-11f0-96ce-74d83e9d1674',
        callType: 'IN',
      },
      {
        id: 'a1b2c3d4-0005-0000-0000-000000000005',
        stationId: 'KERALA',
        agentId: '6987054325',
        tenantId: '82b238ea-8c94-11f0-96ce-74d83e9d1674',
        callType: 'OUT',
      },
    ];

    for (const update of updates) {
      // NOTE: no double-quotes around table name for MySQL/MariaDB
      const rows = await queryInterface.sequelize.query(
        'SELECT callingNumber, calledNumber FROM callingDetails WHERE id = :id',
        { replacements: { id: update.id }, type: Sequelize.QueryTypes.SELECT }
      );

      const record = rows && rows[0];
      if (!record) {
        // skip if record not found (or you can throw)
        // console.warn(`callingDetails record not found for id ${update.id}`);
        continue;
      }

      let callingNumber = record.callingNumber;
      let calledNumber = record.calledNumber;

      if (update.callType === 'IN') {
        callingNumber = update.agentId; // agent as caller for inbound
      } else if (update.callType === 'OUT') {
        calledNumber = update.agentId; // agent as receiver for outbound
      }

      await queryInterface.bulkUpdate(
        'callingDetails',
        {
          stationId: update.stationId,
          agentId: update.agentId,
          tenantId: update.tenantId,
          callingNumber,
          calledNumber,
          updatedAt: new Date(),
        },
        { id: update.id }
      );
    }
  },

  async down(queryInterface, Sequelize) {
    // Rollback: reset to original values (same as your original seeder)
    const rollbacks = [
      {
        id: 'a1b2c3d4-0001-0000-0000-000000000001',
        stationId: 'station-001',
        agentId: 'agent-001',
        callingNumber: '9000000001',
        calledNumber: '8000000001',
        tenantId: 'c8ee3fcd-6c4e-11ef-936e-34415d71a6fb',
      },
      {
        id: 'a1b2c3d4-0002-0000-0000-000000000002',
        stationId: 'station-001',
        agentId: 'agent-001',
        callingNumber: '9000000001',
        calledNumber: '8000000001',
        tenantId: 'c8ee3fcd-6c4e-11ef-936e-34415d71a6fb',
      },
      {
        id: 'a1b2c3d4-0003-0000-0000-000000000003',
        stationId: 'station-001',
        agentId: 'agent-001',
        callingNumber: '8000000001',
        calledNumber: '9000000001',
        tenantId: 'c8ee3fcd-6c4e-11ef-936e-34415d71a6fb',
      },
      {
        id: 'a1b2c3d4-0004-0000-0000-000000000004',
        stationId: 'station-002',
        agentId: 'agent-002',
        callingNumber: '9000000002',
        calledNumber: '8000000002',
        tenantId: 'c8ee3fcd-6c4e-11ef-936e-34415d71a6fb',
      },
      {
        id: 'a1b2c3d4-0005-0000-0000-000000000005',
        stationId: 'station-002',
        agentId: 'agent-002',
        callingNumber: '8000000002',
        calledNumber: '9000000002',
        tenantId: 'c8ee3fcd-6c4e-11ef-936e-34415d71a6fb',
      },
    ];

    for (const rb of rollbacks) {
      await queryInterface.bulkUpdate(
        'callingDetails',
        {
          stationId: rb.stationId,
          agentId: rb.agentId,
          tenantId: rb.tenantId,
          callingNumber: rb.callingNumber,
          calledNumber: rb.calledNumber,
          updatedAt: new Date(),
        },
        { id: rb.id }
      );
    }
  },
};
