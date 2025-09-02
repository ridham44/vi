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
            type: req.body.type,
            subMenu: req.body.subMenu,
            isPage: req.body.isPage,
            level: newLevel,
            key: req.body.key,
            createdBy: req.user.id,
        };
        if (req.body.parentId) {
            menuOrderData.parentId = req.body.parentId;
        }
        await db.MenuOrder.create(menuOrderData, { transaction });

        // let displayContentForCreateMenuOrder = '<span>Menu Order Created with the following details:</span><br>';

        // for (const key of Object.keys(menuOrderData)) {
        //     if (menuOrderData[key] !== null && menuOrderData[key] !== undefined && key !== 'createdBy' && key !== 'level') {
        //         if (key === 'name') {
        //             displayContentForCreateMenuOrder += `<span>${'Menu'}:<b>${menuOrderData[key]}</b></span><br>`;
        //         } else if (key === 'subMenu') {
        //             displayContentForCreateMenuOrder += `<span>${'Sub Menu'}:<b>${menuOrderData[key]}</b></span><br>`;
        //         } else if (key === 'url') {
        //             displayContentForCreateMenuOrder += `<span>${'Url'}:<b>${menuOrderData[key]}</b></span><br>`;
        //         } else {
        //             displayContentForCreateMenuOrder += `<span>${key}:<b>${menuOrderData[key]}</b></span><br>`;
        //         }
        //     }
        // }

        // const logTableData = {
        //     tableName: 'menu_order',
        //     tableId: createMenu.id,
        //     action: enums.logAction.Create,
        //     newData: `<div className="timeline-content">${displayContentForCreateMenuOrder}</div>`,
        //     message: 'Menu Order created successfully.',
        //     createdBy: req.user.id,
        //     createdAt: new Date(),
        //     module: 'Menu Order',
        // };

        // await addLog(logTableData, { db, transaction });
        await transaction.commit();
        return res.status(status.OK).json({ message: 'Menu Order created successfully.' });
    } catch (err) {
        await transaction.rollback();
        return common.throwException(err, 'Create Menu Order', req, res);
    }
};

exports.findAll = async (req, res) => {
    try {
        const results = await db.MenuOrderRole.findAll({
            attributes: [],
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

exports.findAllRoute = async (req, res) => {
    try {
        const parentMenus = await db.MenuOrderRole.findAll({
            where: {
                roleId: req.user.roleId,
                status: enums.Status.Active.value,
            },
            attributes: [],
            include: [
                {
                    model: db.MenuOrder,
                    as: 'MenuOrder',
                    required: true,
                    attributes: ['id', 'name', 'url', 'icon', 'subMenu', 'level'],
                    where: {
                        parentId: null,
                        type: enums.MenuOrderType.Group,
                        status: enums.Status.Active.value,
                        deletedAt: null,
                        forWhom: {
                            [Op.in]: [req.user.type, 'Both'],
                        },
                    },
                },
            ],
            order: [[{ model: db.MenuOrder, as: 'MenuOrder' }, 'level', 'ASC']],
        });
        const parentMenuIds = parentMenus.map((menu) => menu.MenuOrder?.id);
        const childMenus = await db.MenuOrderRole.findAll({
            where: {
                roleId: req.user.roleId,
                status: enums.Status.Active.value,
            },
            attributes: [],
            include: [
                {
                    model: db.MenuOrder,
                    as: 'MenuOrder',
                    required: true,
                    attributes: ['id', 'name', 'url', 'icon', 'subMenu', 'level', 'parentId'],
                    where: {
                        [Op.and]: [
                            { parentId: { [Op.in]: parentMenuIds } },
                            { type: { [Op.or]: [enums.MenuOrderType.Module, enums.MenuOrderType.Group, enums.MenuOrderType.Right] } },
                            { status: enums.Status.Active.value },
                            { deletedAt: null },
                            { [Op.or]: [{ forWhom: req.user.type }, { forWhom: 'Both' }] },
                        ],
                    },
                },
            ],
            order: [[{ model: db.MenuOrder, as: 'MenuOrder' }, 'level', 'ASC']],
        });

        // 3. Group children under their parentId
        const childMenuMap = {};
        childMenus.forEach((menuRole) => {
            const child = menuRole.MenuOrder;
            const parentId = child.parentId;

            if (!childMenuMap[parentId]) {
                childMenuMap[parentId] = [];
            }
            childMenuMap[parentId].push(child.toJSON());
        });

        // Step 4: Build final result with children nested under parent

        const finalResults = parentMenus.map((menuRole) => {
            const parent = menuRole.MenuOrder;
            const parentId = parent.id;

            const children = childMenuMap[parentId] || [];

            return {
                ...parent.toJSON(),
                children,
            };
        });

        return res.status(status.OK).json({ data: finalResults });
    } catch (err) {
        return common.throwException(err, 'Get Menu Order', req, res);
    }
};

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
        // const menuOrderData = {
        //     name: req.body.name,
        //     url: req.body.url,
        //     icon: req.body.icon,
        //     subMenu: req.body.subMenu,
        //     // key: req.body.key,
        //     isPage: req.body.isPage,
        //     updatedBy: req.user.id,
        // };
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
        const menuOrderData = {
            name: req.body.name,
            url: req.body.url,
            icon: req.body.icon,
            type: req.body.type,
            subMenu: req.body.subMenu,
            isPage: req.body.isPage,
            // key: req.body.key,
            updatedBy: req.user.id,
        };
        if (req.body.parentId) {
            menuOrderData.parentId = req.body.parentId;
        }

        // const changes = [];

        // for (const [key, value] of Object.entries(menuOrderData)) {
        //     if (key === 'createdBy' || key === 'updatedBy') {
        //         continue;
        //     }

        //     let fromValue = menuOrder[key];
        //     let toValue = value;

        //     if (key == 'subMenu') {
        //         if (fromValue !== toValue) {
        //             const change = {
        //                 field: common.coverKeyName(key),
        //                 from: fromValue && fromValue !== 'false' && fromValue !== 'undefined' && fromValue !== 'NaN' ? fromValue : false, // sanitize fromValue
        //                 to: toValue && toValue !== 'false' && toValue !== 'undefined' && toValue !== 'NaN' ? toValue : false, // sanitize toValue
        //             };
        //             changes.push(change);
        //         }
        //     }

        //     if (fromValue !== toValue && key !== 'subMenu') {
        //         // const change = {
        //         //     field: common.coverKeyName(key),
        //         //     from: fromValue && fromValue !== 'false' ? fromValue : 'blank value',
        //         //     to: toValue && toValue !== 'false' ? toValue : 'blank value',
        //         // };
        //         // changes.push(change);
        //         const change = {
        //             field: common.coverKeyName(key),
        //             from:
        //                 fromValue && fromValue !== 'false' && fromValue !== 'undefined' && fromValue !== 'NaN' ? fromValue : `blank value`,
        //             to: toValue && toValue !== 'false' && toValue !== 'undefined' && toValue !== 'NaN' ? toValue : `blank value`,
        //         };
        //         changes.push(change);
        //     }
        // }

        menuOrder.set(menuOrderData);

        await menuOrder.save({ transaction });
        // if (changes.length > 0) {
        //     const displayContent = changes
        //         .map((change) => {
        //             return `<span className="timeline-details"><span>${change.field}</span><span> was updated </span> from <span><b>${change.from}</b></span> to <span><b>${change.to}</b></span></span>`;
        //         })
        //         .join('<br>');
        //     const logTableData = {
        //         tableName: 'menu_order',
        //         tableId: menuOrder.id,
        //         action: enums.logAction.Update,
        //         newData: `<span>Menu Order Updated with the following details:</span><br><div className="timeline-content">${displayContent}</div>`,
        //         message: 'Menu Order updated successfully.',
        //         createdBy: req.user.id,
        //         createdAt: new Date(),
        //         module: 'Menu Order',
        //     };

        //     await addLog(logTableData, { db, transaction });
        // }
        await transaction.commit();
        return res.status(status.OK).json({ message: 'Menu Order updated successfully.' });
    } catch (err) {
        await transaction.rollback();
        return common.throwException(err, 'Update Menu Order', req, res);
    }
};

exports.updateStatus = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        // Fetch the MenuOrderTenant record based on the ID
        const menuOrder = await db.MenuOrder.findOne({
            where: {
                id: req.params.id,
            },
        });

        // If the record is not found, return a 404 response
        if (!menuOrder) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'Menu Order  not found.' });
        }

        // const statusLabel = menuOrderTenant.status;
        // Toggle the status value between '1' and '0'
        menuOrder.set({
            status: menuOrder.status === enums.Status.Active.value ? enums.Status.Inactive.value : enums.Status.Active.value,
            updatedBy: req.user.id,
        });

        // Save the updated status
        await menuOrder.save({ transaction });

        // const logTableData = {
        //     tableName: 'menu_order',
        //     tableId: menuOrderTenant.id,
        //     action: enums.logAction.Update,
        //     newData: `<span>Menu Order Tenant Status Changed Successfully:</span><br><div className="timeline-content">${`<span className="timeline-details"><span>${'Status'}</span><span> was updated </span> from <span><b>${Object.keys(
        //         enums.Status._enumMap
        //     ).find((key) => enums.Status._enumMap[key] === statusLabel)}</b></span> to <span><b>${
        //         statusLabel === enums.Status.Active.value
        //             ? Object.keys(enums.Status._enumMap).find((key) => enums.Status._enumMap[key] === enums.Status.Inactive.value)
        //             : Object.keys(enums.Status._enumMap).find((key) => enums.Status._enumMap[key] === enums.Status.Active.value)
        //     }</b></span></span>`}</div>`,
        //     message: 'Menu Order Tenant Status Changed Successfully',
        //     createdBy: req.user.id,
        //     createdAt: new Date(),
        //     module: 'MenuOrder',
        // };
        // await addLog(logTableData, { db, transaction });

        await transaction.commit();

        return res.status(status.OK).json({ message: 'Status updated successfully.' });
    } catch (err) {
        await transaction.rollback();
        return common.throwException(err, 'Update Menu Order Status', req, res);
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
        data.map(async (d) => {
            let menuOrderpayload = {
                menuOrderId: d.dataValues.id,
                roleId: '6cff3d9f-02d8-11ef-8c8d-74563c332520',
            };
            // console.log(d.dataValues.id);
            await db.MenuOrderRole.create(menuOrderpayload);
        });

        return res.status(status.OK).json({ messages: 'success' });

        // let insert=await db.MenuOrderRole.create
    } catch (err) {
        return common.throwException(err, 'Update menu order Status for module', req, res);
    }
};
