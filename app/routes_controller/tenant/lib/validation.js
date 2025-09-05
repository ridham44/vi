const { body } = require('express-validator');
//const db = require('../../../db/models');

const createValidationRules = () => {
    return [
        body('companyName').notEmpty().trim().withMessage('Company name is required.'),

        body('address').notEmpty().trim().withMessage('Address is required.'),

        body('phone').notEmpty().trim().isLength({ min: 7, max: 15 }).withMessage('Phone number must be between 7 and 15 digits.'),

        body('email').notEmpty().trim().isEmail().withMessage('Valid email is required.'),

        body('remarks').optional().isString().withMessage('Remarks must be a string.'),

        body('mobileNoLimit').optional().isInt({ min: 0 }).withMessage('Mobile No Limit must be a non-negative integer.'),

        body('menuOrders').isArray({ min: 1 }).withMessage('Menu orders must be an array with at least one item.'),

        body('menuOrders.*').notEmpty().withMessage('Each menu order must be provided.'),

        body('packagesId').notEmpty().withMessage('packagesId must be required a valid UUID or 0 if trail.'),

        body('amount').optional().isFloat({ min: 0 }).withMessage('Amount must be a non-negative number.'),

        body('paymentStatus').optional().isIn(['0', '1']).withMessage('Payment status must be either pending or completed.'),

        body('packagesStartDate').notEmpty().withMessage('Package start date is required.'),

        body('trialDays').optional().isInt({ min: 0 }).withMessage('Trial days must be a non-negative integer.'),
    ];
};

const updateValidationRules = () => {
    return [
        body('companyName').trim().notEmpty().withMessage('Company name is required.'),

        body('address').optional().trim().isLength({ max: 255 }).withMessage('Address must not exceed 255 characters.'),

        body('phone').optional().trim().isMobilePhone().withMessage('Phone must be a valid mobile number.'),

        body('email').optional().isEmail().withMessage('Email must be valid.'),

        body('remarks').optional().trim().isLength({ max: 500 }).withMessage('Remarks must not exceed 500 characters.'),

        body('mobileNoLimit').optional().isInt({ min: 0 }).withMessage('Mobile No Limit must be a valid integer.'),

        body('status').optional().isIn(['0', '1']).withMessage('Status must be either active or inactive.'),
        
        body('packagesId').notEmpty().withMessage('packagesId must be a valid UUID or 0 if trail.'),

        body('amount').optional().isFloat({ min: 0 }).withMessage('Amount must be a non-negative number.'),

        body('paymentStatus').optional().isIn(['0', '1']).withMessage('Payment status must be either pending or completed.'),

        body('packagesStartDate').notEmpty().withMessage('Package start date is required.'),

        body('trialDays').optional().isInt({ min: 0 }).withMessage('Trial days must be a non-negative integer.'),
    ];
};

module.exports = {
    createValidationRules,
    updateValidationRules,
};
