require('dotenv').config();
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const db = require('../../../db/models');
const { status, common, dbCommon } = require('../../../../utils');

exports.create = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const permission = req.body.permission;
        let tenantId;
        if (req.user.type != 'Main Admin') {
            tenantId = req.user.tenantId;
        } else {
            tenantId = null;
        }

        const role = await db.Role.findOne({
            where: {
                id: req.params.id,
                tenantId: tenantId,
            },
            disableTenantCheck: true,
            transaction,
        });

        if (!role) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'Role not found!' });
        }

        // destroy any previous permission and add new
        await db.MenuOrderRole.destroy({
            where: {
                roleId: role.id,
            },
            transaction,
        });

        // new permission array
        let permissionArray = [];

        permission.forEach(async (i) => {
            permissionArray.push({
                roleId: role.id,
                menuOrderId: i,
                createdBy: req.user.id,
            });
        });

        // bulk creating permission
        await db.MenuOrderRole.bulkCreate(permissionArray, { transaction });

        await transaction.commit();
        return res.status(status.OK).json({ message: 'Permission Updated Successfully.' });
    } catch (err) {
        await transaction.rollback();
        return common.throwException(err, 'Create Permission', req, res);
    }
};

exports.findByRoleId = async (req, res) => {
    try {
        const permission = await db.MenuOrderRole.findAll({
            where: {
                roleId: {
                    [Op.eq]: req?.params?.id,
                    // [Op.ne]: req?.user?.roleId,
                },
            },
        });

        const menuOrderIds = permission.map((i) => i.menuOrderId);
        return res.status(status.OK).json({ data: menuOrderIds });
    } catch (err) {
        return common.throwException(err, 'Get permission by role', req, res);
    }
};
exports.findByToken = async (req, res) => {
    try {
        const data = await dbCommon.getPermissionByToken(req.user);
        return res.status(status.OK).json({ data: data });
    } catch (err) {
        return common.throwException(err, 'Get permission by token', req, res);
    }
};
