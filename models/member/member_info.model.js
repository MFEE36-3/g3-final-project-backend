module.exports = (sequelize, Sequelize) => {
    const MemberInfo = sequelize.define("member_info", {
        sid: {
            type: Sequelize.INTEGER,
            primaryKey: true
        },
        account: {
            type: Sequelize.STRING,
        },
        password: {
            type: Sequelize.STRING,
        },
        name: {
            type: Sequelize.STRING,
        },
        nickname: {
            type: Sequelize.STRING,
        },
        mobile: {
            type: Sequelize.STRING,
        },
        birthday: {
            type: Sequelize.DATE,
        },
        address: {
            type: Sequelize.STRING,
        },
        level: {
            type: Sequelize.INTEGER,
        },
        wallet: {
            type: Sequelize.INTEGER,
        },
        photo: {
            type: Sequelize.STRING,
        },
        creat_at: {
            type: Sequelize.DATE,
        },
        achieve: {
            type: Sequelize.STRING,
        },
    }, {
        freezeTableName: true,
        timestamps: false,
    });

    return MemberInfo;
};
