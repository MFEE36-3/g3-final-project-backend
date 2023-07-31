module.exports = (sequelize, Sequelize) => {
    const Item = sequelize.define("item", {
        item_id: {
          type: Sequelize.STRING,
          primaryKey: true
        },
        item_name: {
          type: Sequelize.STRING,
        },
        factory_id: {
          type: Sequelize.STRING,
        },
        img_url: {
          type: Sequelize.STRING,
        },
        price: {
          type: Sequelize.INTEGER,
        },
        item_description: {
          type: Sequelize.STRING,
        },
        is_active: {
          type: Sequelize.BOOLEAN,
        },
        created_at: {
          type: Sequelize.DATE
        }
      }, {
        freezeTableName: true, // This option disables table name pluralization
        timestamps: false,
      });

    return Item;
};
