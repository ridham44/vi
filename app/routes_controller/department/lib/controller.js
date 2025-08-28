require('dotenv').config();
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const db = require('../../../db/models');
const { status, common, } = require('../../../../utils');

exports.createDepartment = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { departmentName } = req.body;

        const checkExist = await db.Department.findOne({
            where: {
                name: departmentName,
                deletedAt: null,
                tenantId: req.user.tenantId,
            },
            transaction,
            disableTenantCheck: true,
        });

        if (checkExist) {
            await transaction.rollback();
            return res.status(status.Conflict).json({ status: false, message: 'Department already exists!' });
        }

        const payload = {
            name: departmentName,
            description: req.body?.description,
            tenantId: req.user.tenantId,
        };
        await db.Department.create(payload, { transaction });

        await transaction.commit();

        return res.status(status.OK).json({
            status: true,
            message: 'Department created successfully.',
        });
    } catch (err) {
        await transaction.rollback();
        return common.throwException(err, 'Create Department Api', req, res);
    }
};

exports.updateDepartment = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { id } = req.params;
        const { name } = req.body;

        const checkExist = await db.Department.findOne({
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
            return res.status(status.NotFound).json({ status: false, message: 'Department not found' });
        }

        const payload = {
            name,
            description: req.body?.description,
            updatedAt: new Date(),
        };

        await db.Department.update(payload, { where: { id: id }, transaction });
        await transaction.commit();
        return res.status(status.OK).json({
            status: true,
            message: 'Department updated successfully.',
        });
    } catch (err) {
        await transaction.rollback();
        return common.throwException(err, 'Update Department Api', req, res);
    }
};

exports.deleteDepartment = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { id } = req.params;

        const checkExist = await db.Department.findOne({
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
            return res.status(status.NotFound).json({ status: false, message: 'Department not found' });
        }

        await checkExist.update(
            {
                deletedAt: new Date(),
            },
            { transaction }
        );

        await transaction.commit();
        return res.status(status.OK).json({
            status: true,
            message: 'Department deleted successfully.',
        });
    } catch (err) {
        await transaction.rollback();
        return common.throwException(err, 'Delete Department Api', req, res);
    }
};

exports.getDepartment = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { id } = req.params;

        const checkExist = await db.Department.findOne({
            where: {
                id: id,
                deletedAt: null,
                tenantId: req.user.tenantId,
            },
            disableTenantCheck: true,
            transaction,
        });

        if (!checkExist) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ status: false, message: 'Department not found' });
        }

        await transaction.commit();
        return res.status(status.OK).json({
            status: true,
            message: 'Success.',
            data: checkExist,
        });
    } catch (err) {
        await transaction.rollback();
        return common.throwException(err, 'Get Department Api', req, res);
    }
};

exports.getAllDepartment = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { search } = req.query;

        let whereCondition = {
            deletedAt: null,
            tenantId: req.user.tenantId,
        };

        if (search) {
            whereCondition[Op.or] = [{ name: { [Op.like]: `%${search}%` } }];
        }
        const findAll = await db.Department.findAll({
            attributes: ['id', 'name', 'createdAt'],
            where: {
                ...whereCondition,
            },
            order: [['createdAt', 'DESC']],
            disableTenantCheck: true,
        });

        const findCount = await db.Department.count({ where: whereCondition, disableTenantCheck: true });

        if (findAll.length === 0) {
            await transaction.rollback();
            return res.status(status.OK).json({
                status: true,
                message: 'No data found!',
            });
        }
        let response = {
            department: findAll,
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
        return common.throwException(err, 'Get department List Api', req, res);
    }
};
