const { body } = require('express-validator');
//const db = require('../../../db/models');

const createValidationRules = () => {
    return [
        body('packagesName').trim().notEmpty().withMessage('Package name is required.'),
        body('packagesDescription')
            .optional()
            .trim()
            .isLength({ max: 500 })
            .withMessage('Package description must not exceed 500 characters.'),
        body('packagesAmount')
            .notEmpty()
            .withMessage('Package amount is required.')
            .isDecimal()
            .withMessage('Package amount must be a valid decimal number.'),
        body('noOfMonths').notEmpty().isInt({ min: 1 }).withMessage('Number of months must be a valid integer greater than 0.'),
    ];
};

const updateValidationRules = () => {
    return [
        body('packagesName').trim().notEmpty().withMessage('Package name is required.'),
        body('packagesDescription')
            .optional()
            .trim()
            .isLength({ max: 500 })
            .withMessage('Package description must not exceed 500 characters.'),
        body('packagesAmount')
            .optional()
            .isDecimal()
            .withMessage('Package amount must be a valid decimal number.'),
        body('noOfMonths').optional().isInt({ min: 1 }).withMessage('Number of months must be a valid integer greater than 0.'),
    ];
};

module.exports = {
    createValidationRules,
    updateValidationRules,
};
