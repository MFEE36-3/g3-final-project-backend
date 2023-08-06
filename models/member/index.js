module.exports = (sequelize, Sequelize) => {
    const memberDb = {};
  
    memberDb.member_info = require("./member_info.model.js")(sequelize, Sequelize);
    memberDb.coupon = require("./coupon.model.js")(sequelize, Sequelize);
    memberDb.user_coupon = require("./user_coupon.model.js")(sequelize, Sequelize);
    memberDb.member_wallet_record = require("./member_wallet_record.model.js")(sequelize, Sequelize);

    // define the associations
    memberDb.user_coupon.belongsTo(memberDb.coupon, {foreignKey: 'coupon_sid'});
    memberDb.coupon.hasMany(memberDb.user_coupon, {foreignKey: 'coupon_sid'});
  
    return memberDb;
};
