const { body } = require('express-validator');
//const db = require('../../../db/models');
//const { Op } = require('sequelize');
//const Role = db.Role;

const loginRules = () => {
    return [
        body('email').notEmpty().withMessage('Email is required').isEmail().withMessage('Enter valid email.'),
        body('password').notEmpty().withMessage('Password is required'),
    ];
};

const validationRules = () => {
    return [
        body('firstName').notEmpty().trim().withMessage('First Name is required.'),
        body('lastName').notEmpty().trim().withMessage('Last Name is required.'),
        body('roleId').notEmpty().trim().withMessage('Role Id is required.'),
        body('email').trim().notEmpty().withMessage('Email is required.').isEmail().withMessage('Enter a valid email'),
        body('departmentId')
            .if((value, { req }) => req.user.type != 'Main Admin') // <-- check role
            .notEmpty()
            .withMessage('Department Id is required for this role.'),

        // phoneIds required if role is NOT "main admin"
        body('phoneIds')
            .if((value, { req }) => req.user.type != 'Main Admin')
            .isArray({ min: 1 })
            .withMessage('phoneIds must be a non-empty array for this role.'),
        body('password')
            .notEmpty()
            .withMessage('Password is required field')
            .isLength({ min: 8 })
            .withMessage('Minimum 8 characters is required'),
    ];
};

const updateValidationRules = () => {
    return [
        body('firstName').notEmpty().trim().withMessage('First Name is required.'),
        body('lastName').notEmpty().trim().withMessage('Last Name is required.'),
        body('roleId').notEmpty().trim().withMessage('Role Id is required.'),
        body('departmentId')
            .if((value, { req }) => req.user.type != 'Main Admin') // <-- check role
            .notEmpty()
            .withMessage('Department Id is required for this role.'),

        // phoneIds required if role is NOT "main admin"
        body('phoneIds')
            .if((value, { req }) => req.user.type != 'Main Admin')
            .isArray({ min: 1 })
            .withMessage('phoneIds must be a non-empty array for this role.'),
        body('email').trim().notEmpty().withMessage('Email is required.').isEmail().withMessage('Enter a valid email'),
    ];
};

const changePasswordRules = () => {
    return [
        body('oldPassword').notEmpty().withMessage('Old Password is required.'),
        body('newPassword').notEmpty().withMessage('New Password is required'),
        body('confirmPassword').notEmpty().withMessage('Confirm Password is required'),
    ];
};

const forgotPasswordRules = () => {
    return [body('email').trim().notEmpty().withMessage('Email is required.').isEmail().withMessage('Enter a valid email')];
};

const resetPasswordRules = () => {
    return [
        body('token').notEmpty().withMessage('Token is required'),
        body('newPassword').notEmpty().withMessage('New Password is required'),
    ];
};
module.exports = {
    loginRules,
    validationRules,
    updateValidationRules,
    changePasswordRules,
    forgotPasswordRules,
    resetPasswordRules,
};
