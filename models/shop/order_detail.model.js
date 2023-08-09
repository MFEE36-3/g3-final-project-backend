module.exports = (sequelize, Sequelize) => {
    const FoodOrderDetail = sequelize.define("order_detail", {
        sid: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        order_id: {
            type: Sequelize.INTEGER,
        },
        food_id: {
            type: Sequelize.INTEGER,
        },
        order_item: {
            type: Sequelize.STRING,
        },
        order_num: {
            type: Sequelize.INTEGER,
        },
        price: {
            type: Sequelize.INTEGER,
        },
        create_at: {
            type: Sequelize.DATE,
        },
    }, {
        freezeTableName: true,
        timestamps: false,
    });

    return FoodOrderDetail;
};
