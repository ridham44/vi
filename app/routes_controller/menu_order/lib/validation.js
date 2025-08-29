const { body } = require('express-validator');

const validationRules = () => {
    return [
        body('name').notEmpty().trim().withMessage('Name is required.'),
        body('subMenu').notEmpty().trim().withMessage('Sub Menu is required.'),
        body('type').notEmpty().trim().withMessage('type is required is group =1 or module =2'),
        body('isPage').notEmpty().trim().withMessage('menuorder type is required is page Or not'),
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
