const router = require('express').Router();
const auth = require('../../middlewares/middleware');
const authPermission = require('../../middlewares/permission.middleware');
const controller = require('./lib/controller');
const { modules } = require('../../../utils/index');

const { createValidationRules, updateValidationRules } = require('./lib/validation');

const { expressValidate } = require('../../../utils/lib/common-function');

// Get all tenants
router.get('/tenant-list', auth, controller.getAllTenant);

// Create tenant
router.post('/tenant', auth, authPermission([modules.AddTenant]), createValidationRules(), expressValidate, controller.createTenant);

// Update tenant
router.put('/tenant/:id', auth, updateValidationRules(), expressValidate, controller.updateTenant);

// Get tenant by id
router.get('/tenant/:id', auth, controller.getTenant);

// Delete tenant
router.delete('/tenant/:id', auth, controller.deleteTenant);

// Send password for demo
//router.post('/send-password-demo', controller.sendTenantPasswordDemo);

module.exports = router;
