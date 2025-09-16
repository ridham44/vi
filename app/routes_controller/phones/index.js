const router = require('express').Router();
const auth = require('../../middlewares/middleware');
const controller = require('./lib/controller');
const authPermission = require('../../middlewares/permission.middleware');
const { modules } = require('../../../utils/index');

const { validationRules, updateValidationRules, getPhoneValidationRules } = require('./lib/validation');
// const { validationRules } = require('./lib/validation');

const { expressValidate } = require('../../../utils/lib/common-function');

//creare phone
router.post('/phone', auth, authPermission([modules.AddPhone]), validationRules(), expressValidate, controller.createPhone);

//get all phone  numbers
router.get('/phone', auth, controller.getAllPhones);

//get all phone  numbers by department
// router.post('/phone/by-department', auth, getPhoneValidationRules(), expressValidate, controller.getAllPhonesByDepartment);

router.post('/phone/by-department', auth,controller.getAllPhonesByDepartment);

// //update routes
router.put('/phone/:id', auth, authPermission([modules.AddPhone]), updateValidationRules(), expressValidate, controller.updatePhone);

// //get by id routes
router.get('/phone/:id', auth, controller.getPhone);

// //delete routes
router.delete('/phone/:id', auth, controller.deletePhone);

module.exports = router;
