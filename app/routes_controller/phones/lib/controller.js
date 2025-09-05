require('dotenv').config();
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const db = require('../../../db/models');
const { status, common } = require('../../../../utils');

exports.createPhone = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { number, departmentId, name, tenantId } = req.body;
        console.log('tenantId', tenantId);

        const checkExist = await db.Phones.findOne({
            where: {
                number: number,
                deletedAt: null,
                tenantId: tenantId,
            },
            transaction,
            disableTenantCheck: true,
        });
        if (checkExist) {
            await transaction.rollback();
            return res.status(status.Conflict).json({ status: false, message: 'Number already exists!' });
        }

        const checkDepartmentExist = await db.Department.findOne({
            where: {
                id: departmentId,
                deletedAt: null,
                tenantId: tenantId,
            },
            transaction,
            disableTenantCheck: true,
        });
        if (!checkDepartmentExist) {
            await transaction.rollback();
            return res.status(status.Conflict).json({ status: false, message: 'Department not exists!' });
        }

        const payload = {
            name: name,
            number: number,
            departmentId: departmentId,
            tenantId: tenantId,
        };
        await db.Phones.create(payload, { transaction });

        await transaction.commit();

        return res.status(status.OK).json({
            status: true,
            message: 'phone number added successfully.',
        });
    } catch (err) {
        await transaction.rollback();
        return common.throwException(err, 'add phone number Api', req, res);
    }
};

exports.updatePhone = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { id } = req.params;
        const { name, number, tenantId, departmentId } = req.body;

        const checkExist = await db.Phones.findOne({
            where: {
                id,
                deletedAt: null,
                tenantId: tenantId,
                number: { [Op.ne]: number },
            },
            disableTenantCheck: true,
            transaction,
        });

        if (checkExist) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ status: false, message: 'phone  already exist' });
        }

        const payload = {
            name,
            number,
            tenantId,
            departmentId,
            updatedAt: new Date(),
        };

        await db.Phones.update(payload, { where: { id: id }, transaction });
        await transaction.commit();
        return res.status(status.OK).json({
            status: true,
            message: 'Phone updated successfully.',
        });
    } catch (err) {
        await transaction.rollback();
        return common.throwException(err, 'Update phone Api', req, res);
    }
};

exports.deletePhone = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { id } = req.params;

        const checkExist = await db.Phones.findOne({
            where: {
                id,
                deletedAt: null,
            },
            disableTenantCheck: true,
            transaction,
        });

        if (!checkExist) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ status: false, message: 'phone number not found' });
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
            message: 'phone number deleted successfully.',
        });
    } catch (err) {
        await transaction.rollback();
        return common.throwException(err, 'Delete phone Api', req, res);
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

exports.getAllPhones = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { search } = req.query;

        let whereCondition = {
            deletedAt: null,
        };
        if (req.query.Id) {
            whereCondition.tenantId = req.query.Id;
        } else {
            whereCondition.tenantId = req.user.tenantId;
        }
        if (search) {
            whereCondition[Op.or] = [{ name: { [Op.like]: `%${search}%` } }];
        }
        const findAll = await db.Phones.findAll({
            attributes: ['id', 'name', 'number', 'createdAt'],
            where: {
                ...whereCondition,
            },
            include: [
                {
                    model: db.Department,
                    as: 'Department',
                    required: true,
                    attributes: ['name'],
                    where: {
                        deletedAt: null,
                    },
                },
            ],
            order: [['createdAt', 'DESC']],
            disableTenantCheck: true,
        });

        const findCount = await db.Phones.count({ where: whereCondition, disableTenantCheck: true });

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
        return common.throwException(err, 'Get phone List Api', req, res);
    }
};
