const express = require('express');
const db = require(__dirname + '/../modules/mysql2');
const dayjs = require('dayjs');
const router = express.Router();


const meet_place = [
    '台大',
    '台北101',
    '輔大',
    '宏匯廣場',
    '松山文創園區',
    '台北車站',
    '海洋廣場',
    '海洋大學',
    '四號公園',
    '板橋車站',
    '瓶蓋工廠',
    '大直美麗華',
    '台北美術館',
    '捷運台北橋站',
    '國立台北大學',
    '林口三井',
    '政大',
    '台北植物園',
    '警專',
    '台北護理大學',
    '國防醫學院',
];

const meet_time = [
    '2023-08-02',
    '2023-07-26',
    '2023-08-16',
    '2023-08-17',
    '2023-08-18',
    '2023-08-11',
    '2023-07-31',
    '2023-07-24',
    '2023-07-08',
    '2023-06-21',
    '2023-06-13',
    '2023-07-17',
    '2023-08-07',
    '2023-08-12',
    '2023-07-21',
    '2023-08-04',
    '2023-08-02',
    '2023-08-01',
    '2023-07-19',
    '2023-07-23',
    '2023-06-08',
    '2023-06-29',
];

const meet_time_detail = [
    '13:45:00',
    '11:30:00',
    '12:30:00',
    '14:15:00',
    '16:30:00',
    '13:20:00',
    '12:10:00',
    '11:45:00',
    '12:00:00',
    '15:00:00',
];

const tip = [
    0,
    5,
    10,
    15,
    20,
    25,
    30
];

const nickname = [
    '小帥',
    '小美',
    'John',
    '動感超人',
    '卡比獸',
    'Betty',
    '泰迪',
    '妙麗',
    '五條悟',
    '魯迪烏斯',
    '艾莉絲',
    '諭吉',
    '禰豆子',
    '鈴芽',
    '老皮',
    '林先生',
    '大眼萌妹',
    'GPA4.3',
    '肚子好2',
    '蛇蠍美人',
    '毛怪',
    '霍爾',
    '蘇菲',
    '台北金城武',
    '麥克華斯基'
];

const mobile_number = [
    '0975000666',
    '0912758633',
    '(02)24315268',
    '0988634577',
    '02-45661287',
    '0966-123-456',
    '0983-432588',
    '0971259696',
    '0955-522-139',
    '(02)2231-5458',
    '0937566791',
    '0976-432878',
    '0922134076'
];

const order_instructions = [
    '最好給我準時到',
    'Coffee,tea,or me?',
    '我真的很可愛',
    '肚子好餓哦~~',
    '感謝大大讓我有飯吃',
    '可以給我你的聯絡方式嗎<3',
    '沒有，就是，沒有。',
    '期末考要爆炸larrrrrr',
    '不好吃揍你',
    '請小心呵護我的食物們',
    '',
    'c c c c c ',
    '不要香菜!!!!!!!',
    '幫我多拿一點辣椒',
    '可以跟店家說飯少一點嗎，感恩',
    '晚到就送你吃',
    '我...要...加飯...霸脫'
];


router.get('/openforyou', async (req, res) => {

    let output = {
        rows: []
    }

    let rows = [];

    const sql = `SELECT sid FROM shops`;
    [shop_sid_array] = await db.query(sql);

    const sql2 = `INSERT INTO open_for_you 
    (open_member_id,meet_time,meet_place,target_store,tip,open_status)
    VALUES(?,?,?,?,?,?)`;

    for (i = 0; i < 400; i++) {

        const result = await db.query(sql2, [
            Math.ceil(200 * Math.random()),
            meet_time[Math.floor(meet_time.length * Math.random())] + 'T' + meet_time_detail[Math.floor(meet_time_detail.length * Math.random())],
            meet_place[Math.floor(meet_place.length * Math.random())],
            shop_sid_array[Math.floor(shop_sid_array.length * Math.random())].sid,
            tip[Math.floor(tip.length * Math.random())],
            Math.round(2 * Math.random())
        ])

        rows.push(result);
    }

    output = { ...output, rows }

    return res.json(output);
});



router.get('/buyforme', async (req, res) => {

    let output = {
        rows: []
    }

    let rows = [];

    const sql = `SELECT open_sid,tip FROM open_for_you`;
    [open_array] = await db.query(sql);

    const sql2 = `INSERT INTO buy_for_me 
    (open_sid,order_member_id,nickname,mobile_number,order_amount,order_status,order_instructions)
    VALUES(?,?,?,?,?,?,?)`;


    for (i = 0; i < open_array.length; i++) {

        for (j = 0; j < 2; j++) {

            const result = await db.query(sql2, [
                open_array[i].open_sid,
                Math.ceil(200 * Math.random()),
                nickname[Math.floor(nickname.length * Math.random())],
                mobile_number[Math.floor(mobile_number.length * Math.random())],
                open_array[i].tip,
                Math.round(2 * Math.random()),
                order_instructions[Math.floor(order_instructions.length * Math.random())],
            ])

            rows.push(result);
        }
    }

    output = { ...output, rows }

    return res.json(output);
});


router.get('/buyforme_detail', async (req, res) => {

    let output = {
        rows: []
    }

    let rows = [];

    const sql = `SELECT bf.order_sid, ofy.target_store, fit.food_id, fit.food_price
    FROM buy_for_me AS bf
    JOIN open_for_you AS ofy ON bf.open_sid = ofy.open_sid
    JOIN food_items AS fit ON ofy.target_store = fit.shop_id`;
    [buy_array] = await db.query(sql);

    const sql2 = `INSERT INTO buy_for_me_detail 
    (order_sid,order_food,order_quantity,order_price)
    VALUES(?,?,?,?)`;


    for (i = 0; i < buy_array.length; i++) {

        let no_buy = Math.round(2 * Math.random());

        if (no_buy === 0) continue;

        const result = await db.query(sql2, [
            buy_array[i].order_sid,
            buy_array[i].food_id,
            Math.ceil(3 * Math.random()),
            buy_array[i].food_price,
        ])

        rows.push(result);
    }

    output = { ...output, rows }

    return res.json(output);
});





module.exports = router; 
