var jwt = require('jsonwebtoken');
const db = require('../db/models');
const { status } = require('../../utils');
const moment = require('moment');
// const Sequelize = require('sequelize');
// const Op = Sequelize.Op;

const authenticateUser = async (req, res, next) => {
    try {
        const token = req.cookies.token || null;

        if (!token) {
            return res.status(status.Unauthorized).json({ message: 'Authentication token not provided.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET_API);

        if (!decoded) {
            return res.status(status.Unauthorized).json({ message: 'Invalid or expired authentication token' });
        }

        const user = await db.User.scope('withPassword').findOne({
            attributes: {
                exclude: ['createdAt', 'createdBy', 'updatedAt', 'updatedBy', 'deletedAt', 'deletedBy'],
            },
            where: { id: decoded.id, deletedAt: null, status: '1' },
            include: [
                {
                    model: db.Role,
                    as: 'Role',
                    attributes: ['id', 'name', 'isMasterAdmin'],
                    where: {
                        status: '1',
                        deletedAt: null,
                    },
                },
                {
                    model: db.Tenant,
                    as: 'Tenant',
                    attributes: ['id', 'companyName', 'phone', 'email', 'status', 'packagesEndDate'],
                    where: {
                        deletedAt: null,
                    },
                    required: false,
                },
            ],
            disableTenantCheck: true,
        });

        if (!user) {
            return res.status(status.Unauthorized).json({
                message: 'User not found or inactive.',
            });
        }

        if (user.Tenant) {
            const { packagesEndDate } = user.Tenant;

            if (packagesEndDate && moment().isAfter(moment(packagesEndDate))) {
                return res.status(status.Forbidden).json({
                    message: 'Subscription expired. Please renew to continue.',
                });
            }
        }

        let type;
        type = decoded.type;

        // Add the current user instance in request.
        req.user = user;
        req.user.type = type;
        // let namespace = getNamespace(config.clsNamespace);

        return next();
    } catch (err) {
        console.log(err);

        return res.status(status.Unauthorized).json({ message: 'Unauthorized access.' });
    }
};

// const authenticateUser1 = async (req, res, next) => {
//     try {
//         const token = req.cookies.token || null;

//         if (!token) {
//             return res.status(status.Unauthorized).json({ message: 'Authentication token not provided.' });
//         }

//         // const decoded = jwt.verify(token, process.env.JWT_SECRET_API);

//         // if (!decoded) {
//         //     return res.status(status.Unauthorized).json({ message: 'Invalid or expired authentication token' });
//         // }

//         const getdata = await db.ForgotPassword.findOne({
//             where: {
//                 token: token,
//                 used: '0',
//                 expiresAt: { [Op.gt]: new Date() },
//             },
//         });
//         console.log(getdata.userId);

//         const user = await db.User.scope('withPassword').findOne({
//             attributes: {
//                 exclude: ['createdAt', 'createdBy', 'updatedAt', 'updatedBy', 'deletedAt', 'deletedBy'],
//             },
//             where: { id: getdata.userId, deletedAt: null, status: '1' },
//             include: [
//                 {
//                     model: db.Role,
//                     as: 'Role',
//                     attributes: ['id', 'name', 'isMasterAdmin'],
//                     where: {
//                         status: '1',
//                         deletedAt: null,
//                     },
//                 },
//                 {
//                     model: db.Tenant,
//                     as: 'Tenant',
//                     attributes: ['id', 'companyName', 'phone', 'email', 'status', 'packagesEndDate'],
//                     where: {
//                         deletedAt: null,
//                     },
//                     required: false,
//                 },
//             ],
//             disableTenantCheck: true,
//         });

//         if (!user) {
//             return res.status(status.Unauthorized).json({
//                 message: 'User not found or inactive.',
//             });
//         }

//         if (user.Tenant) {
//             const { packagesEndDate } = user.Tenant;

//             if (packagesEndDate && moment().isAfter(moment(packagesEndDate))) {
//                 return res.status(status.Forbidden).json({
//                     message: 'Subscription expired. Please renew to continue.',
//                 });
//             }
//         }

//         let type;
//         type = user.Role.name;
//         req.user = user;
//         req.user.type = type;

//         return next();
//     } catch (err) {
//         console.log(err);

//         return res.status(status.Unauthorized).json({ message: 'Unauthorized access.' });
//     }
// };

module.exports = authenticateUser;
