const dbConfig = require("../modules/config").db_config;

const Sequelize = require("sequelize");
const sequelize = new Sequelize(dbConfig.database, dbConfig.user, dbConfig.password, {
  host: dbConfig.host,
  port: dbConfig.port,
  dialect: dbConfig.dialect,
  //operatorsAliases: false,

  pool: {
    max: dbConfig.pool.max,
    min: dbConfig.pool.min,
    acquire: dbConfig.pool.acquire,
    idle: dbConfig.pool.idle
  }
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.shop = require("./shop")(sequelize, Sequelize);
db.member = require("./member")(sequelize, Sequelize);

// define the associations
db.shop.orders.belongsTo(db.member.user_coupon, {foreignKey: 'coupon_sid', targetKey: 'get_coupon_sid'});
db.member.user_coupon.hasMany(db.shop.orders, {foreignKey: 'coupon_sid', sourceKey: 'get_coupon_sid'});

module.exports = db;
