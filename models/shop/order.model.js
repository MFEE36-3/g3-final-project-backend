module.exports = (sequelize, Sequelize) => {
    const FoodOrder = sequelize.define("order", {
        sid: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        shop_id: {
            type: Sequelize.INTEGER,
        },
        Id: {
            type: Sequelize.INTEGER,
        },
        amount: {
            type: Sequelize.INTEGER,
        },
        order_date: {
            type: Sequelize.STRING,
        },
        order_time: {
            type: Sequelize.STRING,
        },
        rating: {
            type: Sequelize.INTEGER,
        },
        status: {
            type: Sequelize.INTEGER,
        },
        create_at: {
            type: Sequelize.DATE,
        },
    }, {
        freezeTableName: true,
        timestamps: false,
    });

    return FoodOrder;
};
