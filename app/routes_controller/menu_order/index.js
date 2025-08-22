const router = require('express').Router();
const auth = require('../../middlewares/middleware');
// const authPermission = require('../../middlewares/permission.middleware');
const controller = require('./lib/controller');
// const { validationUpdateLevelRules } = require('./lib/validation');
// const { expressValidate } = require('../../../utils/lib/common-function');
// const { modules } = require('../../../utils');

// get all menu-order
router.get('/menu-order', auth, controller.findAll);

// get all menu-order for route
router.get('/menu-order-route', auth, controller.findAllRoute);
// router.get('/menu', auth, controller.insertall);


// get menu-order by Id
// router.get('/menu-order/:id', auth, authPermission([modules.settings_menu_order]), controller.findById);

// create menu-order
// router.post('/menu-order', auth, authPermission([modules.settings_menu_order]), validationRules(), expressValidate, controller.create);

// update menu-order
// router.put('/menu-order/:id', auth, authPermission([modules.settings_manage_menu]), validationRules(), expressValidate, controller.update);

// update menu-order status
// router.put('/menu-order/status/:id', auth, authPermission([modules.settings_manage_menu]), controller.updateStatus);

// delete menu-order
// router.delete('/menu-order/:id', auth, authPermission([modules.settings_manage_menu]), controller.delete);

// update menu-order level
// router.put(
//     '/menu-order/update/level',
//     auth,
//     authPermission([modules.settings_reorder_menu]),
//     validationUpdateLevelRules(),
//     expressValidate,
//     controller.updateLevel
// );

/**
 * Module APIs
 */

// get all menu-order for module
// router.get('/menu-order-module', auth, controller.findAllForModule);

// get all menu-order for permission
// router.get('/menu-order-permission', auth, authPermission([modules.setup_assign_rights]), controller.findAllForPermission);

// create menu-order for module
// router.post('/menu-order-module', auth, validationModuleRules(), expressValidate, controller.createModule);

// update menu-order for module
// router.put('/menu-order-module/:id', auth, validationModuleRules(), expressValidate, controller.updateModule);

// update menu-order status for module
// router.put('/menu-order-module/status/:id', auth, controller.updateStatusModule);

// delete menu-order for module
// router.delete('/menu-order-module/:id', auth, controller.deleteModule);

module.exports = router;
