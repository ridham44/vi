const router = require('express').Router();
const auth = require('../../middlewares/middleware');
const controller = require('./lib/controller');

const { validationRules, updateValidationRules } = require('./lib/validation');

const { expressValidate } = require('../../../utils/lib/common-function');

//Get all
router.get('/role-list', auth, controller.getAllRole);

//Create Role
router.post('/role', auth, validationRules(), expressValidate, controller.createRole);

//Update Role
router.put('/role/:id', auth, updateValidationRules(), expressValidate, controller.updateRole);

//Get Role by Id
router.get('/role/:id', controller.getRole);


//Delete Role
router.delete('/role/:id', auth, controller.deleteRole);

//Update Role Status
router.put('/role/status/:id', auth, controller.updateStatus);

module.exports = router;
