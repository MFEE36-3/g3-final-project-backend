module.exports = (sequelize, Sequelize) => {
    const UserCoupon = sequelize.define("user_coupon", {
        get_coupon_sid: {
            type: Sequelize.INTEGER,
            primaryKey: true
        },
        member_id: {
            type: Sequelize.INTEGER,
        },
        coupon_sid: {
            type: Sequelize.INTEGER,
        },
        coupon_status_sid: {
            type: Sequelize.INTEGER,
        },
        coupon_get_time: {
            type: Sequelize.DATE,
        },
        coupon_dead_time: {
            type: Sequelize.DATE,
        },
        coupon_use_time: {
            type: Sequelize.DATE,
        },
    }, {
        freezeTableName: true,
        timestamps: false,
    });

    return UserCoupon;
};