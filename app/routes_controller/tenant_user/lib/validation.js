const { body } = require('express-validator');

const createValidations = () => {
    return [
        body('firstName').notEmpty().withMessage('First name is required').isString().withMessage('First name must be a string').trim(),

        body('lastName').optional().isString().withMessage('Last name must be a string').trim(),

        body('email').notEmpty().withMessage('Email is required').isEmail().withMessage('Must be a valid email'),

        body('mobile').notEmpty().withMessage('Mobile number is required').isMobilePhone().withMessage('Must be a valid mobile number'),

        body('roleId').notEmpty().withMessage('Role is required'),
    ];
};

const updateValidations = () => {
    return [
        body('firstName').optional().isString().withMessage('First name must be a string').trim(),

        body('lastName').optional().isString().withMessage('Last name must be a string').trim(),

        body('email').notEmpty().isEmail().withMessage('Must be a valid email'),

        body('mobile').optional().isMobilePhone().withMessage('Must be a valid phone number'),

        body('password').optional().isString().withMessage('Password must be a string').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),

        body('roleId').optional(),
    ];
};

module.exports = {
    createValidations,
    updateValidations,
};
