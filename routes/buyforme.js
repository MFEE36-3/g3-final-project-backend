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

    const sql = `SELECT open_for_you.meet_place,buy_for_me.order_sid,member_info.nickname,open_for_you.meet_time,buy_for_me.order_status,buy_for_me.order_amount,open_for_you.open_sid,open_for_you.open_member_id FROM buy_for_me 
    JOIN open_for_you ON buy_for_me.open_sid = open_for_you.open_sid
    JOIN member_info ON member_info.sid = open_for_you.open_member_id
    WHERE buy_for_me.order_member_id = ${member_id}
    HAVING buy_for_me.order_status IN (1,2) 
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

// 拿開團紀錄及跟團者訊息
router.post('/openforyou_followers', async (req, res) => {

    let output = {
        rows: []
    }

    const { member_id } = req.body

    //拿到開團數量 單號 地點 時間 店家id 店名 跑腿費 
    //用 open_sid 跟 arr2 跑 for 
    const sql = `SELECT open_for_you.open_sid,open_for_you.meet_time,open_for_you.meet_place,open_for_you.target_store,open_for_you.tip,shops.shop FROM open_for_you 
    JOIN shops ON open_for_you.target_store = shops.sid
    WHERE open_member_id = ${member_id} 
    ORDER BY open_for_you.meet_time DESC`;
    [arr1] = await db.query(sql);

    //拿到跟單數量 單號 暱稱 總額  (排除訂單總額只有跑腿費的訂單)
    //用 order_sid 跟 arr3 跑 for  
    const sql2 = `SELECT open_for_you.open_sid,buy_for_me.order_sid,buy_for_me.nickname,buy_for_me.mobile_number,buy_for_me.order_amount,buy_for_me.order_instructions FROM open_for_you 
    JOIN buy_for_me ON open_for_you.open_sid = buy_for_me.open_sid AND buy_for_me.order_amount != open_for_you.tip
    WHERE open_member_id = ${member_id}  
    ORDER BY buy_for_me.order_sid ASC`;
    [arr2] = await db.query(sql2);

    //拿到跟單總明細
    const sql3 = `SELECT buy_for_me.order_sid,buy_for_me_detail.order_quantity,food_items.food_title FROM open_for_you 
    JOIN buy_for_me ON open_for_you.open_sid =buy_for_me.open_sid
    JOIN buy_for_me_detail ON buy_for_me.order_sid = buy_for_me_detail.order_sid
    JOIN shops ON open_for_you.target_store = shops.sid
    JOIN food_items ON food_items.food_id = buy_for_me_detail.order_food  
    WHERE open_member_id = ${member_id} 
    ORDER BY open_for_you.meet_time ASC`;
    [arr3] = await db.query(sql3);

    const rows = arr1.map((v) => {

        const orders = [];

        for (let i = 0; i < arr2.length; i++) {

            const order_detail = [];

            for (let j = 0; j < arr3.length; j++) {
                if (arr2[i].order_sid === arr3[j].order_sid) {
                    order_detail.push([arr3[j].food_title, arr3[j].order_quantity])
                }
            }

            if (v.open_sid === arr2[i].open_sid) {
                orders.push([arr2[i].nickname, order_detail, arr2[i].order_instructions, arr2[i].order_amount, arr2[i].mobile_number])
            }
        }

        return ({ ...v, orders })
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

    const [result] = await db.query(sql, [
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

    const { open_sid, nickname, order_member_id, mobile_number, order_amount, order_instructions, order_status, order_detail } = req.body;

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

    const sql2 = `INSERT INTO buy_for_me_detail
    (order_sid,order_food,order_quantity,order_price)
    VALUES(?,?,?,?)`;


    // 獲取最新的insert值
    const order_sid = result[0].insertId;

    const [result2] = await Promise.all(

        order_detail.map(async (v) => {
            const response = await db.query(sql2, [
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
        order_sid,
        postData: req.body
    })
});


// 完成取餐 & 撥款進會員錢包 & 寫錢包紀錄
router.post('/finishbuyforme', async (req, res) => {

    // TODO: 檢查資料格式

    const { order_sid, open_member_id, order_amount } = req.body;


    //把錢轉給跑腿者
    const sql = `UPDATE member_info 
    SET wallet = wallet + ?
    WHERE sid = ?`;

    const [result] = await db.query(sql, [
        order_amount,
        open_member_id
    ])

    //寫錢包紀錄
    const sql2 = `INSERT INTO member_wallet_record
    (member_id,amount,content,add_time) 
    VALUES(?,?,?,NOW())`;

    const [result2] = await db.query(sql2, [
        open_member_id,
        order_amount,
        '訂單費用加跑腿費'
    ])


    //更改自己的訂單狀態
    const sql3 = `UPDATE buy_for_me 
    SET order_status = 2
    WHERE order_sid = ?`;

    const [result3] = await db.query(sql3, [
        order_sid
    ])

    res.json({
        result,
        result2,
        result3,
        postData: req.body
    })
});

// 結帳後修改訂單狀態
router.post('/checkout_buyforme', async (req, res) => {

    // TODO: 檢查資料格式

    const { order_sid } = req.body;


    //把錢轉給跑腿者
    const sql = `UPDATE buy_for_me 
    SET order_status = ?
    WHERE order_sid = ?`;

    const [result] = await db.query(sql, [
        1,
        order_sid
    ])


    res.json({
        result,
        postData: req.body
    })
});





module.exports = router; 
