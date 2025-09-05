const router = require('express').Router();
const auth = require('../../middlewares/middleware');
const { expressValidate } = require('../../../utils/lib/common-function');
const { createValidations, updateValidations } = require('./lib/validation');
const controller = require('./lib/controller');

// Create record
router.post('/tenantUser', auth, createValidations(), expressValidate, controller.create);

// Update record
router.put('/tenantUser/:id', auth, updateValidations(), expressValidate, controller.update);

// Delete record
router.delete('/tenantUser/:id', auth, controller.delete);

// Get all records
router.get('/tenantUser', auth, controller.findAll);

// Update status
router.put('/tenantUser/status/:id', auth, controller.updateStatus);

// Get by ID
router.get('/tenantUser/:id', auth, controller.findById);

module.exports = router;
