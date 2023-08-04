// 引入dotenv
if (process.argv[2] === "production") {
    require("dotenv").config({
        path: __dirname + "/production.env",
    });
} else {
    require("dotenv").config();
}

const upload = require(__dirname + "/modules/img-upload");
const express = require("express");
const session = require("express-session");
const MysqlStore = require("express-mysql-session")(session);
const db = require(__dirname + "/modules/mysql2");
const sessionStore = new MysqlStore({}, db);
const moment = require("moment-timezone");
const dayjs = require("dayjs");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const app = express();
const bodyParser = require("body-parser");

// 設定使用的樣版引擎(白名單)
app.set("view engine", "ejs");
const whitelist = ["http://localhost:5500"];
const corsOptions = {
    credentials: true,
    origin: (origin, cb) => {
        console.log({ origin });
        cb(null, true);
    },
};

app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(bodyParser.json());
app.use(
    session({
        saveUninitialized: false,
        resave: false,
        secret: "jdfkhHSD86758374fjsdhsj",
        store: sessionStore,

        cookie: {
            maxAge: 1200_000,
            domain: ".shinder.com",
        },
    })
);

// 自訂 middleware
app.use((req, res, next) => {
    // template helper functions
    res.locals.toDateString = (d) => {
        const fm = "YYYY-MM-DD";
        const djs = dayjs(d);
        return djs.format(fm);
    };
    res.locals.toDatetimeString = (d) => {
        const fm = "YYYY-MM-DD  HH:mm:ss";
        const djs = dayjs(d);
        return djs.format(fm);
    };

    // 抓取前端傳來的req
    const auth = req.get("Authorization");
    if (auth && auth.indexOf("Bearer ") === 0) {
        const token = auth.slice(7);
        console.log(token);
        let jwtData = null;
        try {
            jwtData = jwt.verify(token, process.env.JWT_SECRET);
        } catch (ex) { }
        if (jwtData) {
            res.locals.jwtData = jwtData;
            console.log("jwtData", res.locals.jwtData.id);
        }
    }
    next();
});

// previewResImg 這是餐廳照片Ajax的東西
app.post("/previewImg", upload.single("preImg"), async (req, res) => {
    // const filename = req.file.filename
    res.json(req.file);
    console.log(req.file);
});


// 路由引導
app.use("/member", require(__dirname + "/routes/member"));
app.use('/reservation', require(__dirname + '/routes/reservation'));
app.use('/buyforme', require(__dirname + '/routes/buyforme'));
app.use('/buyforme_fake_data', require(__dirname + '/routes/insert_buyforme_fake_data'));
app.use('/res', require(__dirname + '/routes/res-item'));
app.use("/forum", require(__dirname + "/routes/forum"));
app.use("/news",require(__dirname + "/routes/news"));

// This block is for ecshop
const ec_orm = require("./models");
ec_orm.sequelize.sync()
    .then(() => {
        console.log("Synced db.");
    })
    .catch((err) => {
        console.log("Failed to sync db: " + err.message);
    });
require("./routes/ecshop")(app);
// End of ecshop

// 餐廳管理login
app.post("/res-login", async (req, res) => {
    const output = {
        success: false,
        error: "",
        data: null,
    };

    // 1、先檢查有沒有送email跟password過來
    if (!req.body.account || !req.body.password) {
        output.error = "沒有帳號或密碼";
        return res.json(output);
    }

    // 2、檢查資料庫的sql
    const sql = "SELECT * FROM shops WHERE account=?";
    const [rows] = await db.query(sql, [req.body.account]);
    if (!rows.length) {
        output.error = "帳號或密碼錯誤";
        return res.json(output);
    }
    output.message = "有此帳號";
    if (req.body.password !== rows[0].password) {
        output.error = '帳號或密碼錯誤';
        return res.json(output)
    }else{
        // 帳號密碼皆正確，發送token
        const token = jwt.sign({
            id:rows[0].sid,
            account: rows[0].account
        },process.env.JWT_SECRET)

        output.success = true;
        output.token = token;
        output.rows = rows;
        output.data = {
            id: rows[0].sid,
            account: rows[0].account,
            shop:rows[0].shop,
            token
        }
        return res.json(output)
    }
})


// 設定靜態內容的資料夾
app.get("*", express.static("public"));
app.get("*", express.static("node_modules/bootstrap/dist"));
app.get("*", express.static("node_modules/jquery/dist"));

app.use((req, res) => {
    res.type("text/html").status(404).send(`<h1>找不到頁面</h1>`);
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`啟動~ port: ${port}`);
});
