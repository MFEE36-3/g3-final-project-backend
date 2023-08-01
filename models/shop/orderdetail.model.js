const { DataTypes } = require("sequelize");

module.exports = (sequelize, Sequelize) => {
    const OrderDetail = sequelize.define("orderdetail", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        order_id: {
            type: DataTypes.UUID,
            references: {
                model: 'orders',
                key: 'order_id'
            }
        },
        item_id: {
            type: DataTypes.UUID,
            references: {
                model: 'item',
                key: 'item_id'
            }
        },
        price: {
            type: Sequelize.INTEGER,
        },
        amount: {
            type: Sequelize.INTEGER,
        },
        created_at: {
            type: Sequelize.DATE,
        }
    }, {
        freezeTableName: true,
        timestamps: false,
    });

    return OrderDetail;
};
