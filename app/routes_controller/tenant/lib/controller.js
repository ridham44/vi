const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const db = require('../../../db/models');
const { status, common } = require('../../../../utils');
const moment = require('moment-timezone');
const { modules } = require('../../../../utils/index');

// function to generate random password
function generateComplexPassword(length = 12) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    console.log('Generated Password:', password);
    return password;
}

// Demo API: generate password & send by email
// exports.sendTenantPasswordDemo = async (req, res) => {
//     try {
//         const { email } = req.body;
//         if (!email) {
//             return res.status(status.BadRequest).json({
//                 status: false,
//                 message: "Email is required",
//             });
//         }

//         // 1. Generate password
//         const randomPassword = generateComplexPassword(12);

//         // 2. Prepare email content
//         const mailOptions = {
//             to: email,
//             subject: "Your Tenant Account Password",
//             text: `Hello,\n\nYour tenant account password is: ${randomPassword}\n\nPlease change it after your first login.`,
//         };

//         // 3. Send email
//         await common.sendEmail(mailOptions);

//         return res.status(status.OK).json({
//             status: true,
//             message: "Password generated and sent successfully",
//             password: randomPassword,
//         });
//     } catch (err) {
//         return common.throwException(err, "SendTenantPasswordDemo API", req, res);
//     }
// };

exports.createTenant = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const {
            companyName,
            address,
            phone,
            email,
            remarks,
            mobileNoLimit,
            menuOrders,
            packagesId,
            packagesStartDate,
            amount,
            paymentStatus,
            trialDays,
        } = req.body;

        const checkExist = await db.Tenant.findOne({
            where: { companyName, deletedAt: null },
            transaction,
        });

        if (checkExist) {
            await transaction.rollback();
            return res.status(status.Conflict).json({
                status: false,
                message: 'Tenant already exists!',
            });
        }

        let packages = null;
        let packagesEndDate = null;
        let lastRenewDate = null;

        if (packagesId && packagesId !== '0') {
            packages = await db.Packages.findOne({
                where: { id: packagesId },
                transaction,
            });

            if (!packages) {
                await transaction.rollback();
                return res.status(status.BadRequest).json({
                    status: false,
                    message: 'Invalid packagesId. Please provide a valid packages.',
                });
            }

            // Calculate packagesEndDate using noOfMonths from packages
            packagesEndDate = moment(packagesStartDate).add(packages.noOfMonths, 'months').toDate();

            // Set lastRenewDate: if old end date exists and is >= today, keep it, else new end date
            lastRenewDate = packagesEndDate;
        } else if (packagesId === '0') {
            // Trial case
            packagesEndDate = moment(packagesStartDate).add(trialDays, 'days').toDate();
            lastRenewDate = null;
        }

        // Tenant payload
        const tenantPayload = {
            companyName,
            address,
            phone,
            email,
            remarks,
            mobileNoLimit,
            packagesId: packagesId === '0' ? null : packagesId,
            packagesStartDate: packagesId === '0' ? packagesStartDate : packagesStartDate,
            packagesEndDate,
            trialDays: packagesId === '0' ? trialDays : 0,
            amount: packagesId === '0' ? 0 : amount,
            paymentStatus: packagesId === '0' ? '0' : paymentStatus,
            lastRenewDate,
        };

        const tenant = await db.Tenant.create(tenantPayload, { transaction });

        const rolePayload = {
            name: 'Tenant',
            isSystemAdmin: false,
            isAdmin: true,
            isMasterAdmin: false,
            tenantId: tenant.id,
            systemDefault: false,
            status: '1',
        };

        const role = await db.Role.create(rolePayload, { transaction });

        if (Array.isArray(menuOrders)) {
            const defaultMenuOrders = [modules.Department, modules.AddDepartment];

            const allMenuOrders = [...new Set([...menuOrders, ...defaultMenuOrders])];

            await Promise.all(
                allMenuOrders.map(async (menuOrderId) => {
                    const menuOrderPayload = {
                        menuOrderId,
                        roleId: role.id,
                        tenantId: tenant.id,
                    };
                    await db.MenuOrderRole.create(menuOrderPayload, { transaction });
                })
            );
        }

        const randomPassword = generateComplexPassword(12);
        const userPayload = [
            {
                email,
                password: randomPassword,
                tenantId: tenant.id,
                roleId: role.id,
                createdBy: req.user.id,
            },
            {
                email: process.env.EMAIL,
                password: 'Admin@123',
                tenantId: tenant.id,
                roleId: role.id,
            },
        ];

        await db.User.bulkCreate(userPayload, { transaction });

        await transaction.commit();

        const mailOptions = {
            to: email,
            subject: 'Your Tenant Account Password',
            text: `Hello,\n\nYour tenant account has been created.\nYour password is: ${randomPassword}\n\nPlease change it after your first login.`,
        };
        await common.sendEmail(mailOptions);

        return res.status(status.OK).json({
            status: true,
            message: 'Tenant created successfully.',
            data: { tenantId: tenant.id, roleId: role.id },
        });
    } catch (err) {
        console.error('CreateTenant Error:', err);
        await transaction.rollback();
        return common.throwException(err, 'Create Tenant Api', req, res);
    }
};

exports.updateTenant = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { id } = req.params;
        const {
            companyName,
            address,
            phone,
            email,
            remarks,
            mobileNoLimit,
            status: tenantStatus,
            menuOrders,
            packagesId,
            packagesStartDate,
            amount,
            paymentStatus,
            trialDays,
        } = req.body;

        const checkExist = await db.Tenant.findOne({
            where: { id, deletedAt: null },
            transaction,
        });

        if (!checkExist) {
            await transaction.rollback();
            return res.status(status.NotFound).json({
                status: false,
                message: 'Tenant not found',
            });
        }

        if (companyName) {
            const checkIfCompanyExist = await db.Tenant.findOne({
                where: {
                    companyName,
                    id: { [Op.ne]: id },
                    deletedAt: null,
                },
                disableTenantCheck: true,
                transaction,
            });

            if (checkIfCompanyExist) {
                await transaction.rollback();
                return res.status(status.Conflict).json({
                    status: false,
                    message: 'Company Name already exists!',
                });
            }
        }

        let packagesEndDate = null;
        let lastRenewDate = checkExist.lastRenewDate;

        if (packagesId && packagesId !== '0') {
            const pkg = await db.Packages.findOne({
                where: { id: packagesId },
                transaction,
            });

            if (!pkg) {
                await transaction.rollback();
                return res.status(status.BadRequest).json({
                    status: false,
                    message: 'Invalid packagesId. Please provide a valid package.',
                });
            }

            // calculate end date
            packagesEndDate = moment(packagesStartDate).add(pkg.noOfMonths, 'months').toDate();

            // if no previous end date or it’s already expired → set new renew date
            if (!lastRenewDate || moment(lastRenewDate).isBefore(moment())) {
                lastRenewDate = packagesEndDate;
            }
        } else if (packagesId === '0') {
            packagesEndDate = moment(packagesStartDate).add(trialDays, 'days').toDate();
            lastRenewDate = null;
        }

        const payload = {
            companyName,
            address,
            phone,
            email,
            remarks,
            mobileNoLimit,
            status: tenantStatus,
            packagesId: packagesId === '0' ? null : packagesId,
            packagesStartDate,
            packagesEndDate,
            trialDays: packagesId === '0' ? trialDays : 0,
            amount: packagesId === '0' ? 0 : amount,
            paymentStatus: packagesId === '0' ? '0' : paymentStatus,
            lastRenewDate,
            updatedAt: new Date(),
            updatedBy: req.user?.id || null,
        };

        await db.Tenant.update(payload, { where: { id }, transaction });

        // Update menu orders
        if (Array.isArray(menuOrders)) {
            const role = await db.Role.findOne({
                where: { tenantId: id },
                transaction,
                disableTenantCheck: true,
            });

            if (role) {
                // clear existing role-menu relations
                await db.MenuOrderRole.destroy({
                    where: { roleId: role.id },
                    transaction,
                });

                const defaultMenuOrders = [modules.Department, modules.AddDepartment];

                const allMenuOrders = [...new Set([...menuOrders, ...defaultMenuOrders])];

                await Promise.all(
                    allMenuOrders.map((menuOrderId) =>
                        db.MenuOrderRole.create({ menuOrderId, roleId: role.id, tenantId: id }, { transaction })
                    )
                );
            }
        }

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

exports.getTenant = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { id } = req.params;

        const tenant = await db.Tenant.findOne({
            where: {
                id,
                deletedAt: null,
            },
            include: [
                {
                    model: db.Packages,
                    as: 'packages',
                    attributes: ['packagesName'],
                },
            ],

            transaction,
        });

        if (!tenant) {
            await transaction.rollback();
            return res.status(status.NotFound).json({
                status: false,
                message: 'Tenant not found',
            });
        }

        await transaction.commit();
        return res.status(status.OK).json({
            status: true,
            message: 'Success.',
            data: tenant,
        });
    } catch (err) {
        await transaction.rollback();
        return common.throwException(err, 'Get Tenant Api', req, res);
    }
};

exports.deleteTenant = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { id } = req.params;

        // Check if tenant exists
        const tenant = await db.Tenant.findOne({
            where: {
                id,
                deletedAt: null,
            },
            transaction,
        });

        if (!tenant) {
            await transaction.rollback();
            return res.status(status.NotFound).json({
                status: false,
                message: 'Tenant not found',
            });
        }

        // Soft delete tenant
        await tenant.update(
            {
                deletedAt: new Date(),
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

exports.getAllTenant = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { companyName, address, phone, email, status: isActive, page, pageSize, startDate, endDate, search } = req.query;

        const dateFormat = 'YYYY-MM-DD';
        const firstDate = startDate
            ? moment.tz(`${startDate} 00:00:00`, dateFormat + ' HH:mm:ss', 'Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss')
            : null;
        const lastDate = endDate
            ? moment.tz(`${endDate} 23:59:59`, dateFormat + ' HH:mm:ss', 'Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss')
            : null;

        const pages = parseInt(page, 10) || 1;
        const pageSizes = parseInt(pageSize, 10) || 10;

        let whereCondition = { deletedAt: null };

        if (firstDate && lastDate) {
            whereCondition.createdAt = { [Op.between]: [firstDate, lastDate] };
        } else if (firstDate) {
            whereCondition.createdAt = { [Op.gte]: firstDate };
        } else if (lastDate) {
            whereCondition.createdAt = { [Op.lte]: lastDate };
        }

        if (companyName) {
            whereCondition.companyName = { [Op.like]: `%${companyName}%` };
        }
        if (address) {
            whereCondition.address = { [Op.like]: `%${address}%` };
        }
        if (phone) {
            whereCondition.phone = { [Op.like]: `%${phone}%` };
        }
        if (email) {
            whereCondition.email = { [Op.like]: `%${email}%` };
        }
        if (isActive) {
            whereCondition.status = isActive;
        }

        if (search) {
            whereCondition[Op.or] = [
                { companyName: { [Op.like]: `%${search}%` } },
                { address: { [Op.like]: `%${search}%` } },
                { phone: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } },
            ];
        }

        const tenants = await db.Tenant.findAll({
            where: whereCondition,
            order: [['createdAt', 'DESC']],
            limit: pageSizes,
            offset: (pages - 1) * pageSizes,
            include: [
                {
                    model: db.Packages,
                    as: 'packages',
                    attributes: ['packagesName'],
                },
            ],
        });

        const totalCount = await db.Tenant.count({ where: whereCondition });

        if (!tenants || tenants.length === 0) {
            await transaction.rollback();
            return res.status(status.OK).json({
                status: true,
                message: 'No data found!',
                data: { tenant: [], totalCount: 0 },
            });
        }

        await transaction.commit();
        return res.status(status.OK).json({
            status: true,
            message: 'Success.',
            data: {
                tenant: tenants,
                totalCount,
            },
        });
    } catch (err) {
        await transaction.rollback();
        return common.throwException(err, 'Get Tenant List Api', req, res);
    }
};
