const Enum = require('enum');

module.exports = {
    Status: new Enum({
        Active: '1',
        Inactive: '0',
    }),
    userType: {
        Admin: '1',
        User: '0',
    },
    MenuOrderType: {
        Group: '1',
        Module: '2',
        Right: '3',
    },
};
