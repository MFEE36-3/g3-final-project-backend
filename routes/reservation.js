const express = require('express');
const { query } = require('express');
const db = require(__dirname + '/../modules/mysql2');
const dayjs = require('dayjs');
const router = express.Router();
const upload = require(__dirname + "/../modules/img-upload");
const multipartParser = upload.none();
const moment = require('moment-timezone')


// 取得首頁-top5
router.get('/top5', async (req, res) => {
    let output = {
        rows: []
    }

    const sql = `SELECT * FROM shops ORDER BY rating DESC LIMIT 16`;
    const [rows] = await db.query(sql);
    output.rows = rows;

    return res.json(output);
});

//取得首頁-推薦餐廳
router.get('/cards', async (req, res) => {
    let output = {
        rows: []
    }

    const sql = `SELECT * FROM shops AS s JOIN res_cate AS r where s.category = r.res_id ORDER BY RAND() LIMIT 12`;
    const [rows] = await db.query(sql);
    output.rows = rows;

    return res.json(output);
});

//取得篩選區 - 縣市
router.get('/city', async (req, res) => {
    let output = {
        rows: []
    }

    const sql = `select * from city`;
    const [rows] = await db.query(sql);
    output.rows = rows;

    return res.json(output);
});

//取得篩選區 - 區域
router.get('/dist', async (req, res) => {
    let output = {
        rows: []
    }

    const sql = `select a.city_sid,a.city_id,a.cityname,b.area_sid,b.area_id,b.areaname from city AS a JOIN area AS b WHERE a.city_id = b.city_id`;
    const [rows] = await db.query(sql);
    output.rows = rows;


    return res.json(output);
});


//取得查詢餐廳
router.get('/restaurant', async (req, res) => {

    let output = {
        redirect: '',
        totalRows: 0,
        perPage: 12,
        totalPages: 0,
        page: 1,
        rows: []
    }

    const perPage = 12;

    //req.query中取得查詢條件
    let city = req.query.city || '';
    let dist = req.query.dist || 0;
    let foodtype = req.query.foodtype || '';
    let price = req.query.price || '';
    let star = req.query.star || '';
    let searchkeyword = req.query.searchkeyword || '';
    let sortrating = req.query.sortrating || '';

    // 取得要看第幾頁
    let page = req.query.page ? parseInt(req.query.page) : 1;
    if (!page || page < 1) {
        output.redirect = req.baseUrl;
        return res.json(output);
    };

    let citySQL = '';
    let cityWhere = '';
    let distSQL = '';
    let distWhere = '';
    // let foodtypeSQL = '';
    let foodtypeWhere = '';
    let priceWhere = '';
    let starWhere = '';
    let searchkeywordWhere = '';
    let sortratingSQL = '';

    //判斷是否有city
    if (city !== '') {
        citySQL = ' JOIN city c ON s.city = c.city_id';
        cityWhere = ` where c.cityname = '${city}'`;
    }
    //判斷是否有dist
    if (dist) {
        distSQL = ' JOIN area a ON s.area = a.area_id';
        const arrdist = dist.split(','); // ['大安區','信義區']
        const arrresult = arrdist.map((v, i) => {
            if (i === 0) {
                return v = ` a.areaname = '${v}' `;
            } else {
                return v = ` OR a.areaname = '${v}' `;
            }
        });
        // console.log(arrresult)
        distWhere = 'AND ( ' + arrresult.join('') + ')';
    }


    //判斷是否有foodtype
    if (foodtype !== '') {
        // foodtypeSQL = ' JOIN res_cate r ON s.category = r.res_sid'
        const arrfoodtype = foodtype.split(',');// ['中式','西式']
        const foodtyperesult = arrfoodtype.map((v, i) => {
            if (i === 0) {
                return v = ` r.res_cate = '${v}'`;
            } else {
                return v = ` OR r.res_cate = '${v}'`;
            }
        });
        const sqlfoodtype = foodtyperesult.join('');

        if (city !== '') {
            foodtypeWhere = ` AND ( ${sqlfoodtype} )`
        } else {
            foodtypeWhere = ` where ( ${sqlfoodtype} )`;
        }
    }
    //判斷是否有price
    if (price !== '') {
        const arrprice = price.split(',')
        if ((city !== '') || (foodtype !== '')) {
            priceWhere = ` AND s.avg_consumption between '${arrprice[0]}' AND '${arrprice[1]}'`
        } else {
            priceWhere = ` where s.avg_consumption between '${arrprice[0]}' AND '${arrprice[1]}'`
        }
    }
    //判斷是否有star
    if (star !== '') {
        if ((city !== '') || (foodtype !== '') || (price !== '')) {
            starWhere = ` AND s.rating >= ${star}`
        } else {
            starWhere = ` where s.rating >= ${star}`
        }
    }
    //判斷是否有keyword
    if (searchkeyword !== '') {
        if ((city !== '') || (foodtype !== '') || (price !== '') || (star !== '')) {
            searchkeywordWhere = ` AND s.shop like '%${searchkeyword}%'`
        } else {
            searchkeywordWhere = ` where s.shop like '%${searchkeyword}%'`
        }
    }
    //檢查排序
    if (sortrating !== '') {
        if (sortrating === 'desc') {
            sortratingSQL = ` ORDER BY s.rating desc`
        } else {
            sortratingSQL = ` ORDER BY s.rating asc`
        }
    }


    // 取得資料總筆數
    const t_sql = `SELECT COUNT(1) totalRows FROM shops s JOIN res_cate r ON s.category = r.res_sid ${citySQL}${distSQL} ${cityWhere}${distWhere}${foodtypeWhere}${priceWhere}${starWhere}${searchkeywordWhere}`;
    const [[{ totalRows }]] = await db.query(t_sql);

    let totalPages = 0;
    let rows = [];

    //有資料的情況
    if (totalRows) {
        totalPages = Math.ceil(totalRows / perPage);
        if (page > totalPages) {
            output.redirect = req.baseUrl + '?page=' + totalPages;
            return output;
        };

        const sqlQuery = `SELECT * FROM shops s JOIN res_cate r ON s.category = r.res_sid ${citySQL}${distSQL} ${cityWhere}${distWhere}${foodtypeWhere}${priceWhere}${starWhere}${searchkeywordWhere} ${sortratingSQL} LIMIT ${perPage * (page - 1)}, ${perPage}`;
        // const sql = ` SELECT * FROM shops LIMIT ${perPage * (page - 1)}, ${perPage}`;
        [rows] = await db.query(sqlQuery);

    }


    output = { ...output, totalRows, perPage, totalPages, page, rows };
    return res.json(output);
    // return res.json({ totalRows, perPage, totalPages, page, rows })
});

//取得動態路由餐廳
router.get("/:sid", async (req, res) => {
    const output = {
        success: false,
        error: "",
        detail: null,
        booking: [],
        seattype: [],
        fooditems: [],
    };
    const sid = parseInt(req.params.sid) || 0;
    if (!sid) {
        // 沒有 sid
        output.error = "沒有 sid !";
    } else {
        //取得餐廳資訊info
        const detailsql = `SELECT * FROM shops s 
        JOIN city c ON s.city = c.city_id 
        JOIN area a ON s.area = a.area_id AND s.city =a.city_id
        JOIN res_cate r ON s.category = r.res_sid 
        JOIN res_opentime ro ON s.sid = ro.res_id 
        WHERE s.sid=${sid}`;

        //取得訂單資訊
        const bookingsql = `SELECT b.*,st.seat_number FROM booking b 
        JOIN shops s ON b.shop_id = s.sid
        JOIN seat_type st ON b.table = st.seat_id
        WHERE b.shop_id=${sid}`;

        //取得座位資訊seat
        const seattypesql = `SELECT * FROM seat_type`;

        //取得餐點資訊
        const foodsql = `SELECT * FROM food_items AS fi JOIN res_food_cate AS fc ON fi.food_cate = fc.food_cate WHERE fi.shop_id=${sid}`

        const [detail] = await db.query(detailsql);
        const [booking] = await db.query(bookingsql);
        const [seattype] = await db.query(seattypesql);
        const [fooditems] = await db.query(foodsql);

        if (detail.length) {
            output.success = true;
            output.detail = detail[0];
        } else {
            // 沒有資料
            output.error = "沒有資料 !";
        }


        if (booking.length) {
            output.success = true;
            output.booking = booking.map(v => {
                v.booking_date = moment(v.booking_date).format('YYYY-MM-DD')
                return v;
            })

        } else {
            // 沒有資料
            output.error = "沒有資料 !";
        }

        if (seattype.length) {
            output.success = true;
            output.seattype = seattype;

            // console.log(seattype)
        } else {
            // 沒有資料
            output.error = "沒有資料 !";
        }

        if (fooditems.length) {
            output.success = true;
            output.fooditems = fooditems;

            // console.log(fooditems)
        } else {
            // 沒有資料
            output.error = "沒有資料 !";
        }
    }
    // console.log(output)
    console.log(output.booking)
    console.log(output.success)
    res.json(output);

});

//新增訂位資料
router.post("/", async (req, res) => {

    const sql = "INSERT INTO `booking`" +
        "(`id`, `shop_id`, `booking_date`, `booking_time`, `booking_number`, `table`, `rating`, `memo`, `status`, `create_at`) VALUES" +
        "(?,?,?,?,?,?,?,?,?,NOW())";

    const [result] = await db.query(sql, [
        req.body.id,
        req.body.shop_id,
        req.body.date,
        req.body.time,
        req.body.person,
        req.body.seat,
        req.body.rating,
        req.body.memo,
        req.body.status,
    ])

    res.json({
        result,
        postData: req.body
    });
})

//新增收藏餐廳
router.post("/favorite", async (req, res) => {
    const { id, shop_id } = req.body;
    const sql = "INSERT INTO `favorite`(`Id`,`shop_id`,`create_at`) VALUES (?,?,NOW())";
    try {
        const [result] = await db.query(sql, [id, shop_id])
        res.json({
            result,
            postData: req.body
        });
    } catch (error) {
        console.log(error)
        res.json(error)
    }


})

//查詢收藏餐廳
router.get("/favoritelist/:id", async (req, res) => {
    const output = {
        rows: []
    }
    const id = req.params.id;
    const sql = `SELECT * FROM favorite WHERE id=${id}`
    const [rows] = await db.query(sql);
    output.rows = rows;

    return res.json(output);

})

//刪除收藏餐廳
router.delete("/favorite_delete/:sid/:shop_id", async (req, res) => {
    const { id, shop_id } = req.body;
    const sql = `DELETE FROM favorite WHERE id=${id} AND shop_id=${shop_id} `;
    const [result] = await db.query(sql, [id, shop_id])

    res.json({
        result,
        postData: req.body
    });
})







module.exports = router;