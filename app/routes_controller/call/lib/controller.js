require('dotenv').config();
const { Sequelize, fn, literal } = require('sequelize');
const Op = Sequelize.Op;
const db = require('../../../db/models');
const { status, common } = require('../../../../utils');

exports.inboundCall = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { fromDate, toDate, callType, agentId, simNumber } = req.body;

        const whereClause = { tenantId: req.user.tenantId };

        if (fromDate && toDate) {
            whereClause.callStartTime = {
                [Op.between]: [new Date(fromDate), new Date(toDate)],
            };
        }

        if (callType) {
            whereClause.callType = callType;
        }

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
                [fn('COUNT', literal(`CASE WHEN callStatus = 'NOT-REACHABLE' THEN 1 END`)), 'not_reachable'],
            ],
            group: ['callType'],
            where: whereClause,
            disableTenantCheck: true,
            raw: true,
        });

        const response = {
            inbound: { totalCalls: 0, answered: 0, missed: 0, notAnswered: 0, busy: 0 },
            outbound: { totalCalls: 0, answered: 0, missed: 0, notAnswered: 0, busy: 0, notReachable: 0 },
            summary: { totalCalls: 0, uniqueCalls: 0 },
        };

        result.forEach((row) => {
            if (row.callType === 'IN') {
                response.inbound.totalCalls = Number(row.total_calls);
                response.inbound.answered = Number(row.answered);
                response.inbound.missed = Number(row.missed);
                response.inbound.notAnswered = Number(row.not_answered);
                response.inbound.busy = Number(row.busy);
            }
            if (row.callType === 'OUT') {
                response.outbound.totalCalls = Number(row.total_calls);
                response.outbound.answered = Number(row.answered);
                response.outbound.missed = Number(row.missed);
                response.outbound.notAnswered = Number(row.not_answered);
                response.outbound.busy = Number(row.busy);
                response.outbound.notReachable = Number(row.not_reachable);
            }

            response.summary.totalCalls += Number(row.total_calls);
        });

        const uniqueCalls = await db.CallDetails.count({
            distinct: true,
            col: 'callingNumber',
            where: whereClause,
            disableTenantCheck: true,
        });
        response.summary.uniqueCalls = uniqueCalls;

        await transaction.commit();
        return res.status(status.OK).json({ data: response });
    } catch (err) {
        console.log(err);
        await transaction.rollback();
        return common.throwException(err, 'fetch Call Details Api', req, res);
    }
};
exports.callFilter = async (req, res) => {
    try {
        const {
            fromDate,
            toDate,
            startTime,
            endTime,
            callType,
            callStatus,
            callBack,
            departmentId,
            // agentId,
            simNumber,
            callNumber,
            minDuration,
            maxDuration,
            limit,
            searchInArchive,
        } = req.body;

        const whereClause = { tenantId: req.user.tenantId, deletedAt: null };

        if (fromDate && toDate) {
            whereClause.callStartTime = {
                [Op.between]: [new Date(fromDate), new Date(toDate)],
            };
        }

        if (startTime && endTime) {
            whereClause[Op.and] = [
                Sequelize.where(Sequelize.fn('TIME', Sequelize.col('callStartTime')), {
                    [Op.between]: [startTime, endTime],
                }),
            ];
        }

        if (callType) {
            whereClause.callType = callType;
        }

        if (callStatus) {
            whereClause.callStatus = callStatus;
        }

        if (callBack) {
            whereClause.callBack = callBack;
        }

        if (departmentId) {
            whereClause.departmentId = departmentId;
        }

        // if (agentId) {
        //     whereClause.agentId = agentId;
        // }

        if (simNumber.length > 0) {
            const phones = await db.Phones.findAll({
                attributes: ['number'],
                where: {
                    id: {
                        [Op.in]: simNumber,
                    },
                },
                raw: true,
                disableTenantCheck: true,
            });
            const phoneNumbers = phones.map((p) => p.number);

            whereClause.agentId = { [Op.in]: phoneNumbers };
        }

        if (callNumber) {
            whereClause[Op.or] = [{ callingNumber: { [Op.like]: `%${callNumber}%` } }, { calledNumber: { [Op.like]: `%${callNumber}%` } }];
        }

        if (minDuration !== undefined && maxDuration !== undefined) {
            whereClause.conversationDuration = {
                [Op.between]: [minDuration, maxDuration],
            };
        }

        // if (!searchInArchive) {
        //     whereClause.deletedAt = null;
        // }
        const stats = await db.CallDetails.findOne({
            attributes: [
                [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'totalCalls'],
                [db.sequelize.fn('COALESCE', db.sequelize.fn('SUM', db.sequelize.literal("callType = 'IN'")), 0), 'inboundCalls'],
                [db.sequelize.fn('COALESCE', db.sequelize.fn('SUM', db.sequelize.literal("callType = 'OUT'")), 0), 'outboundCalls'],
                [db.sequelize.fn('COALESCE', db.sequelize.fn('SUM', db.sequelize.literal("callStatus = 'ANSWERED'")), 0), 'answeredCalls'],
                [
                    db.sequelize.fn('COALESCE', db.sequelize.fn('SUM', db.sequelize.literal("callStatus = 'NOT ANSWERED'")), 0),
                    'notAnsweredCalls',
                ],
                [db.sequelize.fn('COALESCE', db.sequelize.fn('SUM', db.sequelize.literal("callStatus = 'MISSED'")), 0), 'missedCalls'],
                [db.sequelize.fn('COALESCE', db.sequelize.fn('SUM', db.sequelize.literal("callStatus = 'BUSY'")), 0), 'busyCalls'],
                [
                    db.sequelize.fn('COALESCE', db.sequelize.fn('SUM', db.sequelize.literal("callStatus = 'NOT REACHABLE'")), 0),
                    'notReachableCalls',
                ],
            ],
            where: whereClause,
            limit: limit,
            disableTenantCheck: true,
            raw: true,
        });

        const result = await db.CallDetails.findAll({
            attributes: [
                'sourcePbxCallId',
                'agentId',
                'callType',
                'callBack',
                'callConnected',
                'conversationDuration',
                'callStartTime',
                'callEndTime',
                'callStatus',
                'ringDuration',
                'voiceFilePath',
                'stationId',
                [
                    db.sequelize.literal(`CASE 
                        WHEN callType = 'IN' THEN callingNumber
                        WHEN callType = 'OUT' THEN calledNumber
                        ELSE NULL END`),
                    'caller',
                ],
            ],
            where: whereClause,
            limit: limit,
            disableTenantCheck: true,
        });

        const formattedStats = {
            inbound: Number(stats.inboundCalls) || 0,
            outbound: Number(stats.outboundCalls) || 0,
            answered: Number(stats.answeredCalls) || 0,
            not_answered: Number(stats.notAnsweredCalls) || 0,
            missed: Number(stats.missedCalls) || 0,
            busy: Number(stats.busyCalls) || 0,
            not_reachable: Number(stats.notReachableCalls) || 0,
            total_calls: Number(stats.totalCalls) || 0,
        };
        let response = {
            call_details: {
                counts: formattedStats,
                data: result,
            },
        };
        return res.status(status.OK).json({ data: response });
    } catch (err) {
        console.log(err);
        return common.throwException(err, 'fetch Call Details Api', req, res);
    }
};
