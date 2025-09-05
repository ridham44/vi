const { body } = require('express-validator');

const updateValidationRules = () => {
    return [
        body('firstName').notEmpty().trim().withMessage('First Name is required.'),
        body('lastName').notEmpty().trim().withMessage('Last Name is required.'),
        body('mobile')
            .notEmpty()
            .trim()
            .withMessage('Mobile is required.')
            .isMobilePhone(['en-IN'])
            .withMessage('Enter a valid Mobile Number.'),
        body('email').trim().notEmpty().withMessage('Email is required.').isEmail().withMessage('Enter a valid email'),
    ];
};

module.exports = {
    updateValidationRules,
};
