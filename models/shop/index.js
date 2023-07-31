module.exports = (sequelize, Sequelize) => {
  const shopDb = {};

  shopDb.category = require("./category.model.js")(sequelize, Sequelize);
  shopDb.factory = require("./factory.model.js")(sequelize, Sequelize);
  shopDb.item = require("./item.model.js")(sequelize, Sequelize);
  shopDb.item_cate_mapping = require("./item_cate_mapping.model.js")(sequelize, Sequelize);
  shopDb.item_ratings = require("./item_ratings.model.js")(sequelize, Sequelize);
  shopDb.orders = require("./orders.model.js")(sequelize, Sequelize);
  shopDb.orderdetail = require("./orderdetail.model.js")(sequelize, Sequelize);
  shopDb.payments = require("./payments.model.js")(sequelize, Sequelize);
  shopDb.addresses = require("./addresses.model.js")(sequelize, Sequelize);


  // define the associations
  shopDb.item.belongsToMany(shopDb.category, {through: shopDb.item_cate_mapping, foreignKey: 'item_id', otherKey: 'cate_id'});
  shopDb.category.belongsToMany(shopDb.item, {through: shopDb.item_cate_mapping, foreignKey: 'cate_id', otherKey: 'item_id'});
  shopDb.item.hasMany(shopDb.item_ratings, {foreignKey: 'item_id', sourceKey: 'item_id'});
  shopDb.item_ratings.belongsTo(shopDb.item, {foreignKey: 'item_id', targetKey: 'item_id'});
  shopDb.item.belongsTo(shopDb.factory, {foreignKey: 'factory_id', targetKey: 'factory_id'});
  shopDb.orders.hasMany(shopDb.orderdetail, {foreignKey: 'order_id', sourceKey: 'order_id'});
  shopDb.orderdetail.belongsTo(shopDb.orders, {foreignKey: 'order_id', targetKey: 'order_id'});

  return shopDb;
};
