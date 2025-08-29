require('dotenv').config();
const { Sequelize, fn, literal } = require('sequelize');
const Op = Sequelize.Op;
const db = require('../../../db/models');
const { status, common } = require('../../../../utils');

exports.inboundCall = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        // console.log('type', req.user.type);
        const { fromDate, toDate, callType, agentId, simNumber } = req.body;

        const whereClause = {
            tenantId: req.user.tenantId,
        };

        if (fromDate && toDate) {
            whereClause.callStartTime = {
                [Op.between]: [new Date(fromDate), new Date(toDate)],
            };
        }

        if (callType) {
            whereClause.callType = callType;
        }

        // if (status) {
        //     whereClause.status = status;
        // }

        if (agentId) {
            whereClause.agentId = agentId;
        }
        if (simNumber) {
            whereClause[Op.or] = [{ callingNumber: simNumber }, { calledNumber: simNumber }];
        }

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
            where: whereClause,
            disableTenantCheck: true,
        });

        await transaction.commit();

        return res.status(status.OK).json({ data: result });
    } catch (err) {
        console.log(err);

        await transaction.rollback();
        return common.throwException(err, 'fetch Call Details  Api', req, res);
    }
};
exports.callLogs = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { fromDate, toDate, callType, agentId } = req.body;

        const whereClause = {};

        if (fromDate && toDate) {
            whereClause.callStartTime = {
                [Op.between]: [new Date(fromDate), new Date(toDate)],
            };
        }

        if (callType) {
            whereClause.callType = callType;
        }

        // if (status) {
        //     whereClause.status = status;
        // }

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

        return res.status(status.OK).json({ data: calls });
    } catch (err) {
        await transaction.rollback();
        return common.throwException(err, 'fetch Call Details  Api', req, res);
    }
};
