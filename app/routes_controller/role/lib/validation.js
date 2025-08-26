const { body } = require('express-validator');
// const db = require('../../../db/models');

const loginRules = () => {
    return [
        body('email').notEmpty().withMessage('Email is required').isEmail().withMessage('Enter valid email.'),
        body('password').notEmpty().withMessage('Password is required'),
    ];
};

const validationRules = () => {
    return [
        body('name').notEmpty().trim().withMessage('role name is required.'),
        body('isSystemAdmin').notEmpty().trim().withMessage('is System Admin (True Or Flase)  is required.'),
        body('isAdmin').notEmpty().trim().withMessage('is  Admin (True Or Flase)  is required.'),
        body('menuOrders').notEmpty().trim().withMessage('MenuOrder Id is required'),
    ];
};

const updateValidationRules = () => {
    return [
        body('name').notEmpty().trim().withMessage('role name is required.'),
        body('isSystemAdmin').notEmpty().trim().withMessage('is System Admin (True Or Flase)  is required.'),
        body('isAdmin').notEmpty().trim().withMessage('is  Admin (True Or Flase)  is required.'),
        body('menuOrders').notEmpty().trim().withMessage('MenuOrder Id is required'),
    ];
};

const changePasswordRules = () => {
    return [
        body('oldPassword').notEmpty().trim().withMessage('Old Password is required.'),
        body('newPassword').notEmpty().withMessage('New Password is required'),
        body('confirmPassword').notEmpty().withMessage('Confirm Password is required'),
    ];
};

module.exports = {
    loginRules,
    validationRules,
    updateValidationRules,
    changePasswordRules,
};
