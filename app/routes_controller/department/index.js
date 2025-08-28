const router = require('express').Router();
const auth = require('../../middlewares/middleware');
const controller = require('./lib/controller');
const { validationRules, updateValidationRules } = require('./lib/validation');
const { expressValidate } = require('../../../utils/lib/common-function');

//creare routes
router.post('/department', auth, validationRules(), expressValidate, controller.createDepartment);

//get all routes
router.get('/department', auth, controller.getAllDepartment);

//update routes
router.put('/department/:id', auth, updateValidationRules(), expressValidate, controller.updateDepartment);

//get by id routes
router.get('/department/:id', auth, controller.getDepartment);

//delete routes
router.delete('/department/:id', auth, controller.deleteDepartment);

module.exports = router;
