module.exports = (sequelize, Sequelize) => {
    const buyformeDb = {};
  
    buyformeDb.buy_for_me = require("./buy_for_me.model.js")(sequelize, Sequelize);
    buyformeDb.buy_for_me_detail = require("./buy_for_me_detail.model.js")(sequelize, Sequelize);

    return buyformeDb;
};
