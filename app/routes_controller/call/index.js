const router = require('express').Router();
const auth = require('../../middlewares/middleware');
const controller = require('./lib/controller');
const { callSummaryValidationRules } = require('./lib/validation');
const { expressValidate } = require('../../../utils/lib/common-function');

// get all call logs
router.get('/calls/summary', auth, controller.inboundCall);

//filter calls
router.post('/calls/filter', auth, controller.callFilter);

//Voice Activity
router.post('/calls/voiceActivity', auth, controller.voiceActivity);

//Inbound Callback Analysis
router.post('/calls/callback', auth, controller.inboundCallbackAnalysis);

//By state
router.post('/calls/state', auth, controller.getCallSummaryByState);

//By Date
router.post('/calls/trend', auth, controller.getCallTrend);

//Call Insights
router.post('/calls/insights', auth, callSummaryValidationRules(), expressValidate, controller.getCallInsights);

//Callback and Missed Call Overview
router.post('/calls/overview', auth, callSummaryValidationRules(), expressValidate, controller.getCallbackAndMissedOverview);

//By Id
router.get('/calls/:id', auth, controller.getCallDetailsById);

module.exports = router;
