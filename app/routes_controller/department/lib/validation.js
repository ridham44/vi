const { body } = require('express-validator');

const validationRules = () => {
    return [body('name').notEmpty().trim().withMessage('department Name is required.')];
};

const validationRulesOfDepart = () => {
    return [body('tenantId').notEmpty().trim().withMessage('tenantId is required.')];
};
const updateValidationRules = () => {
    return [body('name').notEmpty().trim().withMessage('Department Name is required.')];
};

module.exports = {
    validationRules,
    validationRulesOfDepart,
    updateValidationRules,
};
