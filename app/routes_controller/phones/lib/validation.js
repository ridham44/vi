const { body } = require('express-validator');

const validationRules = () => {
    return [
        body('name').notEmpty().trim().withMessage('name is required.'),
        body('number').notEmpty().trim().withMessage('phone number is required.'),
        body('departmentId').notEmpty().trim().withMessage('departmentId is required.'),
        body('tenantId').notEmpty().trim().withMessage('TenantId  is required.'),
    ];
};

const updateValidationRules = () => {
    return [
        body('name').notEmpty().trim().withMessage(' Name is required.'),
        body('number').notEmpty().trim().withMessage('phone number is required.'),
        body('departmentId').notEmpty().trim().withMessage('departmentId is required.'),
        body('tenantId').notEmpty().trim().withMessage('tenantId is required.'),
    ];
};

module.exports = {
    validationRules,
    updateValidationRules,
};
