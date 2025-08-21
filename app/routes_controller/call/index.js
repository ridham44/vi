const router = require('express').Router();
const auth = require('../../middlewares/middleware');
const controller = require('./lib/controller');
const { loginRules, changePasswordRules, validationRules, updateValidationRules } = require('./lib/validation');
const { expressValidate } = require('../../../utils/lib/common-function');

router.get('/calls/summary', auth, controller.inboundCall);
router.post('/calls/logs',auth,controller.callLogs);



module.exports = router;
