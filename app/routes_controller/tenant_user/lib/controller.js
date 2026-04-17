'use strict';
const { Op } = require('sequelize');
const { status, common, dbCommon } = require('../../../../utils');
const db = require('../../../db/models');

exports.create = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { body } = req;

        // Check duplicate email
        const existingUser = await db.User.findOne({
            where: { email: body.email },
            disableTenantCheck: true,
            transaction,
        });
        if (existingUser) {
            await transaction.rollback();
            return res.status(status.Conflict).json({ message: 'Email already exists!' });
        }

        await db.User.create(
            {
                firstName: body.firstName,
                lastName: body.lastName,
                mobile: body.mobile,
                password: `${body.firstName.toLowerCase()}@123`,
                email: body.email,
                roleId: body.roleId,
                tenantId: req.user.tenantId,
                departmentId: body.departmentId || null,
                status: '1',
                createdBy: req.user.id,
            },
            { transaction }
        );

        await transaction.commit();
        return res.status(status.OK).json({ message: 'User created successfully!' });
    } catch (error) {
        await transaction.rollback();
        return common.throwException(error, 'Create User API', req, res);
    }
};

exports.update = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { body } = req;
        const { id } = req.params;

        const user = await db.User.findOne({
            where: { id },
            disableTenantCheck: true,
            transaction,
        });

        if (!user) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'User not found!' });
        }

        if (body.email) {
            const duplicate = await db.User.findOne({
                where: {
                    email: body.email,
                    id: { [Op.ne]: id },
                },
                disableTenantCheck: true,
                transaction,
            });

            if (duplicate) {
                await transaction.rollback();
                return res.status(status.Conflict).json({ message: 'Email already exists!' });
            }
        }

        user.set({
            firstName: body.firstName,
            lastName: body.lastName,
            mobile: body.mobile,
            email: body.email,
            roleId: body.roleId,
            password: body.password,
            tenantId: req.user.tenantId,
            departmentId: body.departmentId || null,
            updatedBy: req.user.id,
        });

        await user.save({ transaction });
        await transaction.commit();
        return res.status(status.OK).json({ message: 'User updated successfully!' });
    } catch (error) {
        await transaction.rollback();
        return common.throwException(error, 'Update User API', req, res);
    }
};

exports.delete = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { id } = req.params;

        // Find user ignoring tenant check
        const user = await db.User.findOne({
            where: { id },
            disableTenantCheck: true,
            transaction,
        });

        if (!user) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'User not found!' });
        }

        // Check dependencies (child records)
        const hasChildren = await dbCommon.hasAnyChildren(user);
        if (hasChildren.hasChildren) {
            await transaction.rollback();
            return res.status(status.Conflict).json({ message: hasChildren.message });
        }

        // Soft delete (update instead of destroy)
        await user.update(
            {
                status: '0',
                deletedBy: req.user.id,
                deletedAt: new Date(),
            },
            { transaction }
        );

        await transaction.commit();
        return res.status(status.OK).json({ message: 'User deleted successfully.' });
    } catch (error) {
        await transaction.rollback();
        return common.throwException(error, 'Delete User API', req, res);
    }
};

exports.findById = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await db.User.findOne({
            where: { tenantId: req.user.tenantId, id },
            disableTenantCheck: true,
        });

        if (!user) {
            return res.status(status.NotFound).json({ message: 'User not found!' });
        }

        return res.status(status.OK).json({ data: user });
    } catch (error) {
        return common.throwException(error, 'Find User By ID API', req, res);
    }
};

exports.findAll = async (req, res) => {
    try {
        const users = await db.User.findAll({
            where: { tenantId: req.user.tenantId, deletedAt: null },
            order: [['createdAt', 'DESC']],
            disableTenantCheck: true,
        });

        return res.status(status.OK).json({ data: users });
    } catch (error) {
        return common.throwException(error, 'Find All Users API', req, res);
    }
};

exports.updateStatus = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { id } = req.params;
        const user = await db.User.findOne({
            where: { id },
            disableTenantCheck: true,
            transaction,
        });

        if (!user) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'Invalid user ID!' });
        }

        user.status = user.status === '1' ? '0' : '1';

        await user.save({ transaction });
        await transaction.commit();

        return res.status(status.OK).json({ message: 'Status updated successfully!' });
    } catch (error) {
        await transaction.rollback();
        return common.throwException(error, 'Update User Status API', req, res);
    }
};
