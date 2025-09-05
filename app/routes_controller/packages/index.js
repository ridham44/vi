const router = require('express').Router();
const auth = require('../../middlewares/middleware');
const authPermission = require('../../middlewares/permission.middleware');
const controller = require('./lib/controller');
const { modules } = require('../../../utils/index');

const { createValidationRules, updateValidationRules } = require('./lib/validation');

const { expressValidate } = require('../../../utils/lib/common-function');

// Get all packagess
router.get('/packages', auth, controller.getAllpackages);

// Create new packages
router.post('/packages', auth, authPermission([modules.Addpackages]), createValidationRules(), expressValidate, controller.createpackages);

// Update packages
router.put('/packages/:id', auth, updateValidationRules(), expressValidate, controller.updatepackages);

// Get packages by id
router.get('/packages/:id', auth, controller.getpackages);

// Delete packages
router.delete('/packages/:id', auth, controller.deletepackages);

module.exports = router;
