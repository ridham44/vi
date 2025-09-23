require('dotenv').config();
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const db = require('../../../db/models');
const { status, common, dbCommon } = require('../../../../utils');

exports.createPhone = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { number, departmentId, name, tenantId, countryCode } = req.body;
        const ipAddress = req.ip;

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
            countryCode: countryCode,
            departmentId: departmentId,
            tenantId: tenantId,
        };
        let Phone = await db.Phones.create(payload, { transaction });
        console.log('phone id is ', Phone.id);

        const logpayload = {
            event: 'Create',
            tenantId,
            createdBy: req.user.id,
            ipAddress,
            phoneId: Phone.id,
        };
        await db.PhoneLogs.create(logpayload, { transaction });

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
        const ipAddress = req.ip;
        let tenantId;
        const { name, number, departmentId, countryCode } = req.body;
        if (req.user.type == 'Mani Admin') {
            tenantId = req.body.tenantId;
        } else {
            tenantId = req.user.tenantId;
        }
        const payload = {
            name,
            tenantId,
            updatedAt: new Date(),
        };
        //check Phone number
        const checkExist = await db.Phones.findOne({
            where: {
                number,
                tenantId,
                deletedAt: null,
                id: { [Op.ne]: id },
            },
            disableTenantCheck: true,
            transaction,
        });
        if (checkExist) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ status: false, message: 'phone  already exist' });
        }

        // check department
        if (departmentId) {
            payload.departmentId = req.body.departmentId;

            const checkdepartmentExist = await db.Department.findOne({ where: { id: req.body.departmentId }, disableTenantCheck: true });

            if (!checkdepartmentExist) {
                await transaction.rollback();
                return res.status(status.NotFound).json({ status: false, message: 'department not exist' });
            }
        }

        if (req.user.type == 'Main Admin') {
            (payload.number = number), (payload.countryCode = countryCode);
        }
        const oldData = await db.Phones.findOne({
            attributes: ['number', 'name', 'departmentId'],
            where: { id },
            disableTenantCheck: true,
        });
        //let updatedata = await db.Phones.update(payload, { where: { id: id }, transaction });
        const logpayload = {
            event: 'Update',
            tenantId,
            createdBy: req.user.id,
            ipAddress,
            phoneId: id,
        };
        let record = await db.PhoneLogs.create(logpayload, { transaction });

        const oldDataPlain = oldData.get({ plain: true });
        for (const key of Object.keys(oldDataPlain)) {
            await db.PhoneAudit.create(
                {
                    recordId: record.id,
                    field: key,
                    oldValue: oldData[key],
                    newValue: payload[key] !== undefined ? payload[key] : oldData[key],
                },
                { transaction }
            );
        }
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
        let count = await dbCommon.checkAssociation(id, 'phoneId');
        if (count > 0) {
            return res.status(status.BadRequest).json({
                message: 'Cannot delete phone number. It is associated with other records.',
            });
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

exports.getPhone = async (req, res) => {
    try {
        const { id } = req.params;

        const checkExist = await db.Phones.findOne({
            where: {
                id: id,
                deletedAt: null,
            },
            disableTenantCheck: true,
        });

        if (!checkExist) {
            return res.status(status.NotFound).json({ status: false, message: 'Phone is not found' });
        }

        return res.status(status.OK).json({
            status: true,
            message: 'Success.',
            data: checkExist,
        });
    } catch (err) {
        return common.throwException(err, 'Get Phone Api', req, res);
    }
};

exports.getAllPhones = async (req, res) => {
    try {
        // const { search } = req.query;

        let whereCondition = {
            deletedAt: null,
        };
        if (req.query.Id) {
            whereCondition.tenantId = req.query.Id;
        } else {
            whereCondition.tenantId = req.user.tenantId;
        }

        const findAll = await db.Phones.findAll({
            attributes: ['id', 'name', 'number', 'countryCode', 'createdAt', 'updatedAt'],
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
            return res.status(status.OK).json({
                status: true,
                message: 'No data found!',
            });
        }
        let response = {
            department: findAll,
            totalCount: findCount,
        };

        return res.status(status.OK).json({
            status: true,
            message: 'Success.',
            data: response,
        });
    } catch (err) {
        return common.throwException(err, 'Get phone List Api', req, res);
    }
};

exports.getAllPhonesHistory = async (req, res) => {
    try {
        let whereCondition = {
            deletedAt: null,
        };
        if (req.query.Id) {
            whereCondition.tenantId = req.query.Id;
        } else {
            whereCondition.tenantId = req.user.tenantId;
        }

        const findAll = await db.PhoneLogs.findAll({
            attributes: ['id', 'event', 'ipAddress', 'createdAt', 'updatedAt'],
            where: {
                ...whereCondition,
            },
            include: [
                {
                    model: db.Phones,
                    as: 'Phones',
                    required: true,
                    attributes: ['number'],
                    where: {
                        deletedAt: null,
                    },
                },
                {
                    model: db.User,
                    as: 'User',
                    required: true,
                    attributes: ['firstName', 'lastName'],
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
            return res.status(status.OK).json({
                status: true,
                message: 'No data found!',
            });
        }
        let response = {
            department: findAll,
            totalCount: findCount,
        };

        return res.status(status.OK).json({
            status: true,
            message: 'Success.',
            data: response,
        });
    } catch (err) {
        return common.throwException(err, 'Get phone List Api', req, res);
    }
};

exports.getAllPhonesByDepartment = async (req, res) => {
    try {
        const { departmentIds } = req.body;
        if (departmentIds.length <= 0) {
            return res.status(status.OK).json({
                status: false,
                message: 'no data found',
                data: [],
            });
        }

        const phones = await db.Phones.findAll({
            where: {
                departmentId: {
                    [Op.in]: departmentIds,
                },
                deletedAt: null,
            },
            disableTenantCheck: true,
            attributes: ['id', 'name', 'countryCode', 'number', 'departmentId'],
        });
        return res.status(status.OK).json({
            status: true,
            message: 'Success.',
            data: phones,
        });
    } catch (err) {
        console.error('Error fetching phones:', err);
        return common.throwException(err, 'Get Phone Api', req, res);
    }
};
