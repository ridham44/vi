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

        if (Array.isArray(simNumber) && simNumber.length > 0) {
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

        // const getPreviousDateRange = async (fromDate, toDate) => {
        //     // Convert to Date objects
        //     const start = new Date(fromDate);
        //     const end = new Date(toDate);

        //     // Calculate range length in days (inclusive)
        //     const diffTime = end.getTime() - start.getTime();
        //     const daysCount = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

        //     // Subtract the same number of days from both
        //     const prevStart = new Date(start);
        //     prevStart.setDate(start.getDate() - daysCount);

        //     const prevEnd = new Date(end);
        //     prevEnd.setDate(end.getDate() - daysCount);

        //     // Format YYYY-MM-DD
        //     // const formatDate = (d) => d.toISOString().split('T')[0]; // returns YYYY-MM-DD
        //     // console.log('past date', prevStart);

        //     return {
        //         startDate: prevStart,
        //         endDate: prevEnd,
        //     };
        // };

        const stats = await db.CallDetails.findOne({
            attributes: [
                [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'totalCalls'],
                [db.sequelize.fn('COALESCE', db.sequelize.fn('SUM', db.sequelize.literal("callType = 'IN'")), 0), 'inboundCalls'],
                [db.sequelize.fn('COALESCE', db.sequelize.fn('SUM', db.sequelize.literal("callType = 'OUT'")), 0), 'outboundCalls'],
                [db.sequelize.fn('COALESCE', db.sequelize.fn('SUM', db.sequelize.literal("callStatus = 'ANSWERED'")), 0), 'answeredCalls'],
                // [
                //     db.sequelize.fn(
                //         'COALESCE',
                //         db.sequelize.fn(
                //             'SUM',
                //             db.sequelize.literal("CASE WHEN callStatus = 'ANSWERED' AND callType = 'IN' THEN 1 ELSE 0 END")
                //         ),
                //         0
                //     ),
                //     'inansweredCalls',
                // ],
                // [
                //     db.sequelize.fn(
                //         'COALESCE',
                //         db.sequelize.fn(
                //             'SUM',
                //             db.sequelize.literal("CASE WHEN callStatus = 'ANSWERED' AND callType = 'OUT' THEN 1 ELSE 0 END")
                //         ),
                //         0
                //     ),
                //     'outansweredCalls',
                // ],
                [
                    db.sequelize.fn('COALESCE', db.sequelize.fn('SUM', db.sequelize.literal("callStatus = 'NOT ANSWERED'")), 0),
                    'notAnsweredCalls',
                ],
                [db.sequelize.fn('COALESCE', db.sequelize.fn('SUM', db.sequelize.literal("callStatus = 'MISSED'")), 0), 'missedCalls'],
                [db.sequelize.fn('COALESCE', db.sequelize.fn('SUM', db.sequelize.literal("callStatus = 'BUSY'")), 0), 'busyCalls'],
                [
                    db.sequelize.fn('COALESCE', db.sequelize.fn('SUM', db.sequelize.literal("callStatus = 'NOT-REACHABLE'")), 0),
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
                [db.sequelize.literal(`SEC_TO_TIME(conversationDuration)`), 'conversationDuration'],
                // [
                //     db.sequelize.literal(`(
                //         SELECT "name"
                //         FROM "Phones"
                //         WHERE "Phones"."number" = "CallDetails"."agentId"
                //         LIMIT 1
                //     )`),
                //     'agentName',
                // ],
            ],
            where: whereClause,
            limit: limit,
            disableTenantCheck: true,
        });
        // console.log('past count', pastCount.pasttotalCalls, 'curren count', stats.totalCalls);

        const formattedStats = {
            inbound: Number(stats.inboundCalls) || 0,
            outbound: Number(stats.outboundCalls) || 0,
            answered: Number(stats.answeredCalls) || 0,
            not_answered: Number(stats.notAnsweredCalls) || 0,
            missed: Number(stats.missedCalls) || 0,
            busy: Number(stats.busyCalls) || 0,
            // in_answerd: Number(stats.inansweredCalls) || 0,
            // out_answerd: Number(stats.outansweredCalls) || 0,
            not_reachable: Number(stats.notReachableCalls) || 0,
            total_calls: Number(stats.totalCalls) || 0,
            // total_calls_percentage:
            //     pastCount.pasttotalCalls > 0
            //         ? ((Number(stats.totalCalls) - Number(pastCount.pasttotalCalls)) / Number(pastCount.pasttotalCalls)) * 100
            //         : 0,
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
    try {
        const { fromDate, toDate, callType, agentId } = req.body;
        const timezone = req.headers['timezone'] || 'UTC';

        const tenantId = req.user.tenantId;
        const whereClause = { tenantId, deletedAt: null };

        // Convert dates to UTC based on timezone
        let startUtc, endUtc;
        if (fromDate && toDate) {
            startUtc = moment.tz(fromDate, timezone).startOf('day').utc().toDate();
            endUtc = moment.tz(toDate, timezone).endOf('day').utc().toDate();

            whereClause.callStartTime = {
                [Op.between]: [startUtc, endUtc],
            };
        }

        if (callType && callType !== 'BOTH') whereClause.callType = callType;
        if (agentId) whereClause.agentId = agentId;

        // Helper to fetch grouped stats
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

        // Current stats
        const resultCurrent = await fetchStats(whereClause);

        // Calculate previous range
        const diffDays = moment(endUtc).diff(moment(startUtc), 'days') + 1;

        let prevFromUtc, prevToUtc;
        if (diffDays === 1) {
            // Previous single day
            prevFromUtc = moment(startUtc).subtract(1, 'day').startOf('day').toDate();
            prevToUtc = moment(startUtc).subtract(1, 'day').endOf('day').toDate();
        } else {
            // Previous same-length period
            prevFromUtc = moment(startUtc).subtract(diffDays, 'days').toDate();
            prevToUtc = moment(endUtc).subtract(diffDays, 'days').toDate();
        }

        const wherePrev = {
            ...whereClause,
            callStartTime: { [Op.between]: [prevFromUtc, prevToUtc] },
        };
        const resultPrev = await fetchStats(wherePrev);

        // Unique calls
        const uniqueCalls = await db.CallDetails.count({
            distinct: true,
            col: 'callingNumber',
            where: {
                ...whereClause,
                deletedAt: null,
            },
            disableTenantCheck: true,
        });

        // Response builder
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
        const timezone = req.headers['timezone'] || 'UTC';

        if (!tenantId) {
            return res.status(status.BadRequest).json({ message: 'tenantId missing in request' });
        }

        const whereClause = {
            callType: 'IN',
            tenantId: tenantId,
        };

        if (fromDate && toDate) {
            const startUtc = moment.tz(fromDate, timezone).utc().toDate();
            const endUtc = moment.tz(toDate, timezone).utc().toDate();

            whereClause.callStartTime = {
                [Op.between]: [startUtc, endUtc],
            };
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
        const timezone = req.headers['timezone'] || 'UTC';

        if (!tenantId) {
            return res.status(status.BadRequest).json({ message: 'tenantId missing in request' });
        }

        const whereClause = {
            tenantId,
        };

        if (fromDate && toDate) {
            const startUtc = moment.tz(fromDate, timezone).utc().toDate();
            const endUtc = moment.tz(toDate, timezone).utc().toDate();

            whereClause.callStartTime = {
                [Op.between]: [startUtc, endUtc],
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
        const timezone = req.headers['timezone'] || 'UTC';

        if (!fromDate || !toDate) {
            return res.status(status.BadRequest).json({
                success: false,
                message: 'fromDate and toDate are required',
            });
        }

        let start = moment.tz(fromDate, timezone).startOf('day').utc().toDate();
        let end = moment.tz(toDate, timezone).endOf('day').utc().toDate();

        // If same date, show last 7 days trend (based on client’s timezone)
        if (moment.tz(fromDate, timezone).isSame(moment.tz(toDate, timezone), 'day')) {
            end = moment.tz(toDate, timezone).endOf('day').utc().toDate();
            start = moment.tz(toDate, timezone).subtract(6, 'days').startOf('day').utc().toDate();
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
            where: {
                ...whereClause,
                deletedAt: null,
                tenantId,
            },
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
        const tenantId = req.user?.tenantId;
        const timezone = req.headers['timezone'] || 'UTC';

        if (!tenantId) {
            return res.status(status.BadRequest).json({
                success: false,
                message: 'tenantId missing in request',
            });
        }

        // Initialize where clause
        const whereClause = { tenantId };

        // Date filtering with timezone conversion
        if (fromDate && toDate) {
            const startUtc = moment.tz(fromDate, timezone).startOf('day').utc().toDate();
            const endUtc = moment.tz(toDate, timezone).endOf('day').utc().toDate();

            whereClause.callStartTime = {
                [Op.between]: [startUtc, endUtc],
            };
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
        const timezone = req.headers['timezone'] || 'UTC';

        if (!['topMissedCalls', 'topPendingCallbacks'].includes(type)) {
            return res.status(status.BadRequest).json({
                success: false,
                message: "type must be either 'topMissedCalls' or 'topPendingCallbacks'",
            });
        }

        // Initialize where clause
        const whereClause = { tenantId };

        // Date filtering with timezone conversion
        if (fromDate && toDate) {
            const startUtc = moment.tz(fromDate, timezone).startOf('day').utc().toDate();
            const endUtc = moment.tz(toDate, timezone).endOf('day').utc().toDate();

            whereClause.callStartTime = {
                [Op.between]: [startUtc, endUtc],
            };
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
