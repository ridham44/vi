require('dotenv').config();
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const db = require('../../../db/models');
const User = db.User;
const { status, common, enums } = require('../../../../utils');
const bcrypt = require('bcryptjs');
//const moment = require('moment-timezone');
//const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const { fn, col } = db.Sequelize;
const crypto = require('crypto');
exports.userLogin = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { email, password } = req.body;

        //dev@chplgroup.org

        const user = await User.scope('withPassword').findOne({
            attributes: ['id', 'firstName', 'lastName', 'email', 'password', 'profileImage'],
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
            return res.status(status.NotFound).json({ status: false, message: 'User not found!' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            await transaction.rollback();
            return res.status(status.BadRequest).json({ status: false, message: 'Invalid password!' });
        }
        // let type;

        // if (user.Role.isMasterAdmin) {
        //     type = 'Main Admin';
        // } else {
        //     type = user.Role.name;
        // }

        // const tokenPayload = {
        //     id: user.id,
        //     firstName: user.firstName,
        //     email: user.email,
        //     type: type,
        // };

        // const token = jwt.sign(tokenPayload, process.env.JWT_SECRET_API, {
        //     expiresIn: process.env.TOKEN_EXPIRE_MIN,
        // });

        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day expiry

        await db.ForgotPassword.create(
            {
                userId: user.id,
                token: token,
                expiresAt,
            },
            { transaction }
        );
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
            // mobile: user.mobile,
            email: user.email,
            profileImage: user.profileImage,
            role: user.Role.name,
        };

        await transaction.commit();

        return res.status(status.OK).json({
            status: true,
            message: 'Login successful',
            data: userData,
        });
    } catch (err) {
        await transaction.rollback();
        return common.throwException(err, 'User Login Api', req, res);
    }
};

exports.userLogout = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const [affectedRows] = await db.ForgotPassword.update(
            { used: true },
            {
                where: {
                    userId: req.user.id,
                    token: req.cookies.token,
                },
                transaction,
            }
        );

        if (affectedRows > 0) {
            res.clearCookie('token', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
            });
        }

        await transaction.commit();

        return res.status(status.OK).json({ message: 'Logged out successfully' });
    } catch (err) {
        await transaction.rollback();
        console.error('Logout failed:', err);
        return res.status(status.InternalServerError).json({ message: 'Logout failed' });
    }
};

exports.changePassword = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { oldPassword, newPassword, confirmPassword } = req.body;
        let tenantId;
        if (req.user.type != 'Main Admin') {
            tenantId = req.user.tenantId;
        } else {
            tenantId = null;
        }

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
                tenantId: tenantId,
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
            return res.status(status.BadRequest).json({ status: false, message: 'Old password is incorrect' });
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

exports.forgotPassword = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { email } = req.body;

        const user = await db.User.findOne({
            where: { email, deletedAt: null },
            disableTenantCheck: true,
            transaction,
        });

        if (!user) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ status: false, message: 'No account found with this email address' });
        }

        // Generate secure token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry

        await db.ForgotPassword.update({ used: 1 }, { where: { userId: user.id } }, { transaction });

        // Save token in forgot_password table
        await db.ForgotPassword.create(
            {
                userId: user.id,
                token,
                expiresAt,
            },
            { transaction }
        );
        const template = await common.getTemplateByName('forgotpassword.html');
        const htmlToSend = template({
            fullName: user.firstName,
            resetLink: `https://videv.chplgroup.org/reset-password?token=${token}`,
            //   resetLink :`http://localhost:5173/reset-password?token=${token}`
        });
        const mailOptions = {
            to: email?.toLowerCase(),
            subject: 'Reset your CHPL account password',
            html: htmlToSend,
        };
        await common.sendEmail(mailOptions);

        // // Reset link
        // const resetLink = `https://videv.chplgroup.org/forgot-password?token=${token}`;

        // // Send email
        // await common.sendEmail({
        //     to: email,
        //     subject: 'Password Reset',
        //     text: `Hello ${user.firstName || ''},\n\nClick the link below to reset your password:\n${resetLink}\n\nThis link will expire in 1 hour.`,
        // });

        await transaction.commit();
        return res.status(status.OK).json({ status: true, message: 'Password reset link sent to your email' });
    } catch (err) {
        await transaction.rollback();
        console.error(err);
        return res.status(status.InternalServerError).json({ status: false, message: 'Something went wrong' });
    }
};

exports.resetPassword = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { token, newPassword } = req.body;

        const resetRequest = await db.ForgotPassword.findOne({
            where: { token, used: false },
            transaction,
        });

        if (!resetRequest) {
            await transaction.rollback();
            return res.status(status.NotFound).json({
                status: false,
                message: 'Invalid or expired token',
            });
        }

        if (new Date() > resetRequest.expiresAt) {
            await transaction.rollback();
            return res.status(status.BadRequest).json({
                status: false,
                message: 'Reset link has expired',
            });
        }

        const user = await db.User.scope('withPassword').findByPk(resetRequest.userId, {
            transaction,
            disableTenantCheck: true,
        });

        if (!user) {
            await transaction.rollback();
            return res.status(status.NotFound).json({
                status: false,
                message: 'User not found',
            });
        }

        await user.update({ password: newPassword }, { transaction });

        await resetRequest.update({ used: true }, { transaction });

        await transaction.commit();
        return res.status(status.OK).json({ status: true, message: 'Password reset successful' });
    } catch (err) {
        await transaction.rollback();
        console.error(err);
        return res.status(status.InternalServerError).json({
            status: false,
            message: 'Something went wrong',
        });
    }
};

exports.createUser = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { firstName, lastName, email, password, phoneIds, status } = req.body;
        const file = req.file;
        let tenantId;
        if (req.user.type != 'Main Admin') {
            tenantId = req.user.tenantId;
        } else {
            tenantId = null;
        }
        const checkIfNameExist = await User.findOne({
            where: {
                firstName: firstName,
                lastName: lastName,
                deletedAt: null,
                tenantId: tenantId,
            },
            disableTenantCheck: true,
            transaction,
        });

        if (checkIfNameExist) {
            await transaction.rollback();
            return res.status(status.Conflict).json({
                status: false,
                message: 'User with the same first and last name already exists!',
            });
        }
        if (email == process.env.ADMINEMAIL) {
            await transaction.rollback();
            return res.status(status.Conflict).json({ status: false, message: 'Email already exists!' });
        }
        const checkExist = await User.findOne({
            where: {
                email,
                deletedAt: null,
                tenantId: tenantId,
            },
            disableTenantCheck: true,
            transaction,
        });

        if (checkExist) {
            await transaction.rollback();
            return res.status(status.Conflict).json({ status: false, message: 'Email already exists!' });
        }
        if (req.user.type != 'Main Admin') {
            const checkDepartmentExist = await db.Department.findOne({
                where: {
                    id: req.body.departmentId,
                    deletedAt: null,
                    tenantId: req.user.tenantId,
                },
                disableTenantCheck: true,
                transaction,
            });

            if (!checkDepartmentExist) {
                await transaction.rollback();
                return res.status(status.Conflict).json({ status: false, message: 'Department not exists!' });
            }
        }
        const checkRoleExist = await db.Role.findOne({
            where: {
                id: req.body.roleId,
                deletedAt: null,
                tenantId: req.user.tenantId,
            },
            disableTenantCheck: true,
            transaction,
        });

        if (!checkRoleExist) {
            await transaction.rollback();
            return res.status(status.Conflict).json({ status: false, message: 'Role not exists!' });
        }

        const payload = {
            firstName,
            lastName,
            email,
            roleId: req.body.roleId,
            password,
            departmentId: req.body?.departmentId,
            profileImage: file ? `/uploads/userProfile/${file.filename}` : null,
            status,
            createdBy: req.user.id,
            tenantId: req.user.tenantId,
        };
        const user = await User.create(payload, { transaction });
        if (phoneIds) {
            let phonesArray = [];

            phoneIds.forEach(async (i) => {
                phonesArray.push({
                    userId: user.id,
                    phoneId: i,
                    createdBy: req.user.id,
                });
            });

            await db.UserPhones.bulkCreate(phonesArray, { transaction });
        }

        const template = await common.getTemplateByName('email.html');
        const htmlToSend = template({
            fullName: firstName,
            password: password,
            email: email,
        });
        const mailOptions = {
            to: email?.toLowerCase(),
            subject: 'Login Password',
            html: htmlToSend,
        };
        await common.sendEmail(mailOptions);

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
        const { firstName, lastName, email, departmentId, roleId, phoneIds, status: userStatus } = req.body;
        const file = req.file;
        let tenantId;
        if (req.user.type != 'Main Admin') {
            tenantId = req.user.tenantId;
        } else {
            tenantId = null;
        }
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
                tenantId: tenantId,
                deletedAt: null,
            },
            disableTenantCheck: true,
            transaction,
        });

        if (checkIfEmailExist) {
            await transaction.rollback();
            return res.status(status.Conflict).json({ status: false, message: 'Email already exists!' });
        }

        const checkIfNameExist = await User.findOne({
            where: {
                firstName: firstName,
                lastName: lastName,
                id: {
                    [Op.ne]: id,
                },
                deletedAt: null,
                tenantId: tenantId,
            },
            disableTenantCheck: true,
            transaction,
        });

        if (checkIfNameExist) {
            await transaction.rollback();
            return res.status(status.Conflict).json({
                status: false,
                message: 'User with the same first and last name already exists!',
            });
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
            email,
            roleId,
            departmentId,
            status: userStatus,
            profileImage: file ? `/uploads/userProfile/${file.filename}` : checkExist.profileImage,
            updatedAt: new Date(),
            updatedBy: req.user.id,
        };

        await User.update(payload, { where: { id: id }, transaction });
        await db.UserPhones.destroy({
            where: {
                userId: id,
            },
            transaction,
        });

        let phonesArray = [];

        phoneIds.forEach(async (i) => {
            phonesArray.push({
                userId: id,
                phoneId: i,
                createdBy: req.user.id,
            });
        });

        await db.UserPhones.bulkCreate(phonesArray, { transaction });
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
    try {
        const { id } = req.params;

        const checkExist = await User.findOne({
            attributes: ['firstName', 'lastName', 'email', 'profileImage', 'status', 'createdAt', 'updatedAt'],
            where: {
                id: id,
                deletedAt: null,
            },
            include: [
                {
                    model: db.Role,
                    as: 'Role',
                    attributes: ['id', 'name'],
                    required: false,
                },
                {
                    model: db.Department,
                    as: 'Department',
                    attributes: ['id', 'name'],
                    required: false,
                },
                {
                    model: db.UserPhones,
                    as: 'userPhones',
                    attributes: ['phoneId'],
                    include: [
                        {
                            model: db.Phones,
                            as: 'Phones',
                            attributes: ['name', 'number', 'departmentId'],
                            required: false,
                        },
                    ],
                    required: false,
                },
            ],
            disableTenantCheck: true,
        });

        if (!checkExist) {
            return res.status(status.NotFound).json({ status: false, message: 'User not found' });
        }

        if (checkExist.profileImage) {
            checkExist.profileImage = `${checkExist.profileImage}`;
        }

        return res.status(status.OK).json({
            status: true,
            message: 'Success.',
            data: checkExist,
        });
    } catch (err) {
        return common.throwException(err, 'Get User Api', req, res);
    }
};

exports.getAllUser = async (req, res) => {
    try {
        // const { firstName, lastName, email, page, pageSize, startDate, endDate, isActive, search } = req.query;

        const { isActive } = req.query;

        // const dateFormat = 'YYYY-MM-DD';
        // const firstDate = moment.tz(`${startDate} 00:00:00`, dateFormat + ' HH:mm:ss', 'Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss');
        // const lastDate = moment.tz(`${endDate} 23:59:59`, dateFormat + ' HH:mm:ss', 'Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss');
        // const pages = parseInt(page, 10) || 1;
        // const pageSizes = parseInt(pageSize, 10) || 10;

        // Ensure 'skip' and 'take' are integers and provide defaults
        // const skipRecords = parseInt(skip, 10) || 0;
        // const takeRecords = parseInt(take, 10) || 100;
        let tenantId;
        let whereCondition = {
            deletedAt: null,
        };
        if (req.user.type != 'Main Admin') {
            tenantId = req.user.tenantId;
            whereCondition.email = {
                [Op.ne]: process.env.EMAIL,
            };
        } else {
            tenantId = null;
        }
        whereCondition.tenantId = tenantId;

        whereCondition.id = {
            [Op.ne]: req.user.id,
        };

        // if (startDate && endDate) {
        //     whereCondition.createdAt = {
        //         [Op.between]: [firstDate, lastDate],
        //     };
        // } else if (startDate) {
        //     whereCondition.createdAt = {
        //         [Op.gte]: firstDate,
        //     };
        // } else if (endDate) {
        //     whereCondition.createdAt = {
        //         [Op.lte]: lastDate,
        //     };
        // }

        // if (firstName) {
        //     whereCondition.firstName = {
        //         [Op.like]: `%${firstName}%`,
        //     };
        // }

        // if (lastName) {
        //     whereCondition.lastName = {
        //         [Op.like]: `%${lastName}%`,
        //     };
        // }

        // if (mobile) {
        //     whereCondition.mobile = {
        //         [Op.like]: `%${mobile}%`,
        //     };
        // }

        // if (email) {
        //     whereCondition.email = {
        //         [Op.like]: `%${email}%`,
        //     };
        // }

        if (isActive) {
            whereCondition.status = {
                [Op.like]: `%${isActive}%`,
            };
        }

        // if (search) {
        //     whereCondition[Op.or] = [
        //         { firstName: { [Op.like]: `%${search}%` } },
        //         { lastName: { [Op.like]: `%${search}%` } },
        //         // { mobile: { [Op.like]: `%${search}%` } },
        //         { email: { [Op.like]: `%${search}%` } },
        //     ];
        // }

        const users = await db.User.findAll({
            attributes: [
                'id',
                'firstName',
                'lastName',
                'email',
                'profileImage',
                'status',
                'createdAt',
                'updatedAt',
                [fn('COUNT', col('userPhones.phoneId')), 'phoneCount'],
            ],
            where: whereCondition,
            include: [
                {
                    model: db.Role,
                    as: 'Role',
                    attributes: ['name'],
                    required: false,
                },
                {
                    model: db.UserPhones,
                    as: 'userPhones',
                    attributes: [],
                    required: false,
                },
                {
                    model: db.Department,
                    as: 'Department',
                    attributes: ['id', 'name'],
                    required: false,
                },
            ],
            group: ['User.id', 'Role.id', 'Department.id'],
            order: [['createdAt', 'DESC']],
            disableTenantCheck: true,
        });

        if (users.length === 0) {
            return res.status(status.OK).json({
                status: true,
                message: 'No data found!',
            });
        }
        let response = {
            user: users,
        };

        return res.status(status.OK).json({
            status: true,
            message: 'Success.',
            data: response,
        });
    } catch (err) {
        return common.throwException(err, 'Get User List Api', req, res);
    }
};

exports.getAllData = async (req, res) => {
    try {
        let tenantId;
        if (req.user.type != 'Main Admin') {
            tenantId = req.user.tenantId;
        } else {
            tenantId = null;
        }
        const findCount = await User.count({
            where: { id: { [Op.ne]: req.user.id }, email: { [Op.ne]: process.env.EMAIL }, tenantId: tenantId, deletedAt: null },
            disableTenantCheck: true,
        });
        const phoneCount = await db.Phones.count({
            where: { tenantId: tenantId },
            disableTenantCheck: true,
        });

        const activeuserCount = await User.count({
            where: {
                tenantId: tenantId,
                email: { [Op.ne]: process.env.EMAIL },
                status: '1',
                deletedAt: null,
                id: { [Op.ne]: req.user.id },
            },
            disableTenantCheck: true,
        });
        const inactiveuserCount = await User.count({
            where: {
                tenantId: tenantId,
                email: { [Op.ne]: process.env.EMAIL },
                status: '0',
                deletedAt: null,
                id: { [Op.ne]: req.user.id },
            },
            disableTenantCheck: true,
        });

        const departmentCount = await db.Department.count({ where: { tenantId: tenantId }, disableTenantCheck: true });

        let response = {
            totalUser: findCount,
            phoneNumbers: phoneCount,
            activeuser: activeuserCount,
            inactiveuser: inactiveuserCount,
            department: departmentCount,
        };

        return res.status(status.OK).json({
            status: true,
            message: 'Success.',
            data: response,
        });
    } catch (err) {
        return common.throwException(err, 'Get User List Api', req, res);
    }
};
