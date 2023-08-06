module.exports = (sequelize, Sequelize) => {
    const Coupon = sequelize.define("coupon", {
        coupon_sid: {
            type: Sequelize.INTEGER,
            primaryKey: true
        },
        coupon_title: {
            type: Sequelize.STRING,
        },
        coupon_content: {
            type: Sequelize.STRING,
        },
        coupon_discount: {
            type: Sequelize.INTEGER,
        },
        coupon_deadline: {
            type: Sequelize.INTEGER,
        },
    }, {
        freezeTableName: true,
        timestamps: false,
    });

    return Coupon;
};