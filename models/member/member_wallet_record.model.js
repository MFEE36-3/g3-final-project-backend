module.exports = (sequelize, Sequelize) => {
    const MemberWalletRecord = sequelize.define("member_wallet_record", {
        sid: {
            type: Sequelize.INTEGER,
            primaryKey: true
        },
        member_id: {
            type: Sequelize.INTEGER,
        },
        amount: {
            type: Sequelize.INTEGER,
        },
        content: {
            type: Sequelize.STRING,
        },
        add_time: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW
        }
    }, {
        freezeTableName: true,
        timestamps: false,
    });

    return MemberWalletRecord;
};
