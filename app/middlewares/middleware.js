var jwt = require('jsonwebtoken');
const db = require('../db/models');
const { status } = require('../../utils');

const authenticateUser = async (req, res, next) => {
    try {
        var token = req.headers.authorization || null;
        if (!token) {
            return res.status(status.Unauthorized).json({ message: 'Unauthorized access.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET_API);

        if (!decoded) {
            return res.status(status.Unauthorized).json({ message: 'Unauthorized access.' });
        }
        const user = await db.User.scope('withPassword').findOne({
            attributes: {
                exclude: ['createdAt', 'createdBy', 'updatedAt', 'updatedBy', 'deletedAt', 'deletedBy'],
            },
            where: { id: decoded.id, deletedAt: null, status: '1' },
        });

        if (!user) {
            return res.status(status.Unauthorized).json({
                message: 'Unauthorized access.',
            });
        }

        // Add the current user instance in request.
        req.user = user;
        // let namespace = getNamespace(config.clsNamespace);

        return next();
    } catch (err) {
        return res.status(status.Unauthorized).json({ message: 'Unauthorized access.' });
    }
};

module.exports = authenticateUser;
