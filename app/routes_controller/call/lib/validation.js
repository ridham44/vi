const { body } = require('express-validator');

const callSummaryValidationRules = () => {
    return [
        body('fromDate')
            .notEmpty()
            .withMessage('fromDate is required')
            .isISO8601()
            .withMessage('fromDate must be a valid date (YYYY-MM-DD)'),
        body('toDate')
            .notEmpty()
            .isISO8601()
            .withMessage('toDate must be a valid date (YYYY-MM-DD)'),
        body('agentId')
            .optional()
            .isString()
            .withMessage('agentId must be a string'),
        body('type')
            .notEmpty()
            .withMessage('type is required')
            .withMessage("type must be there"),
    ];
};

module.exports = {
    callSummaryValidationRules,
};
