/* eslint-disable no-inner-declarations */
// const { getNamespace } = require('cls-hooked');
const db = require('../../app/db/models');
// const { performance } = require('perf_hooks');
const common = require('./common-function');
// const _ = require('lodash');
const { status } = require('./messages/api.response');
const { Op } = require('sequelize');

// const env = process.env.NODE_ENV || 'development';
// const config = require(__dirname + '/../../app/db/audit-logger/config.json')[env];
const CryptoJS = require('crypto-js');
const passphrase = 'your_passphrase_here';

module.exports = {
    async bulkUpdate(dataToUpdate, modelName, referenceField, transaction) {
        let ids = dataToUpdate.map((m1) => `'${m1[referenceField]}'`);
        let singleFields = 'SET ';

        let keys = Object.keys(dataToUpdate[0]).filter((f1) => f1 != referenceField);

        keys.forEach((element, index) => {
            singleFields = singleFields + ` ${element} = CASE `;
            dataToUpdate.map((m1) => {
                let myValue;

                if (m1[element]) {
                    myValue = `"${m1[element]}"`;
                } else {
                    myValue = null;
                }

                singleFields = singleFields + `WHEN ${referenceField} = "${m1[referenceField]}" THEN ${myValue} `;
            });

            singleFields = singleFields + `ELSE ${element} END`;

            index != keys.length - 1 ? (singleFields = singleFields + ', ') : '';
        });

        const [results, metadata] = await db.sequelize.query(
            `
            UPDATE ${modelName.tableName}
            ${singleFields}
            WHERE
            id IN(${ids});
            `,
            {
                type: db.sequelize.QueryTypes.UPDATE,
                transaction,
            }
        );

        return { results, metadata };
    },

    async hasAnyChildren(rowInstance, exclude = []) {
        try {
            // Get model name from row instance
            let modelName = rowInstance.constructor.name;

            // Get all associations for model
            let associations = db[modelName].associations;

            // Filtering only HasMany relation
            const hasManyAssociations = Object.values(associations).filter((association) => association.associationType === 'HasMany');

            // Get the associated model names
            const associatedModelData = hasManyAssociations.map((association) => {
                let data = {
                    model: association.target.name,
                    foreignKey: association.foreignKey,
                    count: association.accessors.count,
                };
                return data;
            });

            let childrenData = [];

            // Check if data exist for each HasMany relation
            for (const row of associatedModelData) {
                if (exclude.includes(row.model)) continue;
                let currentModel = db[row.model];
                let whereCondition = {};

                whereCondition[row.foreignKey] = rowInstance.id;
                if (Object.keys(currentModel.rawAttributes).includes('deletedAt')) {
                    whereCondition.deletedAt = null;
                }
                try {
                    let count = await currentModel.count({
                        where: {
                            ...whereCondition,
                        },
                    });
                    if (count != 0) {
                        // If row count > 0 then add in array
                        childrenData.push({
                            model: row.model,
                            childrenCount: count,
                        });

                        // Break loop when first relation with row count > 0 is found.
                        break;
                    }
                } catch (err) {
                    console.log('some error', err);
                }
            }

            let hasChildren = childrenData?.length > 0 ? true : false;
            return Promise.resolve({
                hasChildren: hasChildren,
                message: hasChildren ? `Data is associated with this ${modelName}` : 'No children available.',
            });
        } catch (err) {
            return Promise.reject(err);
        }
    },

    /**
     *
      @param {} children array of object with properties model, selector, and name(message)
     * Note: message is for the model we checking in.
     * @returns
     */
    async hasChildren(children = [], entityId, entityName = 'row') {
        try {
            const hasData = [];
            for (const child of children) {
                let currentModel = db[child.model];
                let whereCondition = {};

                whereCondition[child.selector] = entityId;

                if (Object.keys(currentModel.rawAttributes).includes('deletedAt')) {
                    whereCondition.deletedAt = null;
                }

                let countChildren = await currentModel.count({
                    where: {
                        ...whereCondition,
                    },
                });

                if (countChildren > 0) {
                    // If row count > 0 then add in array
                    hasData.push({
                        name: child.name,
                        count: countChildren,
                    });

                    // Break loop when first relation with row count > 0 is found.
                    break;
                }
            }

            if (hasData.length > 0)
                return new Object({
                    status: status.Conflict,
                    message: `${hasData[0].count} ${hasData[0].name} associated with this ${entityName}.`,
                });
            return new Object({
                status: status.OK,
                message: 'No conflict.',
            });
        } catch (error) {
            return Promise.reject(error);
        }
    },

    //* Check if fields already in use or not
    async checkUniqueFields(input) {
        try {
            // const sampleInput = {
            //     model: db.User,
            //     id: null,
            //     fields: [
            //         {
            //             field: 'email',
            //             value: 'jay@gmail.com',
            //             name: 'Email',
            //         },
            //         {
            //             field: 'mobile',
            //             value: '4',
            //             name: 'Mobile',
            //         },
            //         {
            //             field: 'aadhaarCard',
            //             value: '4',
            //             name: 'Aadhaar Card',
            //         },
            //     ],
            // };

            let whereCondition = {};

            const fieldObj = {};

            input.fields.forEach((m1) => {
                fieldObj[m1.field] = m1.value;
            });
            whereCondition = {
                [Op.or]: fieldObj,
            };

            if (input?.exclude) {
                whereCondition.id = {
                    [Op.notIn]: input.exclude,
                };
            }

            const response = await db[input.model].findOne({
                where: {
                    deletedAt: null,
                    ...whereCondition,
                },
                raw: true,
            });

            if (response) {
                let notUnique = [];
                let errorFields = [];
                input.fields.forEach((m1) => {
                    if (m1.value == response[m1.field]) {
                        notUnique.push(m1.name);
                        errorFields.push({
                            type: 'field',
                            value: m1.value,
                            msg: m1.name + ' already in use.',
                            path: m1.field,
                            location: 'body',
                        });
                    }
                });

                return new Object({
                    status: status.BadRequest,
                    message: `${notUnique.join(', ')} already in use.`,
                    fields: errorFields,
                });
            }
            return new Object({
                status: status.OK,
            });
        } catch (err) {
            common.throwException(err, 'DB Common -> checkUniqueFields');
            return {
                status: status.BadRequest,
                message: err?.message || 'Something went wrong.',
            };
        }
    },

    // let enum name by value
    async getKeyByModuleValue(data, value) {
        return Object.keys(data).find((key) => data[key] === value);
    },

    // add deal stage and deposition status if tenant is new
    // async newTenantDataCreateOnLogin(tenantId, transaction) {
    //     const dispositionStatus = await db.DispositionStatus.findOne({
    //         where: {
    //             deletedAt: null,
    //             tenantId: tenantId,
    //         },
    //         disableTenantCheck: true,
    //     });

    //     if (!dispositionStatus) {
    //         const depositionStatusData = {
    //             name: 'Customer',
    //             description: 'Customer',
    //             type: '0',
    //             isFinal: true,
    //             tenantId: tenantId,
    //         };

    //         try {
    //             await db.DispositionStatus.create(depositionStatusData, { transaction });
    //         } catch (error) {
    //             console.error('Error creating disposition status:', error);
    //             throw error; // Rethrow the error to handle it further up the chain
    //         }
    //     }

    //     const dealStage = await db.DealStage.findOne({
    //         where: {
    //             deletedAt: null,
    //             tenantId: tenantId,
    //         },
    //         disableTenantCheck: true,
    //     });

    //     if (!dealStage) {
    //         const dealStageData = [
    //             {
    //                 name: 'Qualified',
    //                 description: 'Qualified',
    //                 status: '1',
    //                 isDefault: true,
    //                 level: 0,
    //                 tenantId: tenantId,
    //             },
    //             {
    //                 name: 'Closed - Won',
    //                 description: 'Closed - Won',
    //                 status: '1',
    //                 isDefault: true,
    //                 level: 2,
    //                 tenantId: tenantId,
    //             },
    //             {
    //                 name: 'Closed - Lost',
    //                 description: 'Closed - Lost',
    //                 status: '1',
    //                 isDefault: true,
    //                 level: 3,
    //                 tenantId: tenantId,
    //             },
    //         ];

    //         try {
    //             await db.DealStage.bulkCreate(dealStageData, { transaction });
    //         } catch (error) {
    //             await transaction.rollback();
    //             console.error('Error creating deal stages:', error);
    //             throw error; // Rethrow the error to handle it further up the chain
    //         }
    //     }

    //     return true;
    // },

    generateSecret: async (length = 32) => {
        const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let secret = '';
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * charset.length);
            secret += charset[randomIndex];
        }

        return secret;
    },

    // Encrypt the secret
    encryptSecret: async (secret, passphrase) => {
        return CryptoJS.AES.encrypt(secret, passphrase).toString();
    },

    callSecrete: async () => {
        let data = await module.exports.generateSecret(); // Use module.exports to access methods
        let keyData = await module.exports.encryptSecret(data, passphrase);

        return keyData;
    },

    async checkAssociation(id, tenantId, column = 'departmentId') {
        let models = Object.values(db.sequelize.models);
        let count = 0;

        for (const model of models) {
            if (!model.rawAttributes?.[column]) continue;

            const associated = await model.count({
                where: {
                    [column]: id,
                    tenantId: tenantId,
                },
                disableTenantCheck: true,
            });

            if (associated > 0) {
                count++;
            }
        }

        return count;
    },
};
