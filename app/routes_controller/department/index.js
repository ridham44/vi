const router = require('express').Router();
const auth = require('../../middlewares/middleware');
const controller = require('./lib/controller');
const { validationRules, updateValidationRules } = require('./lib/validation');
const { expressValidate } = require('../../../utils/lib/common-function');

router.post('/department', auth, validationRules(), expressValidate, controller.createDepartment);

router.get('/department', auth, controller.getAllDepartment);

router.put('/department/:id', auth, updateValidationRules(), expressValidate, controller.updateDepartment);

router.get('/department/:id', auth, controller.getDepartment);

router.delete('/department/:id', auth, controller.deleteDepartment);

module.exports = router;
