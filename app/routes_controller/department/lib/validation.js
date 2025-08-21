const { body } = require('express-validator');
const db = require('../../../db/models');
const User = db.User;

const validationRules = () => {
    return [body('departmentName').notEmpty().trim().withMessage('department Name is required.')];
};

const updateValidationRules = () => {
    return [body('name').notEmpty().trim().withMessage('Department Name is required.')];
};

module.exports = {
    validationRules,
    updateValidationRules,
};
