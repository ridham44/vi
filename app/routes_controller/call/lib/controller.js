require('dotenv').config();
const { Sequelize, fn, literal } = require('sequelize');
const Op = Sequelize.Op;
const db = require('../../../db/models');
const { status, common } = require('../../../../utils');
const moment = require('moment');

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
        await transaction.rollback();
        return common.throwException(err, 'fetch Call Details Api', req, res);
    }
};
// exports.callFilter = async (req, res) => {
//    try {
//     console.log("CALL FILTER CALLED+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++");
    
//         const {
//             callType,
//             callStatus,
//             callBack,
//             departmentId,
//             // agentId,
//             fromDate,
//             toDate,
//             startTime,
//             endTime,
//             simNumber,
//             callNumber,
//             minDuration,
//             maxDuration,
//             limit,
//             searchInArchive,
//         } = req.body;
 
//         // let { timezone = 'Asia/Kolkata' } = req.headers;
            
//         // console.log("fromDate===>",fromDate);
//         // console.log("toDate===>",toDate);

//         // console.log("startTime===>",startTime);
//         // console.log("endTime===>",endTime);

        
//         // fromDate = moment(fromDate).tz(timezone).startOf('day').utc().format();
//         // toDate = moment(toDate).tz(timezone).endOf('day').utc().format();
 
//         // fromTime = moment(startTime).tz(timezone).startOf('day').utc().format();
//         // endTime = moment(endTime).tz(timezone).endOf('day').utc().format();

//         // console.log("fromDate===>",fromDate);
//         // console.log("toDate===>",toDate);

//         // console.log("startTime===>",startTime);
//         // console.log("endTime===>",endTime);
//         const whereClause = { tenantId: req.user.tenantId, deletedAt: null };
 
//         if (fromDate && toDate) {
//             whereClause.callStartTime = {
//                 [Op.between]: [fromDate, toDate],
//             };
//         }
 
//         if (startTime && endTime) {
//             whereClause[Op.and] = [
//                 Sequelize.where(Sequelize.fn('TIME', Sequelize.col('callStartTime')), {
//                     [Op.between]: [fromTime, endTime],
//                 }),
//             ];
//         }
 
//         if (callType) {
//             whereClause.callType = callType;
//         }
 
//         if (callStatus) {
//             whereClause.callStatus = callStatus;
//         }
 
//         if (callBack) {
//             whereClause.callBack = callBack;
//         }
 
//         if (departmentId) {
//             whereClause.departmentId = departmentId;
//         }
 
//         // if (agentId) {
//         //     whereClause.agentId = agentId;
//         // }
 
//         if (simNumber.length > 0) {
//             const phones = await db.Phones.findAll({
//                 attributes: ['number'],
//                 where: {
//                     id: {
//                         [Op.in]: simNumber,
//                     },
//                 },  
                
//                 raw: true,
//                 disableTenantCheck: true,
//                 logging: console.log,
//             });
//             const phoneNumbers = phones.map((p) => p.number);
 
//             whereClause.agentId = { [Op.in]: phoneNumbers };
//         }
 

//         if (callNumber) {
//             whereClause[Op.or] = [{ callingNumber: { [Op.like]: `%${callNumber}%` } }, { calledNumber: { [Op.like]: `%${callNumber}%` } }];
//         }

//         if (minDuration !== undefined && maxDuration !== undefined) {
//             whereClause.conversationDuration = {
//                 [Op.between]: [minDuration, maxDuration],
//             };
//         }

       
//         const stats = await db.CallDetails.findOne({
//             attributes: [
//                 [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'totalCalls'],
//                 [db.sequelize.fn('COALESCE', db.sequelize.fn('SUM', db.sequelize.literal("callType = 'IN'")), 0), 'inboundCalls'],
//                 [db.sequelize.fn('COALESCE', db.sequelize.fn('SUM', db.sequelize.literal("callType = 'OUT'")), 0), 'outboundCalls'],
//                 [db.sequelize.fn('COALESCE', db.sequelize.fn('SUM', db.sequelize.literal("callStatus = 'ANSWERED'")), 0), 'answeredCalls'],
//                 // [
//                 //     db.sequelize.fn(
//                 //         'COALESCE',
//                 //         db.sequelize.fn(
//                 //             'SUM',
//                 //             db.sequelize.literal("CASE WHEN callStatus = 'ANSWERED' AND callType = 'IN' THEN 1 ELSE 0 END")
//                 //         ),
//                 //         0
//                 //     ),
//                 //     'inansweredCalls',
//                 // ],
//                 // [
//                 //     db.sequelize.fn(
//                 //         'COALESCE',
//                 //         db.sequelize.fn(
//                 //             'SUM',
//                 //             db.sequelize.literal("CASE WHEN callStatus = 'ANSWERED' AND callType = 'OUT' THEN 1 ELSE 0 END")
//                 //         ),
//                 //         0
//                 //     ),
//                 //     'outansweredCalls',
//                 // ],
//                 [
//                     db.sequelize.fn('COALESCE', db.sequelize.fn('SUM', db.sequelize.literal("callStatus = 'NOT ANSWERED'")), 0),
//                     'notAnsweredCalls',
//                 ],
//                 [db.sequelize.fn('COALESCE', db.sequelize.fn('SUM', db.sequelize.literal("callStatus = 'MISSED'")), 0), 'missedCalls'],
//                 [db.sequelize.fn('COALESCE', db.sequelize.fn('SUM', db.sequelize.literal("callStatus = 'BUSY'")), 0), 'busyCalls'],
//                 [
//                     db.sequelize.fn('COALESCE', db.sequelize.fn('SUM', db.sequelize.literal("callStatus = 'NOT-REACHABLE'")), 0),
//                     'notReachableCalls',
//                 ],
//             ],
//             where: whereClause,
//             // limit: limit,
//             disableTenantCheck: true,
//             raw: true,
//         });

//         const result = await db.CallDetails.findAll({
//             attributes: [
//                 'sourcePbxCallId',
//                 'agentId',
//                 'callType',
//                 'callBack',
//                 'callConnected',
//                 'callStartTime',
//                 'callEndTime',
//                 'callStatus',
//                 'ringDuration',
//                 'voiceFilePath',
//                 'stationId',
//                 [
//                     db.sequelize.literal(`CASE 
//                         WHEN callType = 'IN' THEN callingNumber
//                         WHEN callType = 'OUT' THEN calledNumber
//                         ELSE NULL END`),
//                     'caller',
//                 ],
//                 [db.sequelize.literal(`SEC_TO_TIME(conversationDuration)`), 'conversationDuration'],
//                 [
//                     db.sequelize.literal(`(
//                       SELECT \`name\`
//                       FROM \`phones\`
//                       WHERE \`phones\`.\`number\` = \`CallDetails\`.\`agentId\`
//                       LIMIT 1
//                     )`),
//                     'agentName',
//                 ],
//             ],
//             where: whereClause,
//             // limit: limit,
//             disableTenantCheck: true,
//             logging:console.log,
//         });

        
//         // console.log('past count', pastCount.pasttotalCalls, 'curren count', stats.totalCalls);

//         const formattedStats = {
//             inbound: Number(stats.inboundCalls) || 0,
//             outbound: Number(stats.outboundCalls) || 0,
//             answered: Number(stats.answeredCalls) || 0,
//             not_answered: Number(stats.notAnsweredCalls) || 0,
//             missed: Number(stats.missedCalls) || 0,
//             busy: Number(stats.busyCalls) || 0,
//             // in_answerd: Number(stats.inansweredCalls) || 0,
//             // out_answerd: Number(stats.outansweredCalls) || 0,
//             not_reachable: Number(stats.notReachableCalls) || 0,
//             total_calls: Number(stats.totalCalls) || 0,
//             // total_calls_percentage:
//             //     pastCount.pasttotalCalls > 0
//             //         ? ((Number(stats.totalCalls) - Number(pastCount.pasttotalCalls)) / Number(pastCount.pasttotalCalls)) * 100
//             //         : 0,
//         };
//         let response = {
//             call_details: {
//                 counts: formattedStats,
//                 data: result,
//             },
//         };
//         return res.status(status.OK).json({ data: response });
//     } catch (err) {
//         return common.throwException(err, 'fetch Call Details Api', req, res);
//     }
// };



// exports.callFilter = async (req, res) => {
//   try {
//     console.log("CALL FILTER CALLED+++++++++++++++++++++++++++++++++++++++++++++");

//     const {
//       callType,
//       callStatus,
//       callBack,
//       fromDate,
//             toDate,
//       departmentId,
//       simNumber,
//       callNumber,
//       minDuration,
//       maxDuration,
//     } = req.body;

//     let { startTime, endTime } = req.body;
//     const { timezone = 'Asia/Kolkata' } = req.headers;

//     console.log("Input startTime:", startTime);
//     console.log("Input endTime:", endTime);

//     const whereClause = { tenantId: req.user.tenantId, deletedAt: null };

//     // ==========================
//     // Time-of-day filtering
//     // ==========================
//     if (startTime && endTime) {
//       // Extract only time part in HH:mm:ss
//       const fromTime = moment.tz(startTime, timezone).format("HH:mm:ss");
//       const toTime = moment.tz(endTime, timezone).format("HH:mm:ss");

//       console.log("Filtering by time-of-day:", fromTime, "to", toTime);

//       if (fromTime < toTime) {
//         // Normal range
//         whereClause[Op.and] = [
//           Sequelize.where(
//             Sequelize.fn("TIME", Sequelize.col("callStartTime")),
//             { [Op.between]: [fromTime, toTime] }
//           )
//         ];
//       } else {
//         // Cross-midnight range
//         whereClause[Op.or] = [
//           Sequelize.where(
//             Sequelize.fn("TIME", Sequelize.col("callStartTime")),
//             { [Op.gte]: fromTime }
//           ),
//           Sequelize.where(
//             Sequelize.fn("TIME", Sequelize.col("callStartTime")),
//             { [Op.lte]: toTime }
//           ),
//         ];
//       }
//     }

//     // ==========================
//     // Other filters
//     // ==========================
//     if (callType) whereClause.callType = callType;
//     if (callStatus) whereClause.callStatus = callStatus;
//     if (callBack) whereClause.callBack = callBack;
//     if (departmentId) whereClause.departmentId = departmentId;

//     if (simNumber && simNumber.length > 0) {
//       const phones = await db.Phones.findAll({
//         attributes: ['number'],
//         where: { id: { [Op.in]: simNumber } },
//         raw: true,
//         disableTenantCheck: true,
//       });
//       const phoneNumbers = phones.map((p) => p.number);
//       whereClause.agentId = { [Op.in]: phoneNumbers };
//     }
//     if (fromDate && toDate) {
//             whereClause.callStartTime = {
//                 [Op.between]: [fromDate, toDate],
//             };
//         }

//     if (callNumber) {
//       whereClause[Op.or] = [
//         { callingNumber: { [Op.like]: `%${callNumber}%` } },
//         { calledNumber: { [Op.like]: `%${callNumber}%` } },
//       ];
//     }

//     if (minDuration !== undefined && maxDuration !== undefined) {
//       whereClause.conversationDuration = {
//         [Op.between]: [minDuration, maxDuration],
//       };
//     }

//     // ==========================
//     // Stats
//     // ==========================
//     const stats = await db.CallDetails.findOne({
//       attributes: [
//         [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'totalCalls'],
//         [db.sequelize.fn('COALESCE', db.sequelize.fn('SUM', db.sequelize.literal("callType = 'IN'")), 0), 'inboundCalls'],
//         [db.sequelize.fn('COALESCE', db.sequelize.fn('SUM', db.sequelize.literal("callType = 'OUT'")), 0), 'outboundCalls'],
//         [db.sequelize.fn('COALESCE', db.sequelize.fn('SUM', db.sequelize.literal("callStatus = 'ANSWERED'")), 0), 'answeredCalls'],
//         [db.sequelize.fn('COALESCE', db.sequelize.fn('SUM', db.sequelize.literal("callStatus = 'NOT ANSWERED'")), 0), 'notAnsweredCalls'],
//         [db.sequelize.fn('COALESCE', db.sequelize.fn('SUM', db.sequelize.literal("callStatus = 'MISSED'")), 0), 'missedCalls'],
//         [db.sequelize.fn('COALESCE', db.sequelize.fn('SUM', db.sequelize.literal("callStatus = 'BUSY'")), 0), 'busyCalls'],
//         [db.sequelize.fn('COALESCE', db.sequelize.fn('SUM', db.sequelize.literal("callStatus = 'NOT-REACHABLE'")), 0), 'notReachableCalls'],
//       ],
//       where: whereClause,
//       raw: true,
//       disableTenantCheck: true,
//     });

//     // ==========================
//     // Fetch call details
//     // ==========================
//     const result = await db.CallDetails.findAll({
//       attributes: [
//         'sourcePbxCallId',
//         'agentId',
//         'callType',
//         'callBack',
//         'callConnected',
//         'callStartTime',
//         'callEndTime',
//         'callStatus',
//         'ringDuration',
//         'voiceFilePath',
//         'stationId',
//         [
//           db.sequelize.literal(`CASE 
//             WHEN callType = 'IN' THEN callingNumber
//             WHEN callType = 'OUT' THEN calledNumber
//             ELSE NULL END`),
//           'caller',
//         ],
//         [db.sequelize.literal(`SEC_TO_TIME(conversationDuration)`), 'conversationDuration'],
//         [
//           db.sequelize.literal(`(
//             SELECT \`name\`
//             FROM \`phones\`
//             WHERE \`phones\`.\`number\` = \`CallDetails\`.\`agentId\`
//             LIMIT 1
//           )`),
//           'agentName',
//         ],
//       ],
//       where: whereClause,
//       raw: true,
//       disableTenantCheck: true,
//     });

//     // ==========================
//     // Convert output times to requested timezone
//     // ==========================
//     const formattedResult = result.map((row) => ({
//       ...row,
//       callStartTime: row.callStartTime
//         ? moment.utc(row.callStartTime).tz(timezone).format("YYYY-MM-DD HH:mm:ss")
//         : null,
//       callEndTime: row.callEndTime
//         ? moment.utc(row.callEndTime).tz(timezone).format("YYYY-MM-DD HH:mm:ss")
//         : null,
//     }));

//     const formattedStats = {
//       inbound: Number(stats.inboundCalls) || 0,
//       outbound: Number(stats.outboundCalls) || 0,
//       answered: Number(stats.answeredCalls) || 0,
//       not_answered: Number(stats.notAnsweredCalls) || 0,
//       missed: Number(stats.missedCalls) || 0,
//       busy: Number(stats.busyCalls) || 0,
//       not_reachable: Number(stats.notReachableCalls) || 0,
//       total_calls: Number(stats.totalCalls) || 0,
//     };

//     const response = {
//       call_details: {
//         counts: formattedStats,
//         data: formattedResult,
//       },
//     };

//     return res.status(status.OK).json({ data: response });
//   } catch (err) {
//     return common.throwException(err, 'fetch Call Details Api', req, res);
//   }
// };




exports.callFilter = async (req, res) => {
   try {
    
        const {
            callType,
            callStatus,
            callBack,
            departmentId,
            // agentId,
            fromDate,
            toDate,
            startTime,
            endTime,
            simNumber,
            callNumber,
            minDuration,
            maxDuration,
            limit,
            searchInArchive,
        } = req.body;
        const { timezone = 'Asia/Kolkata' } = req.headers;
 
        
        const whereClause = { tenantId: req.user.tenantId, deletedAt: null };
 
        if (fromDate && toDate) {
            whereClause.callStartTime = {
                [Op.between]: [fromDate, toDate],
            };
        }
 
         if (startTime && endTime) {
      // Extract only time part in HH:mm:ss
   
      const fromTime = moment.utc(startTime).format("HH:mm:ss");
      const toTime = moment.utc(endTime).format("HH:mm:ss");
      

      console.log("Filtering by time-of-day:", fromTime, "to", toTime);

      if (fromTime < toTime) {
        // Normal range
        whereClause[Op.and] = [
          Sequelize.where(
            Sequelize.fn("TIME", Sequelize.col("callStartTime")),
            { [Op.between]: [fromTime, toTime] }
          )
        ];
      } else {
        // Cross-midnight range
        whereClause[Op.or] = [
          Sequelize.where(
            Sequelize.fn("TIME", Sequelize.col("callStartTime")),
            { [Op.gte]: fromTime }
          ),
          Sequelize.where(
            Sequelize.fn("TIME", Sequelize.col("callStartTime")),
            { [Op.lte]: toTime }
          ),
        ];
      }
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
            // limit: limit,
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
                [
                    db.sequelize.literal(`(
                      SELECT \`name\`
                      FROM \`phones\`
                      WHERE \`phones\`.\`number\` = \`CallDetails\`.\`agentId\`
                      LIMIT 1
                    )`),
                    'agentName',
                ],
            ],
            where: whereClause,
            // limit: limit,
            disableTenantCheck: true,
            // logging:console.log,
        });

        
        // console.log('past count', pastCount.pasttotalCalls, 'curren count', stats.totalCalls);

//         const formattedResult = result.map((row) => ({
//   sourcePbxCallId: row.sourcePbxCallId,
//   agentId: row.agentId,
//   callType: row.callType,
//   callBack: row.callBack,
//   callConnected: row.callConnected,
//   callStartTime: row.callStartTime
//     ? moment.utc(row.callStartTime).tz(timezone).format("YYYY-MM-DDTHH:mm:ss.SSS[Z]")
//     : null,
//   callEndTime: row.callEndTime
//     ? moment.utc(row.callEndTime).tz(timezone).format("YYYY-MM-DDTHH:mm:ss.SSS[Z]")
//     : null,
//   callStatus: row.callStatus,
//   ringDuration: row.ringDuration,
//   voiceFilePath: row.voiceFilePath,
//   stationId: row.stationId,
//   caller: row.caller,
//   conversationDuration: row.conversationDuration,
//   agentName: row.agentName,
// }));


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
        return common.throwException(err, 'fetch Call Details Api', req, res);
    }
};