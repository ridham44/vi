const router = require('express').Router();
const auth = require('../../middlewares/middleware');
const controller = require('./lib/controller');

router.get('/calls/summary', auth, controller.inboundCall);
// router.post('/calls/logs',auth,controller.callLogs);



module.exports = router;
