module.exports = (sequelize, Sequelize) => {
    const BuyForMe = sequelize.define("buy_for_me", {
        order_sid: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        open_sid: {
            type: Sequelize.INTEGER,
        },
        order_member_id: {
            type: Sequelize.INTEGER,
        },
        nickname: {
            type: Sequelize.STRING,
        },
        mobile_number: {
            type: Sequelize.STRING,
        },
        order_amount: {
            type: Sequelize.INTEGER,
        },
        order_time: {
            type: Sequelize.DATE,
        },
        order_status: {
            type: Sequelize.INTEGER,
        },
        order_instructions: {
            type: Sequelize.STRING,
        },
    }, {
        freezeTableName: true,
        timestamps: false,
    });

    return BuyForMe;
};