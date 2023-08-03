const dbConfig = require("../modules/config").db_config;

const Sequelize = require("sequelize");
const sequelize = new Sequelize(dbConfig.database, dbConfig.user, dbConfig.password, {
  host: dbConfig.host,
  port: dbConfig.port,
  dialect: dbConfig.dialect,
  operatorsAliases: false,

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
db.member.coupon.belongsTo(db.shop.orders, {foreignKey: 'coupon_sid'});


module.exports = db;
