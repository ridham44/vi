var jwt = require('jsonwebtoken');
const db = require('../db/models');
const { status } = require('../../utils');

const authenticateUser = async (req, res, next) => {
    try {
        var token = req.headers.authorization || null;
        if (!token) {
            return res.status(status.Unauthorized).json({ message: 'Unauthorized access1.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET_API);

        if (!decoded) {
            return res.status(status.Unauthorized).json({ message: 'Unauthorized access2.' });
        }
        console.log('userID', decoded.id);

        const user = await db.User.scope('withPassword').findOne({
            attributes: {
                exclude: ['createdAt', 'createdBy', 'updatedAt', 'updatedBy', 'deletedAt', 'deletedBy'],
            },
            where: { id: decoded.id, deletedAt: null, status: '1' },
            include: [
                {
                    model: db.Role,
                    as: 'Role',
                    attributes: ['id', 'name', 'isSystemAdmin', 'isAdmin', 'isMasterAdmin'],
                    where: {
                        status: '1',
                        deletedAt: null,
                    },
                },
                {
                    model: db.Tenant,
                    as: 'Tenant',
                    attributes: ['id', 'mycoBackendUrl', 'frontendUrl', 'companyId', 'companyName'],
                    where: {
                        deletedAt: null,
                    },
                },
            ],
            disableTenantCheck: true,
        });

        if (!user) {
            return res.status(status.Unauthorized).json({
                message: 'Unauthorized access3.',
            });
        }
        let type;

        if (user.Role.dataValues.isMasterAdmin) {
            type = 'Master';
        } else {
            type = 'Tenant';
        }
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

module.exports = authenticateUser;
