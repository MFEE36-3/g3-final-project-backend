const { DataTypes } = require("sequelize");

module.exports = (sequelize, Sequelize) => {
    const Orders = sequelize.define("orders", {
        order_id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        address_id: {
            type: Sequelize.STRING,
            references: {
                model: 'addresses',
                key: 'address_id'
            }
        },
        payment_id: {
            type: Sequelize.STRING,
            references: {
                model: 'payments',
                key: 'payment_id'
            }
        },
        member_id: {
            type: Sequelize.STRING,
        },
        coupon_sid: {
            type: Sequelize.STRING,
        },
        status: {
            type: Sequelize.INTEGER,
        },
        created_at: {
            type: Sequelize.DATE,
        },
        updated_at: {
            type: Sequelize.DATE,
        }
    }, {
        freezeTableName: true,
        timestamps: false,
    });

    return Orders;
};
