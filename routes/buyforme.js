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



module.exports = router; 
