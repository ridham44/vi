const { body } = require('express-validator');
const db = require('../../../db/models');

const validationRules = () => {
    return [
        body('mycoBackendUrl').notEmpty().trim().withMessage('mycoBackendUrl is required.'),
        body('frontendUrl').notEmpty().trim().withMessage('frontendUrl  is required.'),
        body('menuOrders').notEmpty().trim().withMessage('MenuOrder Id is required'),

        body('companyName')
            .trim()
            .notEmpty()
            .withMessage('Company name is required.')
            .custom(async (value) => {
                try {
                    const user = await db.Tenant.findOne({
                        where: {
                            companyName: value?.toLowerCase(),
                        },
                    });
                    if (user) {
                        return Promise.reject('CompanyName already in Tenant.');
                    }
                    return true;
                } catch (err) {
                    console.log(err);

                    return Promise.reject('Something went wrong');
                }
            }),
        body('email').trim().notEmpty().withMessage('Email name is required.'),
    ];
};

const updateValidationRules = () => {
    return [
        body('mycoBackendUrl').notEmpty().trim().withMessage('mycoBackendUrl is required.'),
        body('frontendUrl').notEmpty().trim().withMessage('frontendUrl  is required.'),
        body('menuOrders').notEmpty().trim().withMessage('MenuOrder Id is required'),
        body('companyName').trim().notEmpty().withMessage('Company name is required.'),
    ];
};

module.exports = {
    validationRules,
    updateValidationRules,
};
