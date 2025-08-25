const router = require('express').Router();
const auth = require('../../middlewares/middleware');
const controller = require('./lib/controller');

const { validationRules, updateValidationRules } = require('./lib/validation');

const { expressValidate } = require('../../../utils/lib/common-function');

router.get('/tenant-list', auth, controller.getAllTenant);

router.post('/tenant', auth, validationRules(), expressValidate, controller.createTenant);

router.put('/tenant/:id', auth, updateValidationRules(), expressValidate, controller.updateTenant);

router.get('/tenant/:id', auth, controller.getTenant);

router.delete('/tenant/:id', auth, controller.deleteTenant);

// router.put('/tenant/status/:id', auth, controller.updateStatus);

module.exports = router;
