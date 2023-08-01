module.exports = (sequelize, Sequelize) => {
    const Factory = sequelize.define("factory", {
        factory_id: {
          type: Sequelize.STRING,
          primaryKey: true
        },
        factory_name: {
          type: Sequelize.STRING
        },
        created_at: {
          type: Sequelize.DATE
        }
      }, {
        freezeTableName: true, // This option disables table name pluralization
        timestamps: false,
      });

    return Factory;
};
