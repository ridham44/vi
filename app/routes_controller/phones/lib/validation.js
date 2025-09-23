const { body } = require('express-validator');

const validationRules = () => {
    return [
        body('name').notEmpty().trim().withMessage('name is required.'),
        body('number').notEmpty().trim().withMessage('phone number is required.'),
        body('departmentId').notEmpty().trim().withMessage('departmentId is required.'),
        body('tenantId').notEmpty().trim().withMessage('TenantId  is required.'),
        body('countryCode').notEmpty().trim().withMessage('CountryCode  is required.'),
    ];
};

const updateValidationRules = () => {
    return [
        body('number')
            .if((value, { req }) => req.user.type == 'Main Admin')
            .notEmpty()
            .trim()
            .withMessage('phone number is required.'),
        body('name').notEmpty().trim().withMessage(' Name is required.'),
        body('departmentId').notEmpty().trim().withMessage('departmentId is required.'),
        body('tenantId')
            .if((value, { req }) => req.user.type == 'Main Admin')
            .notEmpty()
            .trim()
            .withMessage('tenantId is required.'),
        body('countryCode')
            .if((value, { req }) => req.user.type == 'Main Admin')
            .notEmpty()
            .trim()
            .withMessage('CountryCode  is required.'),
    ];
};
const getPhoneValidationRules = () => {
    return [body('departmentIds').isArray({ min: 1 }).withMessage('departmentIds must be a non-empty array.')];
};

module.exports = {
    validationRules,
    getPhoneValidationRules,
    updateValidationRules,
};
