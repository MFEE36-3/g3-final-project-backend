// item_ratings.model.js
module.exports = (sequelize, Sequelize) => {
    const ItemRatings = sequelize.define("item_ratings", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        item_id: {
            type: Sequelize.STRING,
        },
        rating: {
            type: Sequelize.FLOAT,
        },
        created_at: {
            type: Sequelize.DATE,
        },
    }, {
        freezeTableName: true,
        timestamps: false,
    });

    return ItemRatings;
};
