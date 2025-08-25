const router = require('express').Router();
const auth = require('../../middlewares/middleware');
const authPermission = require('../../middlewares/permission.middleware');
const controller = require('./lib/controller');
const { modules } = require('../../../utils/index');

const { validationRules, updateValidationRules } = require('./lib/validation');

const { expressValidate } = require('../../../utils/lib/common-function');

router.get('/tenant-list', auth, controller.getAllTenant);

router.post('/tenant', auth, authPermission([modules.add_tenant]), validationRules(), expressValidate, controller.createTenant);

router.put('/tenant/:id', auth, updateValidationRules(), expressValidate, controller.updateTenant);

router.get('/tenant/:id', auth, controller.getTenant);

router.delete('/tenant/:id', auth, controller.deleteTenant);

// router.put('/tenant/status/:id', auth, controller.updateStatus);

module.exports = router;
