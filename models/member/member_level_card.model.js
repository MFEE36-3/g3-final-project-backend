module.exports = (sequelize, Sequelize) => {
    const MemberLevelCard = sequelize.define("member_level_card", {
        sid: {
            type: Sequelize.INTEGER,
            primaryKey: true
        },
        name: {
            type: Sequelize.STRING,
        },
        price: {
            type: Sequelize.INTEGER,
        },
        image: {
            type: Sequelize.STRING,
        },
    }, {
        freezeTableName: true,
        timestamps: false,
    });

    return MemberLevelCard;
};
