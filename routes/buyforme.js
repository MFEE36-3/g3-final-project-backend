const express = require('express');
const db = require(__dirname + '/../modules/mysql2');
const dayjs = require('dayjs');
const router = express.Router();
const fs = require('fs');
const path = require('path');


// --------------------------------------下面是暫時用的評論資料------------------------------------

let reviews;

const get_reviews = async function () {
    try {
        const filePath = path.join(process.cwd(), 'public', 'review.json'); // 取得 review.json 的絕對路徑
        const jsonData = await fs.promises.readFile(filePath, 'utf-8');
        const data = JSON.parse(jsonData);
        reviews = data.reviews;
        return data;
    } catch (error) {
        console.error('Error reading JSON file:', error);
        return null;
    }
};

get_reviews();

// --------------------------------------上面是暫時用的評論資料------------------------------------



// 拿全部店家資料
router.get('/', async (req, res) => {

    let output = {
        rows: []
    }

    const sql = `SELECT * FROM shops JOIN res_cate WHERE shops.category = res_cate.res_sid`;
    [rows] = await db.query(sql);

    output = { ...output, rows }

    return res.json(output);
});


// 拿開團單
router.get('/openforyou', async (req, res) => {

    let output = {
        rows: []
    }

    const sql = `SELECT * FROM open_for_you 
    JOIN shops ON shops.sid = open_for_you.target_store
    JOIN member_info ON member_info.sid = open_for_you.open_member_id
    ORDER BY open_for_you.meet_time ASC`;
    [rows] = await db.query(sql);

    output = { ...output, rows }

    return res.json(output);
});

// 拿點餐單資料
router.post('/foodlist', async (req, res) => {

    let output = {
        rows: []
    }

    const { targetstore } = req.body

    const sql = `SELECT shops.sid,shop,food_title,food_price,food_des,food_id,food_img FROM shops 
    JOIN food_items ON shops.sid = food_items.shop_id
    WHERE shops.sid = ${targetstore}`;
    [rows] = await db.query(sql);


    output = { ...output, rows }

    return res.json(output);
});

// 拿跟團紀錄
router.post('/buyforme', async (req, res) => {

    let output = {
        rows: []
    }

    const { member_id } = req.body

    const sql = `SELECT open_for_you.meet_place,buy_for_me.order_sid,member_info.nickname,open_for_you.meet_time,buy_for_me.order_status,open_for_you.open_sid FROM buy_for_me 
    JOIN open_for_you ON buy_for_me.open_sid = open_for_you.open_sid
    JOIN member_info ON member_info.sid = open_for_you.open_member_id
    WHERE buy_for_me.order_member_id = ${member_id}
    HAVING buy_for_me.order_status = 1
    ORDER BY open_for_you.meet_time ASC`;
    [arr1] = await db.query(sql);

    const sql2 = `SELECT buy_for_me.open_sid,buy_for_me_detail.order_quantity,food_items.food_title FROM buy_for_me 
    JOIN buy_for_me_detail ON buy_for_me_detail.order_sid = buy_for_me.order_sid
    JOIN food_items ON food_items.food_id = buy_for_me_detail.order_food
    WHERE buy_for_me.order_member_id = ${member_id}`;
    [arr2] = await db.query(sql2);

    const rows = arr1.map((v) => {

        const foods = [];

        for (let i = 0; i < arr2.length; i++) {
            if (v.open_sid === arr2[i].open_sid) {
                foods.push([arr2[i].food_title, arr2[i].order_quantity])
            }
        }

        return ({ ...v, foods })
    })

    output = { ...output, rows }

    return res.json(output);
});



// 拿評論資料
router.get('/review', async (req, res) => {

    let output = {
        rows: []
    }

    //先抓資料庫所有資料 拿他們的店名去找Place_id
    const sql = `SELECT * FROM shops`;
    [rows] = await db.query(sql);

    const fetchPlaceReviews = async () => {
        try {
            // ----------------------暫時停用,會花到太多錢---------------------
            // let place_id = await Promise.all(
            //     rows.map(async function (v) {
            //         const response = await fetch(
            //             `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${v.shop}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
            //         );
            //         const data = await response.json();
            //         return { 'sid': v.sid, 'placeID': data.predictions[0].place_id };
            //     })
            // );


            // let reviews = await Promise.all(
            //     place_id.map(async function (v, i) {
            //         const response = await fetch(
            //             `https://maps.googleapis.com/maps/api/place/details/json?place_id=${v.placeID}&fields=reviews&language=zh-TW&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
            //         );
            //         const data = await response.json();

            //         if (data.result.reviews) {
            //             return { 'sid': v.sid, 'review': data.result.reviews };
            //         } else {
            //             return { 'sid': v.sid, 'review': [] };
            //         }
            //     })
            // );

            // ------------------------------------------------------------------------------

            output = { ...output, rows: reviews }
            return res.json(output);

        } catch (error) {
            console.error('Error fetching place reviews:', error);
            return res.json(output);
        }
    };

    fetchPlaceReviews();

});


// 寫入開單資料
router.post('/openforyou', async (req, res) => {

    // TODO: 檢查資料格式

    const { open_member_id, meet_date, meet_hour, meet_place, target_store, tip, open_status } = req.body;

    if (open_member_id === 0) return res.json('請先登入');

    const meet_time = meet_date + 'T' + meet_hour;

    const sql = `INSERT INTO open_for_you 
    (open_member_id,meet_time,meet_place,target_store,tip,open_status)
    VALUES(?,?,?,?,?,?)`;

    const result = await db.query(sql, [
        open_member_id,
        meet_time,
        meet_place,
        target_store,
        tip,
        open_status
    ])


    res.json({
        result,
        postData: req.body
    })
});


// 寫入跟單資料&跟單細項資料
router.post('/setbuyforme', async (req, res) => {

    // TODO: 檢查資料格式

    const { order_member_id, nickname, mobile_number, order_amount, order_instructions, order_detail, open_sid, order_status } = req.body;

    if (order_member_id === 0) return res.json('請先登入');

    const sql = `INSERT INTO buy_for_me 
    (open_sid,order_member_id,nickname,mobile_number,order_amount,order_instructions,order_status)
    VALUES(?,?,?,?,?,?,?)`;

    const result = await db.query(sql, [
        open_sid,
        order_member_id,
        nickname,
        mobile_number,
        order_amount,
        order_instructions,
        order_status
    ])

    // 獲取最新插入的序號
    const [lastInsertedIdResult] = await db.query('SELECT LAST_INSERT_ID() AS last_id');
    const order_sid = lastInsertedIdResult[0].last_id;
    


    const sq2 = `INSERT INTO buy_for_me_detail
    (order_sid,order_food,order_quantity,order_price)
    VALUES(?,?,?,?)`;


    const result2 = await Promise.all(

        order_detail.map(async (v) => {
            const response = await db.query(sq2, [
                order_sid,
                v.food_id,
                v.food_quantity,
                v.food_price
            ])

            const [ResultSetHeader] = response;
            return ResultSetHeader.affectedRows;
        })
    )

    res.json({
        result,
        result2,
        postData: req.body
    })
});



module.exports = router; 
