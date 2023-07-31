// item_cate_mapping.model.js
module.exports = (sequelize, Sequelize) => {
    const ItemCategory = sequelize.define("item_cate_mapping", {
        item_id: {
            type: Sequelize.STRING,
            references: {
                model: 'item',
                key: 'item_id'
            }
        },
        cate_id: {
            type: Sequelize.STRING,
            references: {
                model: 'category',
                key: 'cate_id'
            }
        }
    }, {
        freezeTableName: true,
        timestamps: false,
    });

    return ItemCategory;
};
