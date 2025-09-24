require('dotenv').config();
const { Sequelize, fn, literal } = require('sequelize');
const Op = Sequelize.Op;
const db = require('../../../db/models');
const { status, common } = require('../../../../utils');
const moment = require('moment-timezone');

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
        const timezone = req.headers['timezone'] || 'UTC';
        const {
            fromDate,
            toDate,
            startTime,
            endTime,
            callType,
            callStatus,
            callBack,
            departmentId,
            simNumber,
            callNumber,
            minDuration,
            maxDuration,
            limit,
        } = req.body;

        const whereConditions = [{ tenantId: req.user.tenantId }, { deletedAt: null }];

        if (fromDate) {
            const startOfDayUTC = moment.tz(fromDate, timezone).startOf('day').utc().toDate();
            const endOfDayUTC = moment
                .tz(toDate || fromDate, timezone)
                .endOf('day')
                .utc()
                .toDate();

            whereConditions.push({
                callStartTime: { [Op.between]: [startOfDayUTC, endOfDayUTC] },
            });
        }

        if (startTime && endTime) {
            const startTimeOnly = moment.utc(startTime).format('HH:mm:ss');
            const endTimeOnly = moment.utc(endTime).format('HH:mm:ss');

            const timeFilter =
                startTimeOnly > endTimeOnly
                    ? { [Op.or]: [{ [Op.gte]: startTimeOnly }, { [Op.lte]: endTimeOnly }] }
                    : { [Op.between]: [startTimeOnly, endTimeOnly] };

            whereConditions.push(Sequelize.where(Sequelize.fn('TIME', Sequelize.col('callStartTime')), timeFilter));
        }

        if (callType) whereConditions.push({ callType });
        if (callStatus) whereConditions.push({ callStatus });
        if (callBack) whereConditions.push({ callBack });
        if (departmentId) whereConditions.push({ departmentId });

        if (Array.isArray(simNumber) && simNumber.length > 0) {
            const phones = await db.Phones.findAll({
                attributes: ['number'],
                where: { id: { [Op.in]: simNumber } },
                raw: true,
                disableTenantCheck: true,
            });
            const phoneNumbers = phones.map((p) => p.number);
            whereConditions.push({ agentId: { [Op.in]: phoneNumbers } });
        }

        if (callNumber) {
            whereConditions.push({
                [Op.or]: [{ callingNumber: { [Op.like]: `%${callNumber}%` } }, { calledNumber: { [Op.like]: `%${callNumber}%` } }],
            });
        }

        if (minDuration !== undefined && maxDuration !== undefined) {
            whereConditions.push({ conversationDuration: { [Op.between]: [minDuration, maxDuration] } });
        }

        const whereClause = { [Op.and]: whereConditions };

        const stats = await db.CallDetails.findOne({
            attributes: [
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'totalCalls'],
                [Sequelize.literal("SUM(CASE WHEN callType = 'IN' THEN 1 ELSE 0 END)"), 'inboundCalls'],
                [Sequelize.literal("SUM(CASE WHEN callType = 'OUT' THEN 1 ELSE 0 END)"), 'outboundCalls'],
                [Sequelize.literal("SUM(CASE WHEN callStatus = 'ANSWERED' THEN 1 ELSE 0 END)"), 'answeredCalls'],
                [Sequelize.literal("SUM(CASE WHEN callStatus = 'NOT ANSWERED' THEN 1 ELSE 0 END)"), 'notAnsweredCalls'],
                [Sequelize.literal("SUM(CASE WHEN callStatus = 'MISSED' THEN 1 ELSE 0 END)"), 'missedCalls'],
                [Sequelize.literal("SUM(CASE WHEN callStatus = 'BUSY' THEN 1 ELSE 0 END)"), 'busyCalls'],
                [Sequelize.literal("SUM(CASE WHEN callStatus = 'NOT-REACHABLE' THEN 1 ELSE 0 END)"), 'notReachableCalls'],
            ],
            where: whereClause,
            disableTenantCheck: true,
            raw: true,
        });

        const callDetails = await db.CallDetails.findAll({
            attributes: [
                'sourcePbxCallId',
                'agentId',
                'callType',
                'callBack',
                'callConnected',
                'callStartTime',
                'callEndTime',
                'callStatus',
                'ringDuration',
                'voiceFilePath',
                'stationId',
                [
                    Sequelize.literal(`CASE WHEN callType = 'IN' THEN callingNumber WHEN callType = 'OUT' THEN calledNumber ELSE NULL END`),
                    'caller',
                ],
                [Sequelize.literal(`SEC_TO_TIME(conversationDuration)`), 'conversationDuration'],
            ],
            where: whereClause,
            limit: limit ? parseInt(limit, 10) : undefined,
            order: [['callStartTime', 'DESC']],
            disableTenantCheck: true,
            raw: true,
        });

        const formattedCallDetails = callDetails.map((call) => ({
            ...call,
            callStartTime: call.callStartTime ? moment(call.callStartTime).tz(timezone).format('YYYY-MM-DD HH:mm:ss') : null,
            callEndTime: call.callEndTime ? moment(call.callEndTime).tz(timezone).format('YYYY-MM-DD HH:mm:ss') : null,
        }));

        const formattedStats = {
            inbound: Number(stats?.inboundCalls) || 0,
            outbound: Number(stats?.outboundCalls) || 0,
            answered: Number(stats?.answeredCalls) || 0,
            not_answered: Number(stats?.notAnsweredCalls) || 0,
            missed: Number(stats?.missedCalls) || 0,
            busy: Number(stats?.busyCalls) || 0,
            not_reachable: Number(stats?.notReachableCalls) || 0,
            total_calls: Number(stats?.totalCalls) || 0,
        };

        return res.status(status.OK).json({
            data: {
                call_details: {
                    counts: formattedStats,
                    data: formattedCallDetails,
                },
            },
        });
    } catch (err) {
        console.error('Error in callFilter API:', err);
        return common.throwException(err, 'fetch Call Details Api', req, res);
    }
};

exports.voiceActivity = async (req, res) => {
    try {
        const { fromDate, toDate, callType, agentId } = req.body;

        const tenantId = req.user.tenantId;
        const whereClause = { tenantId, deletedAt: null };

        if (fromDate || toDate) {
            const conditions = [];

            if (fromDate) {
                conditions.push({
                    callStartTime: { [Op.gte]: fromDate },
                });
            }

            if (toDate) {
                conditions.push({
                    callStartTime: { [Op.lte]: toDate },
                });
            }

            whereClause[Op.or] = conditions;
        }

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

        const diffDays = moment(toDate).diff(moment(fromDate), 'days') + 1;

        let prevFromUtc, prevToUtc;
        if (diffDays === 1) {
            prevFromUtc = moment(fromDate).subtract(1, 'day').startOf('day').toDate();
            prevToUtc = moment(fromDate).subtract(1, 'day').endOf('day').toDate();
        } else {
            prevFromUtc = moment(fromDate).subtract(diffDays, 'days').toDate();
            prevToUtc = moment(toDate).subtract(diffDays, 'days').toDate();
        }

        const wherePrev = {
            ...whereClause,
            callStartTime: { [Op.between]: [prevFromUtc, prevToUtc] },
        };
        const resultPrev = await fetchStats(wherePrev);

        const uniqueCalls = await db.CallDetails.count({
            distinct: true,
            col: 'callingNumber',
            where: {
                ...whereClause,
                deletedAt: null,
            },
            disableTenantCheck: true,
        });

        const buildResponse = (current, prev) => {
            const response = {
                inbound: { totalCalls: 0, answered: 0, missed: 0 },
                outbound: { totalCalls: 0, answered: 0, notAnswered: 0, busy: 0, notReachable: 0 },
                summary: { totalCalls: 0, uniqueCalls },
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

            response.summary.totalCalls = Number(cur.IN?.totalCalls || 0) + Number(cur.OUT?.totalCalls || 0);

            return response;
        };

        const response = buildResponse(resultCurrent, resultPrev);

        return res.status(status.OK).json({ data: response });
    } catch (err) {
        console.error(err);
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

        if (fromDate || toDate) {
            const conditions = [];

            if (fromDate) {
                conditions.push({
                    callStartTime: { [Op.gte]: fromDate },
                });
            }

            if (toDate) {
                conditions.push({
                    callStartTime: { [Op.lte]: toDate },
                });
            }

            whereClause[Op.or] = conditions;
        }

        if (agentId) {
            whereClause.agentId = agentId;
        }

        const calls = await db.CallDetails.findAll({
            where: {
                ...whereClause,
                deletedAt: null,
            },
            attributes: { exclude: ['createdBy', 'updatedBy', 'deletedBy'] },
            disableTenantCheck: true,
        });

        let missed = 0;
        let callback = 0;
        let callbackPending = 0;

        calls.forEach((call) => {
            const status = (call.callStatus || '').toUpperCase().trim();
            const callbackFlag = (call.callBack || '').toUpperCase().trim();

            if (status === 'MISSED' || status === 'NOT ANSWERED') {
                missed += 1;
                if (callbackFlag === 'YES') {
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

        if (fromDate || toDate) {
            const conditions = [];

            if (fromDate) {
                conditions.push({
                    callStartTime: { [Op.gte]: fromDate },
                });
            }

            if (toDate) {
                conditions.push({
                    callStartTime: { [Op.lte]: toDate },
                });
            }

            whereClause[Op.or] = conditions;
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
            where: {
                ...whereClause,
                deletedAt: null,
            },
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
        const tenantId = req.user?.tenantId;

        if (!fromDate) {
            return res.status(status.BadRequest).json({
                success: false,
                message: 'fromDate is required',
            });
        }

        const fromDay = moment.utc(fromDate).format('YYYY-MM-DD');
        const toDay = toDate ? moment.utc(toDate).format('YYYY-MM-DD') : fromDay;

        let start;
        let end;

        if (fromDay === toDay) {
            // Same day → last 7 days
            start = moment.utc(fromDate).subtract(6, 'days').startOf('day').toDate();
            end = moment.utc(fromDate).endOf('day').toDate();
        } else {
            start = new Date(fromDate);
            end = toDate ? new Date(toDate) : new Date(fromDate);
        }

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
            where: {
                ...whereClause,
                deletedAt: null,
                tenantId,
            },
            disableTenantCheck: true,
            group: [Sequelize.fn('DATE', Sequelize.col('callStartTime'))],
            order: [[Sequelize.fn('DATE', Sequelize.col('callStartTime')), 'ASC']],
        });

        // Map DB results by date string
        const dbMap = {};
        results.forEach((r) => {
            const d = r.get({ plain: true });
            dbMap[d.date] = {
                answered: parseInt(d.answered),
                noAnswered: parseInt(d.noAnswered),
                notReachable: parseInt(d.notReachable),
                busy: parseInt(d.busy),
                missed: parseInt(d.missed),
                total: parseInt(d.total),
            };
        });

        // Generate trend for last 7 days
        const trend = [];
        let loopDate = moment.utc(start);
        const loopEnd = moment.utc(end);

        while (loopDate.isSameOrBefore(loopEnd, 'day')) {
            const dateStr = loopDate.format('YYYY-MM-DD');

            trend.push({
                date: dateStr,
                answered: dbMap[dateStr]?.answered || 0,
                noAnswered: dbMap[dateStr]?.noAnswered || 0,
                notReachable: dbMap[dateStr]?.notReachable || 0,
                busy: dbMap[dateStr]?.busy || 0,
                missed: dbMap[dateStr]?.missed || 0,
                total: dbMap[dateStr]?.total || 0,
            });

            loopDate.add(1, 'day');
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
        const tenantId = req.user?.tenantId;

        if (!tenantId) {
            return res.status(status.BadRequest).json({
                success: false,
                message: 'tenantId missing in request',
            });
        }

        const whereClause = { tenantId };

        if (fromDate || toDate) {
            const conditions = [];

            if (fromDate) {
                conditions.push({
                    callStartTime: { [Op.gte]: fromDate },
                });
            }

            if (toDate) {
                conditions.push({
                    callStartTime: { [Op.lte]: toDate },
                });
            }

            whereClause[Op.or] = conditions;
        }

        if (agentId) {
            whereClause.agentId = agentId;
        }
        if (callType) {
            whereClause.callType = callType.toUpperCase();
        }

        // Base attributes
        let attributes = [
            [Sequelize.col('callingNumber'), 'callerNumber'],
            [Sequelize.col('calledNumber'), 'receiverNumber'],
        ];

        if (type === 'callCount') {
            attributes.push([Sequelize.fn('COUNT', Sequelize.col('id')), 'count']);
        } else if (type === 'talkTime') {
            attributes.push([Sequelize.fn('SEC_TO_TIME', Sequelize.fn('SUM', Sequelize.col('conversationDuration'))), 'callDuration']);
            attributes.push([Sequelize.fn('SUM', Sequelize.col('conversationDuration')), 'durationSeconds']);
        } else {
            return res.status(status.BadRequest).json({
                success: false,
                message: "Invalid type. Use 'callCount' or 'talkTime'.",
            });
        }

        const results = await db.CallDetails.findAll({
            attributes: [[Sequelize.fn('MIN', Sequelize.col('id')), 'id'], ...attributes],
            where: {
                ...whereClause,
                deletedAt: null,
            },
            group: ['callingNumber', 'calledNumber'],
            order: [[Sequelize.literal(type === 'callCount' ? 'count' : 'durationSeconds'), 'DESC']],
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
        const tenantId = req.user?.tenantId;

        if (!['topMissedCalls', 'topPendingCallbacks'].includes(type)) {
            return res.status(status.BadRequest).json({
                success: false,
                message: "type must be either 'topMissedCalls' or 'topPendingCallbacks'",
            });
        }

        const whereClause = { tenantId };

        if (fromDate || toDate) {
            const conditions = [];

            if (fromDate) {
                conditions.push({
                    callStartTime: { [Op.gte]: fromDate },
                });
            }

            if (toDate) {
                conditions.push({
                    callStartTime: { [Op.lte]: toDate },
                });
            }

            whereClause[Op.or] = conditions;
        }

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
            where: {
                ...whereClause,
                deletedAt: null,
            },
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
