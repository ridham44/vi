const router = require('express').Router();
const auth = require('../../middlewares/middleware');
const controller = require('./lib/controller');

// get all call logs
router.get('/calls/summary', auth, controller.inboundCall);

//filter calls 
router.post('/calls/filter', auth, controller.callFilter);

// router.post('/calls/logs',auth,controller.callLogs);

module.exports = router;
