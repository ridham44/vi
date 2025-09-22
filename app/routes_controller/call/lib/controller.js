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
            //searchInArchive,
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

exports.voiceActivity = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const {
            fromDate,
            toDate,
            callType,
            agentId,
        } = req.body;

        const tenantId = req.user.tenantId;
        const whereClause = { tenantId, deletedAt: null };

        let from = new Date(fromDate);
        let to = new Date(toDate);

        whereClause.callStartTime = { [Op.between]: [from, to] };

        if (callType && callType !== 'BOTH') whereClause.callType = callType;
        if (agentId) whereClause.agentId = agentId;
        const fetchStats = async (where) => {
            return await db.CallDetails.findAll({
                attributes: [
                    'callType',
                    [fn('COUNT', literal('*')), 'totalCalls'],
                    [fn('COUNT', literal(`CASE WHEN callStatus = 'ANSWERED' THEN 1 END`)), 'answered'],
                    [fn('COUNT', literal(`CASE WHEN callStatus = 'MISSED' THEN 1 END`)), 'missed'],
                    [fn('COUNT', literal(`CASE WHEN callStatus = 'NOT ANSWERED' THEN 1 END`)), 'notAnswered'],
                    [fn('COUNT', literal(`CASE WHEN callStatus = 'BUSY' THEN 1 END`)), 'busy'],
                    [fn('COUNT', literal(`CASE WHEN callStatus = 'NOT-REACHABLE' THEN 1 END`)), 'notReachable'],
                ],
                group: ['callType'],
                where,
                disableTenantCheck: true,
                raw: true,
            });
        };

        const resultCurrent = await fetchStats(whereClause);

        const diffDays = Math.ceil((to - from) / (1000 * 60 * 60 * 24)) + 1; 
        let prevFrom, prevTo;

        if (diffDays === 1) {
            prevFrom = new Date(from);
            prevFrom.setDate(from.getDate() - 1);
            prevTo = new Date(from);
            prevTo.setDate(from.getDate() - 1);
        } else {
            prevFrom = new Date(from);
            prevFrom.setDate(from.getDate() - diffDays);
            prevTo = new Date(to);
            prevTo.setDate(to.getDate() - diffDays);
        }

        const wherePrev = { ...whereClause, callStartTime: { [Op.between]: [prevFrom, prevTo] } };
        const resultPrev = await fetchStats(wherePrev);

        const buildResponse = (current, prev) => {
            const response = {
                inbound: { totalCalls: 0, answered: 0, missed: 0, neverAttended: 0 },
                outbound: { totalCalls: 0, answered: 0, notAnswered: 0, busy: 0, notReachable: 0 },
                summary: { totalCalls: 0, uniqueCalls: 0 },
            };

            const toMap = (rows) => {
                const map = {};
                rows.forEach((r) => (map[r.callType] = r));
                return map;
            };

            const cur = toMap(current);
            const prevMap = toMap(prev);

            const calcPct = (val, prevVal) => {
                if (!prevVal && !val) return 0; 
                if (!prevVal && val) return 100; 
                if (prevVal && !val) return -100; 
                return ((val - prevVal) / prevVal) * 100;
            };

            if (cur.IN) {
                const c = cur.IN,
                    p = prevMap.IN || {};
                response.inbound.totalCalls = {
                    value: Number(c.totalCalls),
                    pct: calcPct(c.totalCalls, p.totalCalls || 0),
                };
                response.inbound.answered = {
                    value: Number(c.answered),
                    pct: calcPct(c.answered, p.answered || 0),
                };
                response.inbound.missed = {
                    value: Number(c.missed),
                    pct: calcPct(c.missed, p.missed || 0),
                };
            }

            if (cur.OUT) {
                const c = cur.OUT,
                    p = prevMap.OUT || {};
                response.outbound.totalCalls = {
                    value: Number(c.totalCalls),
                    pct: calcPct(c.totalCalls, p.totalCalls || 0),
                };
                response.outbound.answered = {
                    value: Number(c.answered),
                    pct: calcPct(c.answered, p.answered || 0),
                };
                response.outbound.notAnswered = {
                    value: Number(c.notAnswered),
                    pct: calcPct(c.notAnswered, p.notAnswered || 0),
                };
                response.outbound.busy = {
                    value: Number(c.busy),
                    pct: calcPct(c.busy, p.busy || 0),
                };
                response.outbound.notReachable = {
                    value: Number(c.notReachable),
                    pct: calcPct(c.notReachable, p.notReachable || 0),
                };
            }

            const curTotal = Number(cur.IN?.totalCalls || 0) + Number(cur.OUT?.totalCalls || 0);
            const prevTotal = Number(prevMap.IN?.totalCalls || 0) + Number(prevMap.OUT?.totalCalls || 0);

            response.summary.totalCalls = { value: curTotal, pct: calcPct(curTotal, prevTotal) };

            return response;
        };

        const response = buildResponse(resultCurrent, resultPrev);

        await transaction.commit();
        return res.status(status.OK).json({ data: response });
    } catch (err) {
        console.error(err);
        await transaction.rollback();
        return common.throwException(err, 'fetch Call Details Api', req, res);
    }
};

exports.inboundCallbackAnalysis = async (req, res) => {
    try {
        const { fromDate, toDate, agentId } = req.body;
        const tenantId = req.user?.tenantId;

        if (!tenantId) {
            return res.status(status.BadRequest).json({ message: 'tenantId missing in request' });
        }

        const whereClause = {
            callType: 'IN',
            tenantId: tenantId,
        };

        if (fromDate && toDate) {
            whereClause.callStartTime = {
                [Op.between]: [new Date(fromDate), new Date(toDate)],
            };
        }

        if (agentId) {
            whereClause.agentId = agentId;
        }

        const calls = await db.CallDetails.findAll({
            where: whereClause,
            attributes: { exclude: ['createdBy', 'updatedBy', 'deletedBy'] },
            disableTenantCheck: true,
        });

        let missed = 0;
        let callback = 0;
        let callbackPending = 0;

        calls.forEach((call) => {
            if (call.callStatus === 'MISSED' || call.callStatus === 'NOT ANSWERED') {
                missed += 1;
                if (call.callBack === 'YES') {
                    callback += 1;
                } else {
                    callbackPending += 1;
                }
            }
        });

        return res.json({ missed, callback, callbackPending });
    } catch (error) {
        console.error(error);
        return res.status(status.BadRequest).json({ message: 'Something went wrong' });
    }
};

exports.getCallSummaryByState = async (req, res) => {
    try {
        const { fromDate, toDate, agentId } = req.body;
        const tenantId = req.user?.tenantId;

        if (!tenantId) {
            return res.status(status.BadRequest).json({ message: 'tenantId missing in request' });
        }

        const whereClause = {
            tenantId,
        };

        if (fromDate && toDate) {
            whereClause.callStartTime = {
                [Op.between]: [new Date(fromDate), new Date(toDate)],
            };
        }

        if (agentId) {
            whereClause.agentId = agentId;
        }

        const summary = await db.CallDetails.findAll({
            attributes: [
                'stationId',
                [Sequelize.fn('SUM', Sequelize.literal(`CASE WHEN callType = 'IN' THEN 1 ELSE 0 END`)), 'inbound'],
                [Sequelize.fn('SUM', Sequelize.literal(`CASE WHEN callType = 'OUT' THEN 1 ELSE 0 END`)), 'outbound'],
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'totalCalls'],
            ],
            where: whereClause,
            group: ['stationId'],
            disableTenantCheck: true,
        });

        res.status(status.OK).json({
            success: true,
            data: summary,
        });
    } catch (error) {
        console.error(error);
        res.status(status.InternalServerError).json({ success: false, message: 'Something went wrong', error });
    }
};

exports.getCallTrend = async (req, res) => {
    try {
        let { fromDate, toDate, agentId } = req.body;

        if (!fromDate || !toDate) {
            return res.status(status.BadRequest).json({
                success: false,
                message: 'fromDate and toDate are required',
            });
        }

        const start = new Date(fromDate);
        const end = new Date(toDate);

        // If same date, show last 7 days trend
        if (start.toDateString() === end.toDateString()) {
            end.setHours(23, 59, 59, 999);
            start.setDate(start.getDate() - 6);
        }

        // Build where clause
        const whereClause = {
            callStartTime: { [Op.between]: [start, end] },
        };

        if (agentId) {
            whereClause.agentId = agentId;
        }

        const results = await db.CallDetails.findAll({
            attributes: [
                [Sequelize.fn('DATE', Sequelize.col('callStartTime')), 'date'],
                [Sequelize.fn('SUM', Sequelize.literal(`CASE WHEN callStatus = 'ANSWERED' THEN 1 ELSE 0 END`)), 'answered'],
                [Sequelize.fn('SUM', Sequelize.literal(`CASE WHEN callStatus = 'NOT ANSWERED' THEN 1 ELSE 0 END`)), 'noAnswered'],
                [Sequelize.fn('SUM', Sequelize.literal(`CASE WHEN callStatus = 'NOT-REACHABLE' THEN 1 ELSE 0 END`)), 'notReachable'],
                [Sequelize.fn('SUM', Sequelize.literal(`CASE WHEN callStatus = 'BUSY' THEN 1 ELSE 0 END`)), 'busy'],
                [Sequelize.fn('SUM', Sequelize.literal(`CASE WHEN callStatus = 'MISSED' THEN 1 ELSE 0 END`)), 'missed'],
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'total'],
            ],
            where: whereClause,
            disableTenantCheck: true,
            group: [Sequelize.fn('DATE', Sequelize.col('callStartTime'))],
            order: [[Sequelize.fn('DATE', Sequelize.col('callStartTime')), 'ASC']],
        });

        const dbData = results.map((r) => r.get({ plain: true }));

        let trend = [];
        let loopDate = new Date(start);

        while (loopDate <= end) {
            const dateStr = loopDate.toISOString().split('T')[0];

            const dayData = dbData.find((d) => d.date === dateStr);

            trend.push({
                date: dateStr,
                answered: dayData ? parseInt(dayData.answered) : 0,
                noAnswered: dayData ? parseInt(dayData.noAnswered) : 0,
                notReachable: dayData ? parseInt(dayData.notReachable) : 0,
                busy: dayData ? parseInt(dayData.busy) : 0,
                missed: dayData ? parseInt(dayData.missed) : 0,
                total: dayData ? parseInt(dayData.total) : 0,
            });

            loopDate.setDate(loopDate.getDate() + 1);
        }

        res.status(status.OK).json({ success: true, data: trend });
    } catch (error) {
        console.error(error);
        res.status(status.InternalServerError).json({
            success: false,
            message: 'Something went wrong',
            error,
        });
    }
};

exports.getCallInsights = async (req, res) => {
    try {
        let { fromDate, toDate, agentId, callType, type } = req.body;

        const whereClause = {
            callStartTime: {
                [Op.between]: [new Date(fromDate), new Date(toDate)],
            },
        };

        if (agentId) {
            whereClause.agentId = agentId;
        }
        if (callType) {
            whereClause.callType = callType.toUpperCase();
        }

        let attributes = [
            [Sequelize.col('callingNumber'), 'callerNumber'],
            [Sequelize.col('calledNumber'), 'receiverNumber'],
        ];

        if (type === 'callCount') {
            attributes.push([Sequelize.fn('COUNT', Sequelize.col('id')), 'count']);
        } else if (type === 'talkTime') {
            attributes.push([Sequelize.fn('SEC_TO_TIME', Sequelize.fn('SUM', Sequelize.col('conversationDuration'))), 'callDuration']);
        } else {
            return res.status(status.BadRequest).json({
                success: false,
                message: "Invalid type. Use 'callCount' or 'talkTime'.",
            });
        }

        const results = await db.CallDetails.findAll({
            attributes: [[Sequelize.fn('MIN', Sequelize.col('id')), 'id'], ...attributes],
            where: whereClause,
            group: ['callingNumber', 'calledNumber'],
            order: [[Sequelize.literal(type === 'callCount' ? 'count' : 'callDuration'), 'DESC']],
            limit: 5,
            disableTenantCheck: true,
        });

        const formatted = results.map((row, i) => ({
            srNo: i + 1,
            ...row.dataValues,
        }));

        res.status(status.OK).json({ success: true, data: formatted });
    } catch (error) {
        console.error(error);
        res.status(status.InternalServerError).json({
            success: false,
            message: 'Something went wrong',
            error,
        });
    }
};

exports.getCallbackAndMissedOverview = async (req, res) => {
    try {
        let { fromDate, toDate, agentId, type } = req.body;

        if (!['topMissedCalls', 'topPendingCallbacks'].includes(type)) {
            return res.status(status.BadRequest).json({
                success: false,
                message: "type must be either 'topMissedCalls' or 'topPendingCallbacks'",
            });
        }

        const whereClause = {
            callStartTime: {
                [Op.between]: [new Date(fromDate), new Date(toDate)],
            },
        };

        if (agentId) {
            whereClause.agentId = agentId;
        }

        if (type === 'topMissedCalls') {
            whereClause.callStatus = 'MISSED';
        } else if (type === 'topPendingCallbacks') {
            whereClause.callBack = 'YES';
            whereClause.callStatus = { [Op.ne]: 'ANSWERED' };
        }

        const results = await db.CallDetails.findAll({
            attributes: [
                [Sequelize.fn('MIN', Sequelize.col('id')), 'id'],
                'callingNumber',
                'agentId',
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
            ],
            where: whereClause,
            disableTenantCheck: true,
            group: ['callingNumber', 'agentId'],
            order: [[Sequelize.literal('count'), 'DESC']],
            limit: 5,
        });

        const formatted = results.map((row, i) => ({
            srNo: i + 1,
            id: row.dataValues.id,
            simNumber: row.callingNumber,
            count: row.dataValues.count,
        }));

        res.status(status.OK).json({
            success: true,
            type,
            data: formatted,
        });
    } catch (error) {
        console.error(error);
        res.status(status.InternalServerError).json({
            success: false,
            message: 'Something went wrong',
            error,
        });
    }
};

exports.getCallDetailsById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(status.BadRequest).json({
                success: false,
                message: 'CallDetails ID is required',
            });
        }

        const callDetail = await db.CallDetails.findOne({
            attributes: [
                'id',
                'sourcePbxCallId',
                'agentId',
                'callingNumber',
                'calledNumber',
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
                'tenantId',
                'createdAt',
                'updatedAt',
                'deletedAt',
            ],
            where: { id },
            disableTenantCheck: true,
        });

        if (!callDetail) {
            return res.status(status.NotFound).json({
                success: false,
                message: 'CallDetails not found',
            });
        }

        res.status(status.OK).json({
            success: true,
            data: callDetail,
        });
    } catch (error) {
        console.error(error);
        res.status(status.InternalServerError).json({
            success: false,
            message: 'Something went wrong',
            error,
        });
    }
};
