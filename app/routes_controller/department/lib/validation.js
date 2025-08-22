const { body } = require('express-validator');

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
