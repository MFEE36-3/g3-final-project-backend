const { DataTypes } = require("sequelize");

module.exports = (sequelize, Sequelize) => {
    const Addresses = sequelize.define("addresses", {
        address_id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        member_id: {
            type: Sequelize.STRING,
        },
        name: {
            type: Sequelize.STRING,
        },
        address: {
            type: Sequelize.STRING,
        },
        phone_number: {
            type: Sequelize.STRING,
        },
    }, {
        freezeTableName: true,
        timestamps: false,
    });

    return Addresses;
};
