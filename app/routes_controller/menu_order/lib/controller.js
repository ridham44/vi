const db = require('../../../db/models');
const Sequelize = require('sequelize');
const { status, common, dbCommon, enums } = require('../../../../utils');
const { Op } = require('sequelize');
const { addLog } = require('../../../../utils/lib/common-function');

// create menu order
exports.create = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const findLastOrderData = await db.MenuOrder.findOne({
            attributes: ['level'],
            where: {
                deletedAt: null,
            },
            order: [['level', 'DESC']],
        });
        let newLevel = findLastOrderData?.level ? findLastOrderData?.level + 1 : 1;

        const menuOrderData = {
            name: req.body.name,
            url: req.body.url,
            icon: req.body.icon,
            subMenu: req.body.subMenu,
            level: newLevel,
            key: req.body.key,
            createdBy: req.user.id,
        };
        const createMenu = await db.MenuOrder.create(menuOrderData, { transaction });

        let displayContentForCreateMenuOrder = '<span>Menu Order Created with the following details:</span><br>';

        for (const key of Object.keys(menuOrderData)) {
            if (menuOrderData[key] !== null && menuOrderData[key] !== undefined && key !== 'createdBy' && key !== 'level') {
                if (key === 'name') {
                    displayContentForCreateMenuOrder += `<span>${'Menu'}:<b>${menuOrderData[key]}</b></span><br>`;
                } else if (key === 'subMenu') {
                    displayContentForCreateMenuOrder += `<span>${'Sub Menu'}:<b>${menuOrderData[key]}</b></span><br>`;
                } else if (key === 'url') {
                    displayContentForCreateMenuOrder += `<span>${'Url'}:<b>${menuOrderData[key]}</b></span><br>`;
                } else {
                    displayContentForCreateMenuOrder += `<span>${key}:<b>${menuOrderData[key]}</b></span><br>`;
                }
            }
        }

        const logTableData = {
            tableName: 'menu_order',
            tableId: createMenu.id,
            action: enums.logAction.Create,
            newData: `<div className="timeline-content">${displayContentForCreateMenuOrder}</div>`,
            message: 'Menu Order created successfully.',
            createdBy: req.user.id,
            createdAt: new Date(),
            module: 'Menu Order',
        };

        await addLog(logTableData, { db, transaction });
        await transaction.commit();
        return res.status(status.OK).json({ message: 'Menu Order created successfully.' });
    } catch (err) {
        await transaction.rollback();
        return common.throwException(err, 'Create Menu Order', req, res);
    }
};

// find all
/* exports.findAll = async (req, res) => {
    try {
        const whereCondition = {};
        const include = [
            {
                model: db.User, // Replace with your actual model
                as: 'CreatedByUser',
                attributes: ['id', 'firstName', 'lastName', 'fullName', 'profileImage'],
            },
            {
                model: db.User, // Replace with your actual model
                as: 'UpdatedByUser',
                attributes: ['id', 'firstName', 'lastName', 'fullName', 'profileImage'],
            },
        ];

        if (req.path.endsWith('route')) {
            whereCondition.status = '1';
        }

        if (req.query.id && req.query.id !== 'null') {
            whereCondition.parentId = req.query.id;
            whereCondition.type = enums.MenuOrderType.Module;

            include.push({
                model: db.MenuOrder,
                as: 'Parent',
                attributes: ['id', 'name'],
            });
        } else {
            whereCondition.parentId = null;
            whereCondition.type = enums.MenuOrderType.Group;
        }

        const menuOrder = await db.MenuOrder.findAll({
            where: {
                deletedAt: null,
                ...whereCondition,
            },
            include,
            order: [['level', 'ASC']],
        });

        return res.status(status.OK).json({ data: menuOrder });
    } catch (err) {
        return common.throwException(err, 'Get Menu Order', req, res);
    }
}; */
exports.findAll = async (req, res) => {
    try {
        const results = await db.MenuOrderRole.findAll({
            attributes:[],
            where: {
                roleId: req.user.roleId,
            },
            disableTenantCheck: true,
            include: [
                {
                    model: db.MenuOrder,
                    as: 'MenuOrder',
                    where: {
                        status: enums.Status.Active.value,
                        [Op.or]: [{ forWhom: req.user.type }, { forWhom: 'Both' }],
                    },
                },
            ],
        });

        // let results = await db.MenuOrder.findAll({
        //     where: {
        //         status: enums.Status.Active.value,
        //         [Op.or]: [{ forWhom: req.user.type }, { forWhom: 'Both' }],
        //     },
        // });
        return res.status(status.OK).json({ data: results });
    } catch (err) {
        return common.throwException(err, 'Get Menu Order', req, res);
    }
};

// exports.findAll = async (req, res) => {
//     try {
//         const userInclude = [
//             {
//                 model: db.User,
//                 as: 'CreatedByUser',
//                 attributes: ['id', 'firstName', 'lastName', 'fullName', 'profileImage'],
//             },
//             {
//                 model: db.User,
//                 as: 'UpdatedByUser',
//                 attributes: ['id', 'firstName', 'lastName', 'fullName', 'profileImage'],
//             },
//         ];

//         const include = [];
//         let whereCondition = {
//             tenantId: req.user.tenantId,
//         };

//         /* if (req.path.endsWith('route')) {
//             whereCondition.status = '1';
//         } */

//         if (req.query.id && req.query.id !== 'null') {
//             const parentMenu = await db.MenuOrderTenant.findOne({
//                 attributes: ['menuOrderId'],
//                 where: {
//                     id: req.query.id,
//                 },
//             });

//             if (parentMenu) {
//                 const menuOrders = await db.MenuOrder.findAll({
//                     attributes: ['id'],
//                     where: {
//                         deletedAt: null,
//                         parentId: parentMenu.menuOrderId,
//                         type: enums.MenuOrderType.Module,
//                     },
//                     raw: true,
//                 });

//                 if (menuOrders.length <= 0) {
//                     return res.status(status.OK).json({ data: [] });
//                 }

//                 whereCondition.menuOrderId = { [Op.in]: menuOrders.map((item) => item.id) };
//             }

//             include.push({
//                 model: db.MenuOrder,
//                 as: 'MenuOrder',
//                 attributes: { exclude: ['level', 'status'] },
//                 where: {
//                     deletedAt: null,
//                 },
//                 include: [
//                     ...userInclude,
//                     {
//                         model: db.MenuOrder,
//                         as: 'Parent',
//                         attributes: ['id', 'name'],
//                     },
//                 ],
//             });
//         } else {
//             include.push({
//                 model: db.MenuOrder,
//                 as: 'MenuOrder',
//                 attributes: { exclude: ['level', 'status'] },
//                 where: {
//                     deletedAt: null,
//                     parentId: null,
//                     type: enums.MenuOrderType.Group,
//                 },
//                 include: [...userInclude],
//             });
//         }

//         const menuOrderTenant = await db.MenuOrderTenant.findAll({
//             attributes: ['id', 'status', 'level'],
//             where: whereCondition,
//             include,
//             order: [['level', 'ASC']],
//             disableTenantCheck: true,
//         });

//         return res.status(status.OK).json({ data: menuOrderTenant });
//     } catch (err) {
//         return common.throwException(err, 'Get Menu Order Tenant', req, res);
//     }
// };

exports.findAllRoute = async (req, res) => {
    try {
        const include = [];
        let whereCondition = {
            tenantId: req.user.tenantId,
            status: enums.Status.Active.value,
            [Op.or]: [{ forWhom: req.user.type }, { forWhom: 'Both' }],
        };
        include.push({
            model: db.MenuOrder,
            as: 'MenuOrder',
            // attributes: ['id', 'name', 'url', 'icon', 'subMenu', 'key', 'languageKeyId'],
            attributes: ['id', 'name', 'url', 'icon', 'subMenu', 'key'],

            where: {
                deletedAt: null,
                parentId: null,
                type: enums.MenuOrderType.Group,
            },
            include: [
                {
                    model: db.MenuOrder,
                    as: 'MenuOrder',
                    // attributes: ['id', 'name', 'url', 'icon', 'subMenu', 'key', 'languageKeyId'],
                    attributes: ['id', 'name', 'url', 'icon', 'subMenu', 'key'],

                    where: { deletedAt: null, type: enums.MenuOrderType.Module },
                    required: false,
                    include: [
                        {
                            model: db.MenuOrderTenant,
                            as: 'MenuOrderTenant',
                            attributes: ['level'],
                            required: false,
                            where: { tenantId: req.user.tenantId },
                        },
                    ],
                },
            ],
        });

        const menuOrderTenant = await db.MenuOrderTenant.findAll({
            attributes: [],
            where: whereCondition,
            include,
            order: [['level', 'ASC']],
            disableTenantCheck: true,
        });

        // const languageValues = await db.LanguageValue.findAll({
        //     attributes: ['id', 'keyId', 'value'],
        //     where: { tenantId: req.user.tenantId },
        //     disableTenantCheck: true,
        // });

        // const langMap = Object.fromEntries(languageValues.map((l) => [l.keyId, l.value]));

        // Flatten and sort data
        const flattenedData = menuOrderTenant
            .map((item) => {
                if (item.MenuOrder) {
                    // Sort MenuOrder submenus based on level
                    if (Array.isArray(item.MenuOrder.MenuOrder)) {
                        item.MenuOrder.MenuOrder.sort((a, b) => {
                            const levelA = a.MenuOrderTenant?.[0]?.level || 0;
                            const levelB = b.MenuOrderTenant?.[0]?.level || 0;
                            return levelA - levelB;
                        });
                    }

                    // Convert MenuOrder Sequelize object to plain JS object
                    const menuPlain = item.MenuOrder.get({ plain: true });

                    // Translate main menu name
                    // const translatedName = langMap[menuPlain.languageKeyId] || menuPlain.name;
                    const translatedName = menuPlain.name;

                    return {
                        ...menuPlain,
                        name: translatedName,
                        MenuOrder:
                            item.MenuOrder.MenuOrder?.map((subMenu) => {
                                // eslint-disable-next-line no-unused-vars
                                const { MenuOrderTenant, ...rest } = subMenu.get({ plain: true });
                                return {
                                    ...rest,
                                    // name: langMap[rest.languageKeyId] || rest.name,
                                    name: rest.name,
                                };
                            }) || [],
                    };
                }
                return null;
            })
            .filter((item) => item !== null);

        return res.status(status.OK).json({ data: flattenedData });
    } catch (err) {
        console.log(err);

        return common.throwException(err, 'Get Menu Order', req, res);
    }
};

// find by id
/* exports.findById = async (req, res) => {
    try {
        const menuOrder = await db.MenuOrder.findOne({
            where: {
                deletedAt: null,
                id: req.params.id,
                status: enums.Status.Active.value,
            },
        });
        if (!menuOrder) {
            return res.status(status.NotFound).json({ message: 'Menu Order not found.' });
        }

        return res.status(status.OK).json({ data: menuOrder });
    } catch (err) {
        return common.throwException(err, 'Get Menu Order By Id', req, res);
    }
}; */

exports.findById = async (req, res) => {
    try {
        const menuOrderTenant = await db.MenuOrderTenant.findOne({
            attributes: ['id', 'level', 'status'],
            where: {
                id: req.params.id,
                status: enums.Status.Active.value,
            },
            include: [
                {
                    model: db.MenuOrder,
                    as: 'MenuOrder',
                    attributes: { exclude: ['level', 'status'] },
                },
            ],
        });

        if (!menuOrderTenant) {
            return res.status(status.NotFound).json({ message: 'Menu Order Tenant not found.' });
        }

        return res.status(status.OK).json({ data: menuOrderTenant });
    } catch (err) {
        return common.throwException(err, 'Get Menu Order Tenant By Id', req, res);
    }
};

// update menu order
exports.update = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const menuOrderData = {
            name: req.body.name,
            url: req.body.url,
            icon: req.body.icon,
            subMenu: req.body.subMenu,
            key: req.body.key,
            updatedBy: req.user.id,
        };

        const menuOrder = await db.MenuOrder.findOne({
            where: {
                deletedAt: null,
                id: req.params.id,
            },
        });

        if (!menuOrder) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'Menu Order not found.' });
        }

        const changes = [];

        for (const [key, value] of Object.entries(menuOrderData)) {
            if (key === 'createdBy' || key === 'updatedBy') {
                continue;
            }

            let fromValue = menuOrder[key];
            let toValue = value;

            if (key == 'subMenu') {
                if (fromValue !== toValue) {
                    const change = {
                        field: common.coverKeyName(key),
                        from: fromValue && fromValue !== 'false' && fromValue !== 'undefined' && fromValue !== 'NaN' ? fromValue : false, // sanitize fromValue
                        to: toValue && toValue !== 'false' && toValue !== 'undefined' && toValue !== 'NaN' ? toValue : false, // sanitize toValue
                    };
                    changes.push(change);
                }
            }

            if (fromValue !== toValue && key !== 'subMenu') {
                // const change = {
                //     field: common.coverKeyName(key),
                //     from: fromValue && fromValue !== 'false' ? fromValue : 'blank value',
                //     to: toValue && toValue !== 'false' ? toValue : 'blank value',
                // };
                // changes.push(change);
                const change = {
                    field: common.coverKeyName(key),
                    from:
                        fromValue && fromValue !== 'false' && fromValue !== 'undefined' && fromValue !== 'NaN' ? fromValue : `blank value`,
                    to: toValue && toValue !== 'false' && toValue !== 'undefined' && toValue !== 'NaN' ? toValue : `blank value`,
                };
                changes.push(change);
            }
        }

        menuOrder.set(menuOrderData);

        await menuOrder.save({ transaction });
        if (changes.length > 0) {
            const displayContent = changes
                .map((change) => {
                    return `<span className="timeline-details"><span>${change.field}</span><span> was updated </span> from <span><b>${change.from}</b></span> to <span><b>${change.to}</b></span></span>`;
                })
                .join('<br>');
            const logTableData = {
                tableName: 'menu_order',
                tableId: menuOrder.id,
                action: enums.logAction.Update,
                newData: `<span>Menu Order Updated with the following details:</span><br><div className="timeline-content">${displayContent}</div>`,
                message: 'Menu Order updated successfully.',
                createdBy: req.user.id,
                createdAt: new Date(),
                module: 'Menu Order',
            };

            await addLog(logTableData, { db, transaction });
        }
        await transaction.commit();
        return res.status(status.OK).json({ message: 'Menu Order updated successfully.' });
    } catch (err) {
        await transaction.rollback();
        return common.throwException(err, 'Update Menu Order', req, res);
    }
};

// update menu order status
/* exports.updateStatus = async (req, res) => {
    try {
        const menuOrder = await db.MenuOrder.findOne({
            where: {
                deletedAt: null,
                id: req.params.id,
            },
        });
        if (!menuOrder) {
            return res.status(status.NotFound).json({ message: 'Menu Order not found.' });
        }

        menuOrder.set({
            status: menuOrder.status === enums.Status.Active.value ? enums.Status.Inactive.value : enums.Status.Active.value,
            updatedBy: req.user.id,
        });

        await menuOrder.save();

        return res.status(status.OK).json({
            message: 'Status updated successfully.',
        });
    } catch (err) {
        return common.throwException(err, 'Update menu order Status', req, res);
    }
}; */

exports.updateStatus = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        // Fetch the MenuOrderTenant record based on the ID
        const menuOrderTenant = await db.MenuOrderTenant.findOne({
            where: {
                id: req.params.id,
            },
        });

        // If the record is not found, return a 404 response
        if (!menuOrderTenant) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'Menu Order Tenant not found.' });
        }

        const statusLabel = menuOrderTenant.status;
        // Toggle the status value between '1' and '0'
        menuOrderTenant.set({
            status: menuOrderTenant.status === enums.Status.Active.value ? enums.Status.Inactive.value : enums.Status.Active.value,
            updatedBy: req.user.id,
        });

        // Save the updated status
        await menuOrderTenant.save({ transaction });

        const logTableData = {
            tableName: 'menu_order',
            tableId: menuOrderTenant.id,
            action: enums.logAction.Update,
            newData: `<span>Menu Order Tenant Status Changed Successfully:</span><br><div className="timeline-content">${`<span className="timeline-details"><span>${'Status'}</span><span> was updated </span> from <span><b>${Object.keys(
                enums.Status._enumMap
            ).find((key) => enums.Status._enumMap[key] === statusLabel)}</b></span> to <span><b>${
                statusLabel === enums.Status.Active.value
                    ? Object.keys(enums.Status._enumMap).find((key) => enums.Status._enumMap[key] === enums.Status.Inactive.value)
                    : Object.keys(enums.Status._enumMap).find((key) => enums.Status._enumMap[key] === enums.Status.Active.value)
            }</b></span></span>`}</div>`,
            message: 'Menu Order Tenant Status Changed Successfully',
            createdBy: req.user.id,
            createdAt: new Date(),
            module: 'MenuOrder',
        };
        await addLog(logTableData, { db, transaction });

        await transaction.commit();

        return res.status(status.OK).json({ message: 'Status updated successfully.' });
    } catch (err) {
        await transaction.rollback();
        return common.throwException(err, 'Update Menu Order Tenant Status', req, res);
    }
};

// delete menu order
exports.delete = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const menuOrder = await db.MenuOrder.findOne({
            where: {
                deletedAt: null,
                id: req.params.id,
            },
        });

        if (!menuOrder) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'Menu Order not found.' });
        }

        let hasChildren = await dbCommon.hasAnyChildren(menuOrder);

        if (hasChildren.hasChildren == true) {
            await transaction.rollback();
            return res.status(status.Conflict).json({ message: hasChildren.message });
        }

        menuOrder.set({
            status: enums.Status.Inactive.value,
            deletedAt: Sequelize.literal('CURRENT_TIMESTAMP'),
            deletedBy: req.user.id,
        });

        await menuOrder.save({ transaction });

        let displayContentForDeleteMenuOrder = `<span>${menuOrder.name} Menu Order deleted successfully</span>`;

        const logTableData = {
            tableName: 'menu_order',
            tableId: menuOrder.id,
            action: enums.logAction.Delete,
            newData: `<div className="timeline-content">${displayContentForDeleteMenuOrder}</div>`,
            message: 'Menu Order deleted successfully.',
            createdBy: req.user.id,
            createdAt: new Date(),
            module: 'Menu Order',
        };

        await addLog(logTableData, { db, transaction });

        await transaction.commit();
        return res.status(status.OK).json({ message: 'Menu Order deleted successfully.' });
    } catch (err) {
        await transaction.rollback();
        return common.throwException(err, 'Delete Menu Order', req, res);
    }
};

// Update MenuOrder Level
/* exports.updateLevel = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        let tempCount = await db.MenuOrder.count({
            where: {
                id: { [Op.in]: req.body.menuOrderIds },
                deletedAt: null,
            },
            transaction,
        });

        if (tempCount != req.body.menuOrderIds.length) {
            await transaction.rollback();
            return res.status(status.Conflict).json({ message: 'Improper data present.' });
        }

        let priorityData = req.body.menuOrderIds.map((m1, index) => {
            return {
                id: m1,
                level: index + 1,
            };
        });

        await dbCommon.bulkUpdate(priorityData, db.MenuOrder, 'id', transaction);
        await transaction.commit();
        return res.status(status.OK).json({
            message: 'Menu Order level updated successfully.',
        });
    } catch (err) {
        await transaction.rollback();
        return common.throwException(err, 'Menu Order Level Update', req, res);
    }
}; */

exports.updateLevel = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        let tempCount = await db.MenuOrderTenant.count({
            where: {
                id: { [Op.in]: req.body.menuOrderTenantIds },
            },
            transaction,
        });

        if (tempCount != req.body.menuOrderTenantIds.length) {
            await transaction.rollback();
            return res.status(status.Conflict).json({ message: 'Improper data present.' });
        }

        let priorityData = req.body.menuOrderTenantIds.map((m1, index) => {
            return {
                id: m1,
                level: index + 1,
            };
        });

        await dbCommon.bulkUpdate(priorityData, db.MenuOrderTenant, 'id', transaction);
        await transaction.commit();
        return res.status(status.OK).json({ message: 'Menu Order level updated successfully.' });
    } catch (err) {
        await transaction.rollback();
        return common.throwException(err, 'Menu Order Level Update', req, res);
    }
};

// find all For Module
exports.findAllForModule = async (req, res) => {
    try {
        const menuOrder = await db.MenuOrder.findAll({
            where: {
                deletedAt: null,
            },
            include: [
                {
                    model: db.MenuOrder,
                    as: 'Parent',
                    attributes: ['id', 'name', 'type'],
                },
                {
                    model: db.User,
                    as: 'CreatedByUser',
                    attributes: ['id', 'firstName', 'lastName', 'fullName', 'profileImage'],
                },
                {
                    model: db.User,
                    as: 'UpdatedByUser',
                    attributes: ['id', 'firstName', 'lastName', 'fullName', 'profileImage'],
                },
            ],
            order: [['level', 'ASC']],
        });
        return res.status(status.OK).json({ data: menuOrder });
    } catch (err) {
        return common.throwException(err, 'Get Menu Order For Module', req, res);
    }
};

/* exports.findAllForPermission = async (req, res) => {
    try {
        var menuOrder = await db.MenuOrder.findAll({
            attributes: ['id', 'name', 'type', 'parentId', 'level'],
            where: {
                deletedAt: null,
            },
            include: [
                {
                    model: db.MenuOrder,
                    as: 'Parent',
                    attributes: ['id', 'name', 'type'],
                },
            ],
            order: [['level', 'ASC']],
        });

        return res.status(status.OK).json({ data: menuOrder });
    } catch (err) {
        return common.throwException(err, 'Get Menu Order For Module', req, res);
    }
}; */

exports.findAllForPermission = async (req, res) => {
    try {
        const menuOrderTenant = await db.MenuOrderTenant.findAll({
            attributes: ['id', 'status', 'level'],
            where: {
                tenantId: req.user.tenantId,
            },
            include: [
                {
                    model: db.MenuOrder,
                    as: 'MenuOrder',
                    attributes: ['id', 'name', 'type', 'parentId'],
                    include: [
                        {
                            model: db.MenuOrder,
                            as: 'Parent',
                            attributes: ['id', 'name', 'type'],
                        },
                    ],
                },
            ],
            order: [['level', 'ASC']],
            disableTenantCheck: true,
        });

        return res.status(status.OK).json({ data: menuOrderTenant });
    } catch (err) {
        return common.throwException(err, 'Get Menu Order Tenant For Permission', req, res);
    }
};

// create menu order
exports.createModule = async (req, res) => {
    try {
        const menuOrderData = {
            name: req.body.name,
            url: req.body.url,
            icon: req.body.icon,
            subMenu: '0',
            level: req.body.level,
            parentId: req.body.parentId,
            type: req.body.type,
            key: req.body.key,
            createdBy: req.user.id,
        };
        await db.MenuOrder.create(menuOrderData);
        return res.status(status.OK).json({ message: 'Module created successfully.' });
    } catch (err) {
        return common.throwException(err, 'Create Menu Order For Module', req, res);
    }
};

// update menu order For Module
exports.updateModule = async (req, res) => {
    try {
        const menuOrderData = {
            name: req.body.name,
            url: req.body.url,
            icon: req.body.icon,
            subMenu: '0',
            level: req.body.level,
            parentId: req.body.parentId,
            key: req.body.key,
            type: req.body.type,
            updatedBy: req.user.id,
        };

        const menuOrder = await db.MenuOrder.findOne({
            where: {
                deletedAt: null,
                id: req.params.id,
            },
        });

        if (!menuOrder) {
            return res.status(status.NotFound).json({ message: 'Menu Order not found.' });
        }

        menuOrder.set(menuOrderData);

        await menuOrder.save();

        return res.status(status.OK).json({ message: 'Module updated successfully.' });
    } catch (err) {
        return common.throwException(err, 'Update Menu Order For Module', req, res);
    }
};

// update menu order status for module
exports.updateStatusModule = async (req, res) => {
    try {
        const menuOrder = await db.MenuOrder.findOne({
            where: {
                deletedAt: null,
                id: req.params.id,
            },
        });
        if (!menuOrder) {
            return res.status(status.NotFound).json({ message: 'Menu Order not found.' });
        }

        menuOrder.set({
            status: menuOrder.status === enums.Status.Active.value ? enums.Status.Inactive.value : enums.Status.Active.value,
            updatedBy: req.user.id,
        });

        await menuOrder.save();

        return res.status(status.OK).json({ message: 'Status updated successfully.' });
    } catch (err) {
        return common.throwException(err, 'Update menu order Status for module', req, res);
    }
};

// delete menu order for module
exports.deleteModule = async (req, res) => {
    try {
        const menuOrder = await db.MenuOrder.findOne({
            where: {
                deletedAt: null,
                id: req.params.id,
            },
        });

        if (!menuOrder) {
            return res.status(status.NotFound).json({ message: 'Menu Order not found.' });
        }

        let hasChildren = await dbCommon.hasAnyChildren(menuOrder);

        if (hasChildren.hasChildren == true) {
            return res.status(status.Conflict).json({ message: hasChildren.message });
        }

        menuOrder.set({
            status: enums.Status.Inactive.value,
            deletedAt: Sequelize.literal('CURRENT_TIMESTAMP'),
            deletedBy: req.user.id,
        });

        await menuOrder.save();

        return res.status(status.OK).json({ message: 'Module deleted successfully.' });
    } catch (err) {
        return common.throwException(err, 'Delete Menu Order For Module', req, res);
    }
};

exports.insertall = async (req, res) => {
    try {
        
        let data = await db.MenuOrder.findAll({ attributes: ['id'] });

        // console.log(data[0].dataValues.id);
        data.map(async(d)=>{
            let menuOrderpayload={
                menuOrderId:d.dataValues.id,
                roleId:"6cff3d9f-02d8-11ef-8c8d-74563c332520"
            }
            // console.log(d.dataValues.id);
            await db.MenuOrderRole.create(menuOrderpayload);
        })

        return res.status(status.OK).json({ messages: 'success' });

        // let insert=await db.MenuOrderRole.create
    } catch (err) {
        return common.throwException(err, 'Update menu order Status for module', req, res);
    }
};
