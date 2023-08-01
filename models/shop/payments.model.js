const { DataTypes } = require("sequelize");

module.exports = (sequelize, Sequelize) => {
    const Payments = sequelize.define("payments", {
        payment_id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        member_id: {
            type: Sequelize.STRING,
        },
        payment_type: {
            type: Sequelize.ENUM,
            values: ['credit_card', 'wallet', 'linepay'],
            allowNull: false,
            validate: {
                isIn: {
                    args: [['credit_card', 'wallet', 'linepay']],
                    msg: "Invalid payment type"
                }
            }
        },
        provider: {
            type: Sequelize.STRING,
        },
        account_identifier: {
            type: Sequelize.STRING,
        },
        payment_gateway_token: {
            type: Sequelize.STRING,
        },
    }, {
        freezeTableName: true,
        timestamps: false,
    });

    return Payments;
};
