const { body } = require('express-validator');

const validationRules = () => {
    return [
        body('name').notEmpty().trim().withMessage('Name is required.'),
        body('subMenu').notEmpty().trim().withMessage('Sub Menu is required.'),
    ];
};

const validationModuleRules = () => {
    return [body('name').notEmpty().trim().withMessage('Name is required.')];
};

const validationUpdateLevelRules = () => {
    return [
        body('menuOrderTenantIds')
            .notEmpty()
            .withMessage('Menu Order Data is required.')
            .isArray({ min: 1 })
            .withMessage('Minimum one Menu Order is required.'),
        body('menuOrderTenantIds.*')
            .notEmpty()
            .trim()
            .withMessage('Menu Order Ids is required.')
            .isUUID()
            .withMessage('Menu Order Ids must be a valid UUID'),
    ];
};

module.exports = {
    validationRules,
    validationUpdateLevelRules,
    validationModuleRules,
};
