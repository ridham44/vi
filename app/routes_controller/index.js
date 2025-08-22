const router = require('express').Router();

router.use('/', require('./user'));
router.use('/', require('./call'));
router.use('/', require('./department'));
router.use('/', require('./menu_order'));
router.use('/', require('./tenant_user'));

module.exports = router;
