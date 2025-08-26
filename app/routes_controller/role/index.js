const router = require('express').Router();
const auth = require('../../middlewares/middleware');
const controller = require('./lib/controller');

const { validationRules, updateValidationRules } = require('./lib/validation');

const { expressValidate } = require('../../../utils/lib/common-function');

router.get('/role-list', auth, controller.getAllRole);

router.post('/role', auth, validationRules(), expressValidate, controller.createRole);

router.put('/role/:id', auth, updateValidationRules(), expressValidate, controller.updateRole);

router.get('/role/:id', controller.getRole);

router.delete('/role/:id', auth, controller.deleteRole);

router.put('/role/status/:id', auth, controller.updateStatus);

module.exports = router;
