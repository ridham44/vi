// const { getNamespace } = require('cls-hooked');
const { status } = require('../../utils');
const db = require('../db/models');
const { Op } = require('sequelize');

const checkPermission = async (user, pid) => {
    try {
        console.log(user.roleId);

        const data = await db.MenuOrderRole.findOne({
            where: { roleId: user.roleId, menuOrderId: { [Op.in]: pid } },
        });
        if (!data) {
            return false;
        }
        return true;
    } catch (err) {
        return Promise.reject(err);
    }
};

const authPermission = (pid) => {
    return async (req, res, next) => {
        if (!Array.isArray(pid) || pid.length == 0) {
            pid = ['0'];
        }
        const access = await checkPermission(req.user, pid);
        if (!access) {
            return res.status(status.Forbidden).json({ message: 'You do not have the necessary permission.' });
        }

        // Get Session Namespace
        // let namespace = getNamespace('session');

        // Set menuOrderId in session.
        // if (pid[0] != '0') {
        //     namespace.set('menuOrderId', pid[0]);
        // }

        next();
    };
};

module.exports = authPermission;
