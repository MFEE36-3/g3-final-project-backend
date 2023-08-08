module.exports = (sequelize, Sequelize) => {
    const BuyForMeDetail = sequelize.define("buy_for_me_detail", {
        order_detail_sid: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        order_sid: {
            type: Sequelize.INTEGER,
        },
        order_food: {
            type: Sequelize.INTEGER,
        },
        order_quantity: {
            type: Sequelize.INTEGER,
        },
        order_price: {
            type: Sequelize.INTEGER,
        }
    }, {
        freezeTableName: true,
        timestamps: false,
    });

    return BuyForMeDetail;
};