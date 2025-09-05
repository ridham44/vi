require('dotenv').config();
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const db = require('../../../db/models');
const { status, common, enums } = require('../../../../utils');
const moment = require('moment-timezone');

// Create packages
exports.createpackages = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { packagesName, packagesDescription, packagesAmount, noOfMonths } = req.body;

        const checkExist = await db.Packages.findOne({
            where: {
                packagesName,
                deletedAt: null,
            },
            transaction,
        });

        if (checkExist) {
            await transaction.rollback();
            return res.status(status.Conflict).json({ status: false, message: 'packages already exists!' });
        }

        const payload = {
            packagesName,
            packagesDescription,
            packagesAmount,
            noOfMonths,
            status: enums.Status.Active.value,
            createdBy: req.user.id,
        };

        await db.Packages.create(payload, { transaction });
        await transaction.commit();

        return res.status(status.OK).json({
            status: true,
            message: 'packages created successfully.',
        });
    } catch (err) {
        await transaction.rollback();
        return common.throwException(err, 'Create packages Api', req, res);
    }
};

// Update packages
exports.updatepackages = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { id } = req.params;
        const { packagesName, packagesDescription, packagesAmount, noOfMonths } = req.body;

        const checkExist = await db.Packages.findOne({
            where: { id, deletedAt: null },
            transaction,
        });

        if (!checkExist) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ status: false, message: 'packages not found' });
        }

        const duplicate = await db.Packages.findOne({
            where: {
                packagesName,
                id: { [Op.ne]: id },
                deletedAt: null,
            },
            transaction,
        });

        if (duplicate) {
            await transaction.rollback();
            return res.status(status.Conflict).json({ status: false, message: 'packages already exists!' });
        }

        await checkExist.update(
            {
                packagesName,
                packagesDescription,
                packagesAmount,
                noOfMonths,
                updatedBy: req.user.id,
                updatedAt: new Date(),
            },
            { transaction }
        );

        await transaction.commit();
        return res.status(status.OK).json({
            status: true,
            message: 'packages updated successfully.',
        });
    } catch (err) {
        await transaction.rollback();
        return common.throwException(err, 'Update packages Api', req, res);
    }
};

// Delete packages (soft delete)
exports.deletepackages = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { id } = req.params;

        const checkExist = await db.Packages.findOne({
            where: { id, deletedAt: null },
            transaction,
        });

        if (!checkExist) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ status: false, message: 'packages not found' });
        }
        const tenantUsingpackages = await db.Tenant.findOne({
            where: { packagesId: id, deletedAt: null },
            disableTenantCheck: true,
            transaction,
        });

        if (tenantUsingpackages) {
            await transaction.rollback();
            return res.status(status.Conflict).json({
                status: false,
                message: 'Cannot delete packages. One or more tenants are currently subscribed to this packages.',
            });
        }
        await checkExist.update({ deletedAt: new Date(), status: enums.Status.Inactive.value }, { transaction });

        await transaction.commit();
        return res.status(status.OK).json({
            status: true,
            message: 'packages deleted successfully.',
        });
    } catch (err) {
        await transaction.rollback();
        return common.throwException(err, 'Delete packages Api', req, res);
    }
};

// Get Single packages
exports.getpackages = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { id } = req.params;

        const checkExist = await db.Packages.findOne({
            attributes: ['id', 'packagesName', 'packagesDescription', 'packagesAmount', 'noOfMonths', 'status'],
            where: { id, deletedAt: null },
            transaction,
        });

        if (!checkExist) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ status: false, message: 'packages not found' });
        }

        await transaction.commit();
        return res.status(status.OK).json({
            status: true,
            message: 'Success.',
            data: checkExist,
        });
    } catch (err) {
        await transaction.rollback();
        return common.throwException(err, 'Get packages Api', req, res);
    }
};

// Get All packagess (with filters + pagination)
exports.getAllpackages = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { packagesName, status: isActive, page, pageSize, startDate, endDate, search } = req.query;

        const dateFormat = 'YYYY-MM-DD';
        const firstDate = startDate ? moment(`${startDate} 00:00:00`, dateFormat + ' HH:mm:ss').toDate() : null;
        const lastDate = endDate ? moment(`${endDate} 23:59:59`, dateFormat + ' HH:mm:ss').toDate() : null;

        const pages = parseInt(page, 10) || 1;
        const pageSizes = parseInt(pageSize, 10) || 10;

        let whereCondition = { deletedAt: null };

        if (packagesName) {
            whereCondition.packagesName = { [Op.like]: `%${packagesName}%` };
        }
        if (isActive) {
            whereCondition.status = isActive;
        }
        if (search) {
            whereCondition[Op.or] = [{ packagesName: { [Op.like]: `%${search}%` } }, { packagesDescription: { [Op.like]: `%${search}%` } }];
        }
        if (firstDate && lastDate) {
            whereCondition.createdAt = { [Op.between]: [firstDate, lastDate] };
        }

        const findAll = await db.Packages.findAll({
            attributes: ['id', 'packagesName', 'packagesDescription', 'packagesAmount', 'noOfMonths', 'status', 'createdAt'],
            where: whereCondition,
            order: [['createdAt', 'DESC']],
            limit: pageSizes,
            offset: (pages - 1) * pageSizes,
            transaction,
        });

        const findCount = await db.Packages.count({ where: whereCondition, transaction });

        await transaction.commit();
        return res.status(status.OK).json({
            status: true,
            message: findAll.length ? 'Success.' : 'No data found!',
            data: { packagess: findAll, totalCount: findCount },
        });
    } catch (err) {
        await transaction.rollback();
        return common.throwException(err, 'Get packages List Api', req, res);
    }
};
