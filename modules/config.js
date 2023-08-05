require('dotenv').config();
// Create connection to database
const nodemailer = require('nodemailer')

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
    confirm_client_url: process.env.LINEPAY_CONFIRM_OK,
    cancel_client_url: process.env.LINEPAY_CONFIRM_FAIL
}

let transport

transport = {
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // use TLS
  //create a .env file and define the process.env variables with your credentials.
  auth: {
    user: process.env.SMTP_TO_EMAIL,
    pass: process.env.SMTP_TO_PASSWORD,
  },
}

// call the transport function
const transporter = nodemailer.createTransport(transport)

transporter.verify((error, success) => {
  if (error) {
    //if error happened code ends here
    console.error(error)
  } else {
    //this means success
    console.log('Ready to send mail!')
  }
})

module.exports = {
    private_key,
    token_expire,
    db_config,
    linepay,
    transporter
};
