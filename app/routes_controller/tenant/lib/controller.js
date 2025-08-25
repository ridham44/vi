require('dotenv').config();
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const db = require('../../../db/models');
const { status, common, enums } = require('../../../../utils');
const moment = require('moment-timezone');

exports.createTenant = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { companyName, email, mycoBackendUrl, frontendUrl, menuOrders } = req.body;

        const checkExist = await db.Tenant.findOne({
            where: {
                companyName,
                deletedAt: null,
            },
            transaction,
        });

        if (checkExist) {
            await transaction.rollback();
            return res.status(status.Conflict).json({ status: false, message: 'Tenant already exists!' });
        }
        // const checkEmailExist = await db.User.findOne({
        //     where: {
        //         email,
        //         deletedAt: null,
        //     },
        //     transaction,
        // });

        // if (checkEmailExist) {
        //     await transaction.rollback();
        //     return res.status(status.Conflict).json({ status: false, message: 'Email already exists!' });
        // }

        const payload = {
            companyName,
            companyId: '1',
            mycoBackendUrl,
            frontendUrl,
            createdBy: req.user.id,
        };
        let tenant = await db.Tenant.create(payload, { transaction });

        const Rolepayload = {
            name: 'Tenant',
            isSystemAdmin: false,
            isAdmin: true,
            tenantId: tenant.id,
        };
        let role = await db.Role.create(Rolepayload, { transaction });

        await Promise.all(
            menuOrders.map(async (data) => {
                const menuOrderpayload = {
                    menuOrderId: data,
                    roleId: role.id,
                    tenantId: tenant.Id,
                };
                await db.MenuOrderRole.create(menuOrderpayload, { transaction });
            })
        );

        const userpayload = [
            {
                email,
                password: 'Admin@123', //Admin@123
                tenantId: tenant.id,
                // createdBy: tenant.id,
                roleId: role.id,
            },
            {
                email: process.env.EMAIL,
                password: 'Admin@123', //Admin@123
                tenantId: tenant.id,
                // createdBy: tenant.id,
                roleId: role.id,
            },
        ];
        await db.User.bulkCreate(userpayload, { transaction });
        await transaction.commit();

        return res.status(status.OK).json({
            status: true,
            message: 'Tenant created successfully.',
        });
    } catch (err) {
        console.log(err);

        await transaction.rollback();
        return common.throwException(err, 'Create Tenant Api', req, res);
    }
};

exports.updateStatus = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { id } = req.params;

        const checkExist = await db.Tenant.findOne({
            where: {
                id,
                deletedAt: null,
            },
            transaction,
        });

        if (!checkExist) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ status: false, message: 'Tenant not found' });
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
        return common.throwException(err, 'Tenant Status Update Api', req, res);
    }
};

exports.updateTenant = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { id } = req.params;
        const { companyName, mycoBackendUrl, frontendUrl } = req.body;

        const checkExist = await db.Tenant.findOne({
            where: {
                id,
                deletedAt: null,
            },
            transaction,
        });

        if (!checkExist) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ status: false, message: 'Tenant not found' });
        }

        const checkIfCompanyExist = await db.Tenant.findOne({
            where: {
                companyName,
                id: {
                    [Op.ne]: id,
                },
                deletedAt: null,
            },
            disableTenantCheck: true,
            transaction,
        });

        //   const checkIfEmailExist = await db.User.findOne({
        //     where: {
        //         email:email,
        //         tenantId:id,
        //         deletedAt: null,
        //     },
        //     disableTenantCheck: true,
        //     transaction,
        // });
        if (checkIfCompanyExist) {
            await transaction.rollback();
            return res.status(status.Conflict).json({ status: false, message: ' Company Name already exists !' });
        }
        //  if (checkIfEmailExist ) {
        //     await transaction.rollback();
        //     return res.status(status.Conflict).json({ status: false, message: ' Email already exists !' });
        // }

        const payload = {
            companyName,
            companyId: '1',
            mycoBackendUrl,
            frontendUrl,
            updatedAt: new Date(),
            updatedBy: req.user.id,
        };

        await db.Tenant.update(payload, { where: { id: id }, transaction });
        await transaction.commit();
        return res.status(status.OK).json({
            status: true,
            message: 'Tenant updated successfully.',
        });
    } catch (err) {
        await transaction.rollback();
        return common.throwException(err, 'Update Tenant Api', req, res);
    }
};

exports.deleteTenant = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { id } = req.params;

        const checkExist = await db.Tenant.findOne({
            where: {
                id,
                deletedAt: null,
            },
            transaction,
        });

        if (!checkExist) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ status: false, message: 'Tenant not found' });
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
            message: 'Tenant deleted successfully.',
        });
    } catch (err) {
        await transaction.rollback();
        return common.throwException(err, 'Delete Tenant Api', req, res);
    }
};

exports.getTenant = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { id } = req.params;

        const checkExist = await db.Tenant.findOne({
            attributes: ['id', 'companyName', 'subDomain', 'mycoBackendUrl', 'frontendUrl', 'createdAt'],
            where: {
                id: id,
                // status: enums.Status.Active.value,
                deletedAt: null,
            },
            transaction,
        });

        if (!checkExist) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ status: false, message: 'Tenant not found' });
        }

        await transaction.commit();
        return res.status(status.OK).json({
            status: true,
            message: 'Success.',
            data: checkExist,
        });
    } catch (err) {
        await transaction.rollback();
        return common.throwException(err, 'Get Tenant Api', req, res);
    }
};

exports.getAllTenant = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        // const { firstName, lastName, mobile, email, page, pageSize, skip, take, startDate, endDate, isActive, search } = req.query;
        const { companyName, subDomain, mycoBackendUrl, frontendUrl, page, pageSize, startDate, endDate, search } = req.query;

        const dateFormat = 'YYYY-MM-DD';
        const firstDate = moment.tz(`${startDate} 00:00:00`, dateFormat + ' HH:mm:ss', 'Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss');
        const lastDate = moment.tz(`${endDate} 23:59:59`, dateFormat + ' HH:mm:ss', 'Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss');
        const pages = parseInt(page, 10) || 1;
        const pageSizes = parseInt(pageSize, 10) || 10;

        // Ensure 'skip' and 'take' are integers and provide defaults
        // const skipRecords = parseInt(skip, 10) || 0;
        // const takeRecords = parseInt(take, 10) || 100;

        let whereCondition = {
            deletedAt: null,
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

        if (companyName) {
            whereCondition.companyName = {
                [Op.like]: `%${companyName}%`,
            };
        }

        if (subDomain) {
            whereCondition.subDomain = {
                [Op.like]: `%${subDomain}%`,
            };
        }

        if (mycoBackendUrl) {
            whereCondition.mycoBackendUrl = {
                [Op.like]: `%${mycoBackendUrl}%`,
            };
        }

        if (frontendUrl) {
            whereCondition.frontendUrl = {
                [Op.like]: `%${frontendUrl}%`,
            };
        }

        // if (isActive) {
        //     whereCondition.status = {
        //         [Op.like]: `%${isActive}%`,
        //     };
        // }

        if (search) {
            whereCondition[Op.or] = [
                { companyName: { [Op.like]: `%${search}%` } },
                { subDomain: { [Op.like]: `%${search}%` } },
                { mycoBackendUrl: { [Op.like]: `%${search}%` } },
                { frontendUrl: { [Op.like]: `%${search}%` } },
            ];
        }
        const findAll = await db.Tenant.findAll({
            attributes: ['id', 'companyName', 'subDomain', 'mycoBackendUrl', 'frontendUrl', 'createdAt'],
            where: {
                ...whereCondition,
            },
            order: [['createdAt', 'DESC']],
            limit: pageSizes,
            offset: (pages - 1) * pageSizes,
        });

        const findCount = await db.Tenant.count({ where: whereCondition });

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
        return common.throwException(err, 'Get Tenant List Api', req, res);
    }
};
