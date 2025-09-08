const router = require('express').Router();
const auth = require('../../middlewares/middleware');
const controller = require('./lib/controller');
const authPermission = require('../../middlewares/permission.middleware');
const { modules } = require('../../../utils/index');

const { validationRules, updateValidationRules } = require('./lib/validation');
// const { validationRules } = require('./lib/validation');

const { expressValidate } = require('../../../utils/lib/common-function');

//creare routes
router.post('/phone', auth, authPermission([modules.AddPhone]), validationRules(), expressValidate, controller.createPhone);

//get all routes
router.get('/phone', auth, controller.getAllPhones);

// //update routes
router.put('/phone/:id', auth, authPermission([modules.createPhone]), updateValidationRules(), expressValidate, controller.updatePhone);

// //get by id routes
// router.get('/department/:id', auth, controller.getDepartment);

// //delete routes
router.delete('/phone/:id', auth, controller.deletePhone);

module.exports = router;
