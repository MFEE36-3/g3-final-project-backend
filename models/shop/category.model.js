module.exports = (sequelize, Sequelize) => {
    const Category = sequelize.define("category", {
        cate_id: {
          type: Sequelize.STRING,
          primaryKey: true
        },
        cate_name: {
          type: Sequelize.STRING
        },
        created_at: {
          type: Sequelize.DATE
        }
      }, {
        freezeTableName: true, // This option disables table name pluralization
        timestamps: false,
      });

    return Category;
};
