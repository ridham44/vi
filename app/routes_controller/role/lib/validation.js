const { body } = require('express-validator');
// const db = require('../../../db/models');

const validationRules = () => {
    return [
        body('name').notEmpty().trim().withMessage('role name is required.'),
        // body('isSystemAdmin').notEmpty().trim().withMessage('is System Admin (True Or Flase)  is required.'),
        // body('isAdmin').notEmpty().trim().withMessage('is  Admin (True Or Flase)  is required.'),
        // body('menuOrders').notEmpty().trim().withMessage('MenuOrder Id is required'),
    ];
};

const updateValidationRules = () => {
    return [
        body('name').notEmpty().trim().withMessage('role name is required.'),
        // body('isSystemAdmin').notEmpty().trim().withMessage('is System Admin (True Or Flase)  is required.'),
        // body('isAdmin').notEmpty().trim().withMessage('is  Admin (True Or Flase)  is required.'),
        // body('menuOrders').notEmpty().trim().withMessage('MenuOrder Id is required'),
    ];
};

module.exports = {
    validationRules,
    updateValidationRules,
};
