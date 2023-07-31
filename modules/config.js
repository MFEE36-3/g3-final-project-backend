require('dotenv').config();
// Create connection to database

var private_key = process.env.PRIVATE_KEY;
var token_expire = parseInt(process.env.TOKEN_EXP);// test: 60mins ,formal : 5 mins
var db_config = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database : process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT),
    dialect: process.env.DB_DIALECT,
    pool: {
        max: parseInt(process.env.DB_POOL_MAX),
        min: parseInt(process.env.DB_POOL_MIN),
        acquire: parseInt(process.env.DB_POOL_ACQUIRE),
        idle: parseInt(process.env.DB_POOL_IDLE)
    },
};
var linepay = {
    channel_id: process.env.LINEPAY_CHANNEL_ID,
    channel_secret: process.env.LINEPAY_CHANNEL_SECRET_KEY,
    version: process.env.LINEPAY_VERSION,
    site: process.env.LINEPAY_SITE,
    return_host: process.env.LINEPAY_RETURN_HOST,
    return_confirm_url: process.env.LINEPAY_RETURN_CONFIRM_URL,
    return_cancel_url: process.env.LINEPAY_RETURN_CANCEL_URL,
}

module.exports = {
    private_key,
    token_expire,
    db_config,
    linepay
};
