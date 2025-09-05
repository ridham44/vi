const router = require('express').Router();
const { expressValidate } = require('../../../utils/lib/common-function');
const auth = require('../../middlewares/middleware');
const controller = require('./lib/controller');

const { validationRules } = require('./lib/validation');

router.get('/permission', auth, controller.findByToken);

router.get('/permission/:id', auth, controller.findByRoleId);

router.post('/permission/:id', auth, validationRules(), expressValidate, controller.create);

module.exports = router;
