const express = require("express");
const db = require("../modules/mysql2");
const dayjs = require("dayjs");
const router = express.Router();
const bcrypt = require("bcrypt");
const upload = require(__dirname + "/../modules/img-upload");
const jwt = require("jsonwebtoken");

// 登入會員並給驗證token的API
router.post("/login", async (req, res) => {
    const output = {
        success: false,
        code: 0,
        error: "",
    };
    if (!req.body.account || !req.body.password) {
        output.error = "欄位資料不足";
        return res.json(output);
    }

    const sql = "SELECT * FROM member_info WHERE account=?";
    const [rows] = await db.query(sql, [req.body.account]);
    if (!rows.length) {
        output.code = 402;
        output.error = "帳號或密碼錯誤";
        return res.json(output);
    }
    const verified = await bcrypt.compare(req.body.password, rows[0].password);
    if (!verified) {
        output.code = 406;
        output.error = "帳號或密碼錯誤";
        return res.json(output);
    }
    output.success = true;

    // 包 jwt 傳給前端
    const token = jwt.sign(
        {
            id: rows[0].sid,
            account: rows[0].account,
        },
        process.env.JWT_SECRET
    );

    output.data = {
        sid: rows[0].sid,
        account: rows[0].account,
        nickname: rows[0].nickname,
        photo: rows[0].photo,
        length: req.body.password.length,
        token,
    };
    res.json(output);
});

// 拿到會員基本資料的API
router.get("/", async (req, res) => {
    const output = {
        success: false,
        error: "",
        data: null,
    };
    if (!res.locals.jwtData) {
        console.log("step1");
        output.error = "沒有 token 驗證";
        return res.json(output);
    }
    const sql = `SELECT 
    member_info.*,
    CASE 
        WHEN member_achievement.name IS NOT NULL THEN member_achievement.name 
        ELSE member_info.achieve 
    END AS achieve_name,
    CASE 
        WHEN member_achievement.image IS NOT NULL THEN member_achievement.image 
        ELSE member_info.achieve 
    END AS achieve_image 
FROM 
    member_info 
LEFT JOIN 
    member_achievement 
ON 
    member_info.achieve = member_achievement.sid 
WHERE 
    account = ?;
`;
    const [rows] = await db.query(sql, [res.locals.jwtData.account]);
    res.json(rows);
});

// 修改會員基本資料的API
router.post("/", async (req, res) => {
    const { info, sid, title } = req.body; // 請確保你的請求正確包含 info、sid 和 title 欄位

    try {
        if (title === "password") {
            // 使用 bcrypt 套件將密碼進行雜湊
            const hashedPassword = await bcrypt.hash(info, 10);
            // 將雜湊後的密碼儲存到資料庫中
            const t_sql = "UPDATE `member_info` SET ?? = ? WHERE `sid` = ?";
            await db.query(t_sql, [title, hashedPassword, sid]);
            res.json({ success: true });
        } else {
            // 如果不是處理密碼，直接將資料儲存到資料庫中
            const t_sql = "UPDATE `member_info` SET ?? = ? WHERE `sid` = ?";
            await db.query(t_sql, [title, info, sid]);
            res.json({ success: true });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// 拿到升級會員卡資料的API
router.get("/moneyCard", async (req, res) => {
    const output = {
        success: false,
        error: "",
        data: null,
    };
    if (!res.locals.jwtData) {
        console.log("step1");
        output.error = "沒有 token 驗證";
        return res.json(output);
    }
    const sql = `SELECT * FROM member_level_card WHERE 1`;
    const [rows] = await db.query(sql);
    console.log(rows);
    res.json(rows);
});

// 修改會員照片的API
router.post("/changeImage", upload.single("preImg"), async (req, res) => {
    const image = req.file.filename;
    const sql = "UPDATE `member_info` SET `photo`=? WHERE `account`=?";
    const [rows] = await db.query(sql, [image, res.locals.jwtData.account]);
    res.json(req.file);
});

// 註冊會員的API
router.post("/add", upload.single("photo"), async (req, res) => {
    const sql = `INSERT INTO member_info(
        account, 
        password, 
        name, 
        nickname, 
        mobile, 
        birthday, 
        address, 
        level, 
        wallet, 
        photo, 
        creat_at, 
        achieve
        ) VALUES (
            ?,?,?,?,?,
            ?,?,?,?,?,
            NOW(),?)`;

    let birthday = dayjs(req.body.birthday);
    if (birthday.isValid()) {
        birthday = birthday.format("YYYY-MM-DD");
    } else {
        birthday = null;
    }

    const [result] = await db.query(sql, [
        req.body.account,
        bcrypt.hashSync(req.body.password, 10),
        req.body.name,
        req.body.nickname,
        req.body.mobile,
        birthday,
        req.body.address,
        1,
        0,
        req.file.filename,
        1,
    ]);

    res.json({
        result,
        postData: req.body,
    });
});

// 拿到會員優惠券資料的API
router.get("/coupon", async (req, res) => {
    const output = {
        success: false,
        error: "",
        data: null,
    };

    if (!res.locals.jwtData) {
        output.error = "沒有 token 驗證";
        return res.json(output);
    }

    const sql = `SELECT user_coupon.*, coupon.coupon_title, coupon.coupon_discount
    FROM user_coupon
    JOIN coupon ON user_coupon.coupon_sid = coupon.coupon_sid
    WHERE user_coupon.member_id = ?`;
    const [rows] = await db.query(sql, [res.locals.jwtData.id]);
    res.json(rows);
});

// 拿到會員發文資料的API
router.get("/forumPost", async (req, res) => {
    const output = {
        success: false,
        error: "",
        data: null,
    };

    if (!res.locals.jwtData) {
        output.error = "沒有 token 驗證";
        return res.json(output);
    }

    const sql = `SELECT * FROM forum WHERE user_id = ?`;

    const [rows] = await db.query(sql, [res.locals.jwtData.id]);
    res.json(rows);
});

// 拿到會員錢包紀錄的API
router.get("/walletRecord", async (req, res) => {
    const output = {
        success: false,
        error: "",
        data: null,
    };

    if (!res.locals.jwtData) {
        output.error = "沒有 token 驗證";
        return res.json(output);
    }

    const sql = `SELECT * FROM member_wallet_record WHERE member_id=?`;

    const [rows] = await db.query(sql, [res.locals.jwtData.id]);
    res.json(rows);
});

// 拿到會員成就的API
router.get("/achieveRecord", async (req, res) => {
    const output = {
        success: false,
        error: "",
        data: null,
    };

    if (!res.locals.jwtData) {
        output.error = "沒有 token 驗證";
        return res.json(output);
    }

    const sql = `SELECT member_achieve_record.*, member_achievement.name, member_achievement.image
    FROM member_achieve_record 
    JOIN member_achievement ON member_achieve_record.achieve_id = member_achievement.sid
    WHERE member_achieve_record.member_id = ?`;

    const [rows] = await db.query(sql, [res.locals.jwtData.id]);
    res.json(rows);
});

// 更換配戴成就的API
router.post("/changeAchieve", async (req, res) => {
    const output = {
        success: false,
        error: "",
        data: null,
    };

    if (!res.locals.jwtData) {
        output.error = "沒有 token 驗證";
        return res.json(output);
    }

    const achieveImage = req.body.image;
    const getAchieveSidQuery = `SELECT sid FROM member_achievement WHERE image = ?`;
    const [row1] = await db.query(getAchieveSidQuery, [achieveImage]);
    const changeMemberAchieve = `UPDATE member_info SET achieve = ? WHERE sid = ?`;
    const [row2] = await db.query(changeMemberAchieve, [
        row1[0].sid,
        res.locals.jwtData.id,
    ]);
    res.json(row2);
});

// 拿到會員收藏店家的API
router.get("/favoritetStore", async (req, res) => {
    const output = {
        success: false,
        error: "",
        data: null,
    };

    if (!res.locals.jwtData) {
        output.error = "沒有 token 驗證";
        return res.json(output);
    }

    const sql = `SELECT s.shop AS restaurant_name, s.rating AS restaurant_rating, s.photo AS restaurant_photo, s.location AS restaurant_location FROM favorite f JOIN shops s ON f.shop_id = s.sid WHERE f.id = ?`;

    const [rows] = await db.query(sql, [res.locals.jwtData.id]);
    res.json(rows);
});

// 拿到會員收藏貼文的API
router.get("/favoritePost", async (req, res) => {
    const output = {
        success: false,
        error: "",
        data: null,
    };

    if (!res.locals.jwtData) {
        output.error = "沒有 token 驗證";
        return res.json(output);
    }

    const sql = `SELECT forum_like.*, forum.header, forum.publishedTime, member_info.nickname
    FROM forum_like
    JOIN forum ON forum_like.forum_sid = forum.forum_sid
    JOIN member_info ON member_info.sid = forum.user_id
    WHERE forum_like.user_id = ?;
    `;

    const [rows] = await db.query(sql, [res.locals.jwtData.id]);
    res.json(rows);
});

// 拿到會員訂位的API
router.get("/bookingRecord", async (req, res) => {
    const output = {
        success: false,
        error: "",
        data: null,
    };

    if (!res.locals.jwtData) {
        output.error = "沒有 token 驗證";
        return res.json(output);
    }

    const sql = `SELECT b.id, b.shop_id, b.booking_date, b.booking_time, b.booking_number, b.rating, b.memo, b.status, b.create_at, s.shop, s.photo, s.location FROM booking AS b INNER JOIN shops AS s ON b.shop_id = s.sid WHERE b.id = ?`;

    const [rows] = await db.query(sql, [res.locals.jwtData.id]);
    res.json(rows);
});

// 拿到會員商城訂單的API
router.get("/mailRecord", async (req, res) => {
    const output = {
        success: false,
        error: "",
        data: null,
    };

    if (!res.locals.jwtData) {
        output.error = "沒有 token 驗證";
        return res.json(output);
    }

    const sql = `SELECT o.order_id, o.address_id, o.member_id, a.address, o.status, o.created_at,
    SUM(od.price * od.amount) AS total_price
    FROM orders AS o
    JOIN addresses AS a ON o.address_id = a.address_id
    JOIN orderdetail AS od ON o.order_id = od.order_id
    WHERE o.member_id = ?
    GROUP BY o.order_id
    `;

    const [rows] = await db.query(sql, [res.locals.jwtData.id]);
    res.json(rows);
});

// 拿到會員詳細商城訂單的API
router.get("/mailDetail", async (req, res) => {
    const output = {
        success: false,
        error: "",
        data: null,
    };

    if (!res.locals.jwtData) {
        output.error = "沒有 token 驗證";
        return res.json(output);
    }

    const sql = `SELECT orderdetail.amount , item.item_name, item.img_url, item.price FROM orderdetail JOIN item ON orderdetail.item_id = item.item_id WHERE orderdetail.order_id = ?`;
    const [rows] = await db.query(sql, req.get("id"));
    res.json(rows);
});

// 改會員暱稱的API
router.post("/nickname", async (req, res) => {
    const nickname = [
        "沒問題的啦",
        "阿不就好棒棒",
        "亞洲空桿王",
        "大中天",
        "肥宅心碎機器",
        "噴水雞肉飯",
        "一言不合就翻桌",
        "肥宅快樂水",
        "拳打屁孩腳踢台女",
        "學學人精學人的學人精",
        "巴哈姆特",
        "田中日記",
        "長澤茉里奈我婆",
        "心靈雞湯",
        "好人你幫幫人民的啦",
        "你從桃園新竹",
        "超銀河紅蓮螺巖",
        "請你吃統一布丁",
        "別開玩笑惹",
        "十里山路不換姦",
        "肉鬆夾腳拖地板",
        "媽媽好堅強",
        "鐵板燒包手",
        "半夜吃泡麵",
        "我愛羅球射",
        "我家米粉湯超好喝",
        "大奶微微",
        "樂高愛好者",
        "便秘留言板版主",
        "跟著大咖換大薯",
        "喵星人的小屋",
        "真非洲酋長",
        "加奈",
        "我堅強復國",
        "大盜韓不助",
        "狂熱小太陽",
        "忍者龜頭痛",
        "藍天白雲",
        "天魔傳人毛澤東",
        "常威打來福",
        "莖毛溼王",
        "金衝蹦",
        "海綿體寶寶",
        "原子小莖肛",
        "姑姑城外含三次",
        "靈刀武西郎",
        "老婆快跟牛魔王出來看上帝",
        "鈴刀灰休楚",
        "純真蝴蝶結",
        "韓國瑜珈老師",
        "你不是綠色的夥伴了",
        "傳說中的台戰",
        "我的褲檔裡有龍炮",
        "鯊鯊與華生黨",
        "出去走走好嗎",
        "啊嘶",
        "高端真鹿仔",
        "戀愛家教欸德沃",
        "東巴星拳擊",
        "麻椅上訴",
        "尿老大的黃色王國",
        "倫家真塑可愛",
        "噁男大師Jay",
        "超爽得撿到一百塊",
        "我的豆花",
        "那邊有一隻可愛的狗勾",
        "我瘋子",
        "奶哥不露了",
        "牛寺可可",
        "老闆沒蝦了啊",
        "重力可可",
        "這炸魚嘛",
        "成淵最速頂獵",
        "星光安妮雅",
        "蠍子忍者",
        "誠哥笑你",
        "煞氣改管+9",
        "鋼鐵的福爾高雷",
        "蠍子忍者",
        "藍鯨公爵",
        "五十元馬卡龍",
        "可不可以這樣",
        "夏拉爾克",
        "把你殲滅",
        "悠哉悠哉",
        "冷陽",
        "社會底層搬磚仔",
        "我要成為轟倍王",
        "艾斯貝果",
        "夜的第七章",
        "他打到我的上巴",
        "我會說大象話",
        "金色狂風",
        "曹操在龐統甄姬",
        "大牛比較懶",
        "關羽你的歌",
        "明智脫光秀身材",
        "阿市想怎樣",
        "服部半葬禮",
        "森蘭出來丸",
        "今晚打老虎",
        "上杉打老虎",
        "你開馬自達難怪塞車",
        "全村上義姬",
        "轉角遇稻姬",
        "宮本武藏俱全",
        "百地擺地攤",
        "信上泉得柳生",
        "伊達出奇蛋",
        "揮淚斬馬超",
        "周瑜打黃忠",
        "玩命光頭東京典韋",
        "曹植物的優",
        "武漢費嚴",
        "那個醬汁呢",
        "波奇塔賣薯餅",
        "老趙雲吞麵",
        "中國武漢魏延",
        "郭嘉門前有張郃",
        "關完大哥關二哥",
        "川普大意失賓州",
        "挖欸噴火龍勒",
        "神奇寶貝大師美江",
        "彼得帕邱欽",
        "東尼史巴拉希",
        "牛頭牌沙茶醬",
        "拉拉的寵物企鵝",
        "連續爆破",
        "我是可麗玩家",
        "又是你9527",
        "學姊的聖騎士",
        "兩百公斤龍騎士",
        "火暴可可",
        "光米亞",
        "萊納你做啊",
        "貝爾托特是超大型巨人",
        "自來也死了",
        "寧次幫復",
        "你有被光速素過嗎",
        "歐拉歐拉歐拉",
        "我禿了也變強了",
        "銀色戰車鎮魂曲",
        "白金之星世界",
        "都是時臣的錯",
        "我的王之力啊啊啊",
        "孫云雲玩家",
        "瑟瑟大師",
        "雨傘王小曹",
        "星爆氣流產",
        "一秒十六下",
        "神奇李羅",
        "猶豫就會敗北",
        "豬突猛進",
        "幫我撐十秒",
        "我好興奮啊",
        "哭啊吸奶",
        "他的手可以穿過我的巴巴",
        "還敢下來啊冰鳥",
        "給酷",
        "為什麼不幫我發大絕極靈",
        "抱歉了西門",
        "傻屌胞弟",
        "不要笑不要笑",
        "公道價八萬一",
        "無頭騎士巴麻美",
        "還我咭咭三比靈",
        "台肥新產品",
        "鬼話新聞紅蟻",
        "斗基督機大神",
        "佛心公司",
        "紅桃姐姐來一起搖",
        "抱歉了VT豚",
        "卑鄙的外鄉人",
        "殺手歐陽盆栽要剪",
        "陽明山下智久",
        "億載金城武",
        "苗栗小五郎",
        "樹林志穎",
        "一輩子當銅學",
        "台北川景子",
        "噶瑪蘭正龍",
        "吉隆波多野結衣",
        "關廟傑克森",
        "羅東尼大木",
        "信義休和尚",
        "信義休和尚",
        "拿佛珠砸耶穌",
        "綠油精點眼睛",
        "紅衣小男孩",
        "汗味戰警",
        "左青龍右胖虎",
        "蒙奇D能兒",
        "老爺不可以",
        "涼麵趁熱吃",
        "梁山伯住陰宅",
    ];

    try {
        // 這裡的起始編號和結束編號可以根據你的需求做調整
        const startID = 7;
        const endID = 202;

        // 使用迴圈逐一更新暱稱
        for (let i = startID; i <= endID; i++) {
            const t_sql = "UPDATE member_info SET nickname = ? WHERE sid = ?";
            await db.query(t_sql, [nickname[i - startID], i]);
        }

        res.json({ message: "暱稱更新成功！" });
    } catch (error) {
        res.status(500).json({ message: "暱稱更新失敗！請檢查資料庫連線。" });
    }
});

// 改會員圖片的API
router.post("/mphoto", async (req, res) => {
    try {
        // 假設圖片檔案名稱的起始編號是 1，結束編號是 100
        const startID = 1;
        const endID = 100;

        // 使用迴圈逐一更新 photo 欄位
        for (let i = startID; i <= endID; i++) {
            // 假設圖片放在 public/images 目錄下，檔案名稱為 m1.jpg 到 m100.jpg
            const photoFilename = `m${i}.jpg`;

            const t_sql = "UPDATE member_info SET photo = ? WHERE sid = ?";
            await db.query(t_sql, [photoFilename, i + 100]);
        }

        res.json({ message: "圖片更新成功！" });
    } catch (error) {
        res.status(500).json({ message: "圖片更新失敗！請檢查資料庫連線。" });
    }
});

module.exports = router;
