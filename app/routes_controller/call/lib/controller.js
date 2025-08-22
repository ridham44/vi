require('dotenv').config();
const { Sequelize, fn, literal } = require('sequelize');
const Op = Sequelize.Op;
const db = require('../../../db/models');
const { status, common,} = require('../../../../utils');
// const bcrypt = require('bcryptjs');
// const moment = require('moment-timezone');
// const jwt = require('jsonwebtoken');
// const path = require('path');
// const fs = require('fs');

exports.inboundCall = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        console.log('type', req.user.type);

        const result = await db.CallDetails.findAll({
            attributes: [
                'callType',
                [fn('COUNT', literal('*')), 'total_calls'],
                [fn('COUNT', literal(`CASE WHEN callStatus = 'ANSWERED' THEN 1 END`)), 'answered'],
                [fn('COUNT', literal(`CASE WHEN callStatus = 'MISSED' THEN 1 END`)), 'missed'],
                [fn('COUNT', literal(`CASE WHEN callStatus = 'NOT ANSWERED' THEN 1 END`)), 'not_answered'],
                [fn('COUNT', literal(`CASE WHEN callStatus = 'BUSY' THEN 1 END`)), 'busy'],
            ],
            group: ['callType'],
            where: {
                tenantId: req.user.Tenant.dataValues.id,
            },
            disableTenantCheck: true,
        });

        await transaction.commit();

        return res.status(status.OK).json({ data: result });
    } catch (err) {
        await transaction.rollback();
        return common.throwException(err, 'fetch Call Details  Api', req, res);
    }
};
exports.callLogs = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { fromDate, toDate, callType, status, agentId } = req.body;

        const whereClause = {};

        if (fromDate && toDate) {
            whereClause.callStartTime = {
                [Op.between]: [new Date(fromDate), new Date(toDate)],
            };
        }

        if (callType) {
            whereClause.callType = callType;
        }

        if (status) {
            whereClause.status = status;
        }

        if (agentId) {
            whereClause.agentId = agentId;
        }

        const calls = await db.CallLogs.findAll({
            where: whereClause,
            order: [['callStartTime', 'DESC']],
        });

        res.json({
            success: true,
            total: calls.length,
            data: calls,
        });

    } catch (err) {
        await transaction.rollback();
        return common.throwException(err, 'fetch Call Details  Api', req, res);
    }
};
