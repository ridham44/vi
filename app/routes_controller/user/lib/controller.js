require('dotenv').config();
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const db = require('../../../db/models');
const User = db.User;
const { status, common, enums } = require('../../../../utils');
const bcrypt = require('bcryptjs');
const moment = require('moment-timezone');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');

exports.userLogin = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { email, password } = req.body;

        const user = await User.scope('withPassword').findOne({
            attributes: ['id', 'firstName', 'lastName', 'mobile', 'email', 'password', 'profileImage'],
            where: {
                deletedAt: null,
                email: email,
                status: enums.Status.Active.value,
            },
            disableTenantCheck: true,
            include: [
                {
                    model: db.Role,
                    as: 'Role',
                    attributes: ['name', 'isMasterAdmin'],
                },
            ],
            transaction,
        });

        if (!user) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ status: false, message: 'Invalid Email!' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            await transaction.rollback();
            return res.status(status.Unauthorized).json({ status: false, message: 'Invalid password!' });
        }
        let type;

        if (user.Role.isMasterAdmin) {
            type = 'Main Admin';
        } else {
            type = user.Role.name;
        }

        const tokenPayload = {
            id: user.id,
            firstName: user.firstName,
            email: user.email,
            type: type,
        };

        const token = jwt.sign(tokenPayload, process.env.JWT_SECRET_API, {
            expiresIn: process.env.TOKEN_EXPIRE_MIN,
        });

        res.cookie('token', token, {
            httpOnly: true,
            secure: true,
            //domain: ".inc1.devtunnels.ms",
            sameSite: 'none', //.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 24 * 60 * 60 * 1000,
        });

        const userData = {
            firstName: user.firstName,
            lastName: user.lastName,
            mobile: user.mobile,
            email: user.email,
            profileImage: user.profileImage,
            role: user.Role.name,
        };

        await transaction.commit();

        return res.status(status.OK).json({
            status: true,
            message: 'Login Success',
            data: userData,
        });
    } catch (err) {
        console.log(err);
        await transaction.rollback();
        return common.throwException(err, 'User Login Api', req, res);
    }
};

exports.userLogout = (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
    });

    res.status(status.OK).json({ message: 'Logged out successfully' });
};

exports.changePassword = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { oldPassword, newPassword, confirmPassword } = req.body;

        if (!(newPassword === confirmPassword)) {
            await transaction.rollback();
            return res.status(status.BadRequest).json({
                message: 'New Password and Confirm Password do not match.',
            });
        }

        const user = await User.findOne({
            attributes: ['id', 'email', 'password'],
            where: {
                id: req.user.id,
                deletedAt: null,
                tenantId: req.user.tenantId,
            },
            disableTenantCheck: true,
            transaction,
        });

        if (!user) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ status: false, message: 'User not found' });
        }

        const isOldPasswordCorrect = await bcrypt.compare(oldPassword, user.password);
        if (!isOldPasswordCorrect) {
            await transaction.rollback();
            return res.status(status.Unauthorized).json({ status: false, message: 'Old password is incorrect' });
        }

        if (await bcrypt.compare(newPassword, user.password)) {
            await transaction.rollback();
            return res.status(status.BadRequest).json({ status: false, message: 'New password cannot be the same as the old password' });
        }

        await user.update(
            {
                password: newPassword,
            },
            {
                where: {
                    id: req.user.id,
                },
                transaction,
            }
        );
        await transaction.commit();

        return res.status(status.OK).json({
            status: true,
            message: 'Password changed successfully.',
        });
    } catch (err) {
        await transaction.rollback();
        return common.throwException(err, 'Change Password Api', req, res);
    }
};

exports.createUser = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { firstName, lastName, mobile, email, password } = req.body;
        const file = req.file;

        const checkExist = await User.findOne({
            where: {
                email,
                deletedAt: null,
                tenantId: req.user.tenantId,
            },
            disableTenantCheck: true,
            transaction,
        });

        if (checkExist) {
            await transaction.rollback();
            return res.status(status.Conflict).json({ status: false, message: 'Email already exists!' });
        }

        const payload = {
            firstName,
            lastName,
            mobile,
            email,
            password,
            profileImage: file ? `/uploads/userProfile/${file.filename}` : null,
            status: enums.Status.Active.value,
            createdBy: req.user.id,
        };
        await User.create(payload, { transaction });

        await transaction.commit();

        return res.status(status.OK).json({
            status: true,
            message: 'User created successfully.',
        });
    } catch (err) {
        await transaction.rollback();
        return common.throwException(err, 'Create User Api', req, res);
    }
};

exports.updateStatus = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { id } = req.params;

        const checkExist = await User.findOne({
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
            return res.status(status.NotFound).json({ status: false, message: 'User not found' });
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
        return common.throwException(err, 'User Status Update Api', req, res);
    }
};

exports.updateUser = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { id } = req.params;
        const { firstName, lastName, mobile, email } = req.body;
        const file = req.file;

        const checkExist = await User.findOne({
            where: {
                id,
                deletedAt: null,
            },
            disableTenantCheck: true,
            transaction,
        });

        if (!checkExist) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ status: false, message: 'User not found' });
        }

        const checkIfEmailExist = await User.findOne({
            where: {
                email: email,
                id: {
                    [Op.ne]: id,
                },
                deletedAt: null,
            },
            disableTenantCheck: true,
            transaction,
        });

        if (checkIfEmailExist) {
            await transaction.rollback();
            return res.status(status.Conflict).json({ status: false, message: 'Email already exists!' });
        }

        if (file) {
            const oldProfileImage = checkExist.profileImage;
            if (oldProfileImage) {
                const oldImagePath = path.join(__dirname, '../../../../uploads/userProfile', path.basename(oldProfileImage));
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
        }
        const payload = {
            firstName,
            lastName,
            mobile,
            email,
            profileImage: file ? `/uploads/userProfile/${file.filename}` : checkExist.profileImage,
            updatedAt: new Date(),
            updatedBy: req.user.id,
        };

        await User.update(payload, { where: { id: id }, transaction });
        await transaction.commit();
        return res.status(status.OK).json({
            status: true,
            message: 'User updated successfully.',
        });
    } catch (err) {
        await transaction.rollback();
        return common.throwException(err, 'Update User Api', req, res);
    }
};

exports.deleteUser = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { id } = req.params;

        const checkExist = await User.findOne({
            where: {
                id,
                deletedAt: null,
            },
            disableTenantCheck: true,
            transaction,
        });

        if (!checkExist) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ status: false, message: 'User not found' });
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
            message: 'User deleted successfully.',
        });
    } catch (err) {
        await transaction.rollback();
        return common.throwException(err, 'Delete User Api', req, res);
    }
};

exports.getUser = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { id } = req.params;

        const checkExist = await User.findOne({
            attributes: ['firstName', 'lastName', 'mobile', 'email', 'profileImage'],
            where: {
                id: id,
                status: enums.Status.Active.value,
                deletedAt: null,
            },
            disableTenantCheck: true,
            transaction,
        });

        if (!checkExist) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ status: false, message: 'User not found' });
        }

        if (checkExist.profileImage) {
            checkExist.profileImage = `${checkExist.profileImage}`;
        }

        await transaction.commit();
        return res.status(status.OK).json({
            status: true,
            message: 'Success.',
            data: checkExist,
        });
    } catch (err) {
        await transaction.rollback();
        return common.throwException(err, 'Get User Api', req, res);
    }
};

exports.getAllUser = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { firstName, lastName, mobile, email, page, pageSize, startDate, endDate, isActive, search } = req.query;
        const dateFormat = 'YYYY-MM-DD';
        const firstDate = moment.tz(`${startDate} 00:00:00`, dateFormat + ' HH:mm:ss', 'Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss');
        const lastDate = moment.tz(`${endDate} 23:59:59`, dateFormat + ' HH:mm:ss', 'Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss');
        const pages = parseInt(page, 10) || 1;
        const pageSizes = parseInt(pageSize, 10) || 10;

        // Ensure 'skip' and 'take' are integers and provide defaults
        // const skipRecords = parseInt(skip, 10) || 0;
        // const takeRecords = parseInt(take, 10) || 100;

        let whereCondition = {
            tenantId: req.user.tenantId,
            deletedAt: null,
        };
        if (req.user.type != 'Main Admin') {
            whereCondition.tenantId = req.user.tenantId;
            whereCondition.email = {
                [Op.ne]: process.env.EMAIL,
            };
            whereCondition.id = {
                [Op.ne]: req.user.id,
            };
            whereCondition.tenantId = req.user.tenantId;
        }

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

        if (firstName) {
            whereCondition.firstName = {
                [Op.like]: `%${firstName}%`,
            };
        }

        if (lastName) {
            whereCondition.lastName = {
                [Op.like]: `%${lastName}%`,
            };
        }

        if (mobile) {
            whereCondition.mobile = {
                [Op.like]: `%${mobile}%`,
            };
        }

        if (email) {
            whereCondition.email = {
                [Op.like]: `%${email}%`,
            };
        }

        if (isActive) {
            whereCondition.status = {
                [Op.like]: `%${isActive}%`,
            };
        }

        if (search) {
            whereCondition[Op.or] = [
                { firstName: { [Op.like]: `%${search}%` } },
                { lastName: { [Op.like]: `%${search}%` } },
                { mobile: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } },
            ];
        }
        const findAll = await User.findAll({
            attributes: ['id', 'firstName', 'lastName', 'mobile', 'email', 'profileImage', 'status', 'createdAt'],
            where: {
                ...whereCondition,
            },
            include: [
                {
                    model: db.Role,
                    as: 'Role',
                    attributes: ['name'],
                },
            ],
            disableTenantCheck: true,
            order: [['createdAt', 'DESC']],
            limit: pageSizes,
            offset: (pages - 1) * pageSizes,
        });

        const findCount = await User.count({ where: whereCondition, disableTenantCheck: true });

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
        return common.throwException(err, 'Get User List Api', req, res);
    }
};
