require('dotenv').config();
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const db = require('../../../db/models');
const { status, common, enums, dbCommon } = require('../../../../utils');
const moment = require('moment-timezone');

exports.createRole = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        // const { name, isSystemAdmin, isAdmin, menuOrders } = req.body;
        const { name } = req.body;

        let tenantId;
        if (req.user.type != 'Main Admin') {
            tenantId = req.user.tenantId;
        } else {
            tenantId = null;
        }
        let whereCondition = { name: name, deletedAt: null, tenantId: tenantId };

        const checkExist = await db.Role.findOne({
            where: whereCondition,
            disableTenantCheck: true,
            transaction,
        });

        if (checkExist) {
            await transaction.rollback();
            return res.status(status.Conflict).json({ status: false, message: 'Role already exists!' });
        }

        const payload = {
            name,
            description: req.body?.description,
            createdBy: req.user.id,
            tenantId: tenantId,
        };
        await db.Role.create(payload, { transaction });

        // await Promise.all(
        //     menuOrders.map(async (data) => {
        //         const menuOrderpayload = {
        //             menuOrderId: data,
        //             roleId: role.id,
        //         };
        //         await db.MenuOrderRole.create(menuOrderpayload, { transaction });
        //     })
        // );

        await transaction.commit();

        return res.status(status.OK).json({
            status: true,
            message: 'Role created successfully.',
        });
    } catch (err) {
        await transaction.rollback();
        return common.throwException(err, 'Create Role Api', req, res);
    }
};

exports.updateStatus = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { id } = req.params;

        const checkExist = await db.Role.findOne({
            where: {
                id,
                deletedAt: null,
                tenantId: req.user.tenantId,
            },
            disableTenantCheck: true,
            transaction,
        });

        if (!checkExist) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ status: false, message: 'Role not found' });
        }
        if (checkExist.status == enums.Status.Active.value) {
            let count = await dbCommon.checkAssociation(id, 'roleId');
            if (count > 0) {
                return res.status(status.BadRequest).json({
                    message: 'Cannot InActive this Role. It is associated with other records.',
                });
            }
        }
        checkExist.set({
            status: checkExist.status === enums.Status.Active.value ? enums.Status.Inactive.value : enums.Status.Active.value,
            updatedBy: req.user.id,
        });

        await checkExist.save({ transaction });

        await transaction.commit();
        return res.status(status.OK).json({
            status: true,
            message: 'Status updated successfully.',
        });
    } catch (err) {
        await transaction.rollback();
        return common.throwException(err, 'Role Status Update Api', req, res);
    }
};

exports.updateRole = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { id } = req.params;
        let tenantId;
        if (req.user.type != 'Main Admin') {
            tenantId = req.user.tenantId;
        } else {
            tenantId = null;
        }
        const { name } = req.body;

        const checkExist = await db.Role.findOne({
            where: {
                id,
                deletedAt: null,
                tenantId: tenantId,
            },
            disableTenantCheck: true,
            transaction,
        });
        if (!checkExist) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ status: false, message: 'Role not found' });
        }

        const checkIfRoleExist = await db.Role.findOne({
            where: {
                name: name,
                id: {
                    [Op.ne]: id,
                },
                deletedAt: null,
                tenantId: tenantId,
            },
            disableTenantCheck: true,
            transaction,
        });

        if (checkIfRoleExist) {
            await transaction.rollback();
            return res.status(status.Conflict).json({ status: false, message: 'Role already exists!' });
        }

        const payload = {
            name,
            description: req.body?.description,
            updatedAt: new Date(),
            updatedBy: req.user.id,
        };

        await db.Role.update(payload, { where: { id: id, tenantId: tenantId }, disableTenantCheck: true, transaction });
        await transaction.commit();
        return res.status(status.OK).json({
            status: true,
            message: 'Role updated successfully.',
        });
    } catch (err) {
        await transaction.rollback();
        return common.throwException(err, 'Update Role Api', req, res);
    }
};

exports.deleteRole = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { id } = req.params;

        const checkExist = await db.Role.findOne({
            where: {
                id,
                deletedAt: null,
            },
            disableTenantCheck: true,
            transaction,
        });

        if (!checkExist) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ status: false, message: 'Role not found' });
        }
        let count = await dbCommon.checkAssociation(id, 'roleId');
        if (count > 0) {
            return res.status(status.BadRequest).json({
                message: 'Cannot delete Role. It is associated with other records.',
            });
        }
        await checkExist.update(
            {
                deletedAt: new Date(),
                deletedBy: req.user.id,
            },
            { transaction }
        );

        await transaction.commit();
        return res.status(status.OK).json({
            status: true,
            message: 'Role deleted successfully.',
        });
    } catch (err) {
        await transaction.rollback();
        return common.throwException(err, 'Delete Role Api', req, res);
    }
};

exports.getRole = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { id } = req.params;
        let tenantId;
        if (req.user.type != 'Main Admin') {
            tenantId = req.user.tenantId;
        } else {
            tenantId = null;
        }

        const checkExist = await db.Role.findOne({
            attributes: ['id', 'name', 'description', 'status'],
            where: {
                id: id,
                status: enums.Status.Active.value,
                tenantId: tenantId,
                deletedAt: null,
            },
            disableTenantCheck: true,
            transaction,
        });

        if (!checkExist) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ status: false, message: 'Role not found' });
        }

        await transaction.commit();
        return res.status(status.OK).json({
            status: true,
            message: 'Success.',
            data: checkExist,
        });
    } catch (err) {
        await transaction.rollback();
        return common.throwException(err, 'Get Role Api', req, res);
    }
};

exports.getAllRole = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        // const { firstName, lastName, mobile, email, page, pageSize, skip, take, startDate, endDate, isActive, search } = req.query;
        const { name, isSystemAdmin, isAdmin, page, pageSize, startDate, endDate, isActive, search } = req.query;

        const dateFormat = 'YYYY-MM-DD';
        const firstDate = moment.tz(`${startDate} 00:00:00`, dateFormat + ' HH:mm:ss', 'Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss');
        const lastDate = moment.tz(`${endDate} 23:59:59`, dateFormat + ' HH:mm:ss', 'Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss');
        const pages = parseInt(page, 10) || 1;
        const pageSizes = parseInt(pageSize, 10) || 10;

        // Ensure 'skip' and 'take' are integers and provide defaults
        // const skipRecords = parseInt(skip, 10) || 0;
        // const takeRecords = parseInt(take, 10) || 100;

        let tenantId;
        if (req.user.type != 'Main Admin') {
            tenantId = req.user.tenantId;
        } else {
            tenantId = null;
        }

        let whereCondition = {
            deletedAt: null,
            tenantId: tenantId,
            id: {
                [Op.ne]: req.user.roleId,
            },
        };

        if (startDate && endDate) {
            whereCondition.createdAt = {
                [Op.between]: [firstDate, lastDate],
            };
        } else if (startDate) {
            whereCondition.createdAt = {
                [Op.gte]: firstDate,
            };
        } else if (endDate) {
            whereCondition.createdAt = {
                [Op.lte]: lastDate,
            };
        }

        if (name) {
            whereCondition.name = {
                [Op.like]: `%${name}%`,
            };
        }

        if (isSystemAdmin) {
            whereCondition.isSystemAdmin = isSystemAdmin;
        }

        if (isAdmin) {
            whereCondition.isAdmin = isAdmin;
        }

        if (isActive) {
            whereCondition.status = {
                [Op.like]: `%${isActive}%`,
            };
        }

        if (search) {
            whereCondition[Op.or] = [{ name: { [Op.like]: `%${search}%` } }];
        }
        const findAll = await db.Role.findAll({
            attributes: ['id', 'name', 'description', 'status', 'createdAt', 'updatedAt'],
            where: {
                ...whereCondition,
            },
            disableTenantCheck: true,
            order: [['createdAt', 'DESC']],
            limit: pageSizes,
            offset: (pages - 1) * pageSizes,
        });

        const findCount = await db.Role.count({ where: whereCondition, disableTenantCheck: true });

        if (findAll.length === 0) {
            await transaction.rollback();
            return res.status(status.OK).json({
                status: true,
                message: 'No data found!',
            });
        }
        let response = {
            user: findAll,
            totalCount: findCount,
        };

        await transaction.commit();
        return res.status(status.OK).json({
            status: true,
            message: 'Success.',
            data: response,
        });
    } catch (err) {
        await transaction.rollback();
        return common.throwException(err, 'Get Role List Api', req, res);
    }
};
