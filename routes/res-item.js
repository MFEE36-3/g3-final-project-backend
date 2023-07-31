const express = require('express');
const res = require('express/lib/response');
const router = express.Router();
const db = require(__dirname + '/../modules/mysql2');
const dayjs = require('dayjs');
const upload = require(__dirname + '/../modules/res-img-upload')
const multipartParser = upload.none()
const bcrypt = require('bcryptjs')

// 將html與api分開

const getListData = async (req, shop_id) => {

    let output = {
        redirect: "",
        totalRows: 0,
        perPage: 25,
        totalPages: 0,
        page: 1,
        rows: [],
    }

    const perPage = 50;

    // 在哪一個分頁(?page=...) => 用req.query
    let page = req.query.page ? +req.query.page : 1;

    // 做搜尋功能:用queryString做
    let keyword = req.query.keyword || '';

    // 防範如果page是NaN或0會回傳true
    const baseUrl = req.baseUrl
    if (!page || page < 1) {               // 小於1或NaN、0時就導回到/ab
        output.redirect = req.baseUrl
        return output   // 不能用'/',會回到整個網站的根目錄，要用baseUrl
    }

    // 以sql語法做關鍵字搜尋，先做出篩選條件
    // let where = `WHERE 1`;
    let where = `WHERE shop_id=${shop_id}`;
    if (keyword) {
        const kw_escaped = db.escape('%' + keyword + '%');
        where += ` AND ( 
          \`food_title\` LIKE ${kw_escaped} 
          OR
          \`food_des\` LIKE ${kw_escaped}
          )
        `;
    }
    // where += ` AND \`name\` LIKE ${ db.escape('%'+keyword+'%') } `;
    // 未跳脫前:where += ` AND \`name\` LIKE '%${keyword}%' `

    // 先看資料庫共有幾筆資料
    const t_sql = `SELECT COUNT(1) totalRows FROM food_items_try ${where}`
    const [[{ totalRows }]] = await db.query(t_sql);    // 解構三次

    let totalPages = 0;
    // 計算有多少頁(假設總筆數totalRows不為0)
    if (totalRows) {
        totalPages = Math.ceil(totalRows / perPage)

        if (page > totalPages) {
            output.redirect = req.baseUrl + '?page=' + totalPages
            return output
        }
    }

    let rows = [];
    // 拿分頁的資料
    const sql = `SELECT * FROM food_items_try ${where} ORDER BY food_id DESC LIMIT ${perPage * (page - 1)}, ${perPage}`;
    [rows] = await db.query(sql)
    // const [rows] = await db.query(sql) 也可以

    output = { ...output, totalRows, perPage, totalPages, page, baseUrl, keyword, rows }
    return output
}

const getListDataASC = async (req, shop_id) => {

    let output = {
        redirect: "",
        totalRows: 0,
        perPage: 25,
        totalPages: 0,
        page: 1,
        rows: [],
    }

    const perPage = 50;

    // 在哪一個分頁(?page=...) => 用req.query
    let page = req.query.page ? +req.query.page : 1;

    // 做搜尋功能:用queryString做
    let keyword = req.query.keyword || '';

    // 防範如果page是NaN或0會回傳true
    const baseUrl = req.baseUrl
    if (!page || page < 1) {               // 小於1或NaN、0時就導回到/ab
        output.redirect = req.baseUrl
        return output   // 不能用'/',會回到整個網站的根目錄，要用baseUrl
    }

    // 以sql語法做關鍵字搜尋，先做出篩選條件
    // let where = `WHERE 1`;
    let where = `WHERE shop_id=${shop_id}`;
    if (keyword) {
        const kw_escaped = db.escape('%' + keyword + '%');
        where += ` AND ( 
          \`food_title\` LIKE ${kw_escaped} 
          OR
          \`food_des\` LIKE ${kw_escaped}
          )
        `;
    }
    // where += ` AND \`name\` LIKE ${ db.escape('%'+keyword+'%') } `;
    // 未跳脫前:where += ` AND \`name\` LIKE '%${keyword}%' `

    // 先看資料庫共有幾筆資料
    const t_sql = `SELECT COUNT(1) totalRows FROM food_items_try ${where}`
    const [[{ totalRows }]] = await db.query(t_sql);    // 解構三次

    let totalPages = 0;
    // 計算有多少頁(假設總筆數totalRows不為0)
    if (totalRows) {
        totalPages = Math.ceil(totalRows / perPage)

        if (page > totalPages) {
            output.redirect = req.baseUrl + '?page=' + totalPages
            return output
        }
    }

    let rows = [];
    // 拿分頁的資料
    const sql = `SELECT * FROM food_items_try ${where} ORDER BY food_id ASC LIMIT ${perPage * (page - 1)}, ${perPage}`;
    [rows] = await db.query(sql)
    // const [rows] = await db.query(sql) 也可以

    output = { ...output, totalRows, perPage, totalPages, page, baseUrl, keyword, rows }
    return output
}

// middleware
// router.use((req, res, next) => {
//     res.locals.title = '通訊錄 | ' + res.locals.title;
//     next()
// })
console.log('--------------')


router.post('/res-register-form/', multipartParser, async (req, res) => {
    res.send(req.params)

    const output = {
        success: false,
        error: '',
        data: null,
    };

    const salt = bcrypt.genSaltSync(10)
    const hashPassword = bcrypt.hashSync(req.body.password, salt)

    const sql_shop =
        "INSERT INTO `shops`" +
        "(`account`, `password`, `shop`, `owner`,`category`," +
        "`res_desc`,`avg_consumption`, `photo`, `removeBackgroundImage`, `city`, `area`," +
        " `location`, `phone`, `longitude`, `latitude`)" +
        "VALUES" +
        " (?,?,?,?,?," +
        "?,?,?,NULL,?,?," +
        "?,?,?,?); ";

    const sql_opentime =
        "INSERT INTO `res_opentime`" +
        "(`res_id`, `open_time`, `close_time`, `Monday`, `Tuesday`," +
        " `Wednesday`, `Thursday`, `Friday`, `Saturday`, `Sunday`)" +
        "VALUES" +
        "(?,?,?,?,?,?,?,?,?,?)";

    const conn = await db.getConnection();

    try {
        // Start transaction
        await conn.beginTransaction();

        // Insert into `shops` table
        const [result_shop] = await conn.query(sql_shop, [
            req.body.account,
            hashPassword,
            req.body.name,
            req.body.owner,
            req.body.res_cate,
            req.body.description,
            req.body.avg_consumption,
            req.body.photo,
            req.body.city,
            req.body.area,
            req.body.fulladdress1,
            req.body.phone,
            req.body.longitude,
            req.body.latitude
        ]);

        // Get the last inserted res_id
        const res_id = result_shop.insertId;

        // Insert into `res_opentime` table with the obtained res_id
        const [result_opentime] = await conn.query(sql_opentime, [
            res_id,
            req.body.open_time,
            req.body.close_time,
            0,
            1,
            1,
            1,
            1,
            1,
            0,
        ]);

        // Commit the transaction
        await conn.commit();

        res.json({
            result_shop,
            result_opentime,
        });
    } catch (err) {
        // Rollback the transaction on error
        await conn.rollback();
        // Handle any errors
        console.error(err);
        res.status(500).json({
            success: false,
            error: 'An error occurred.',
        });
    } finally {
        // Release the connection
        conn.release();
    }
});


// 餐廳新增商品
router.post('/add-item', multipartParser, async (req, res) => {

    let foodCate = 0
    if (req.body.foodCate === '前菜') {
        foodCate = 1
    } else if (req.body.foodCate === '主菜') {
        foodCate = 2
    } else if (req.body.foodCate === '甜點') {
        foodCate = 3
    } else if (req.body.foodCate === '飲料') {
        foodCate = 4
    } else if (req.body.foodCate === '湯品') {
        foodCate = 5
    }

    const sql = "INSERT INTO `food_items_try`(`shop_id`, `food_img`, `food_cate`, `food_title`, `food_des`, `food_price`, `food_note`, `create_time`) VALUES (?,?,?,?,?,?,?,NOW())"

    const [result] = await db.query(sql, [
        req.body.shop_id,
        req.body.photo,
        foodCate,
        req.body.name,
        req.body.description,
        req.body.price,
        req.body.note,
    ])

    res.json({
        result,
        postData: req.body
    })
})

// 取得品項資料
router.post('/item-management/', async (req, res) => {
    // res.json(req.body)

    const output = await getListData(req, req.body.id);
    if (output.redirect) {
        return res.redirect(output.redirect)
    }

    output.rows.forEach(i => {
        i.create_time = dayjs(i.create_time).format('YYYY-MM-DD HH:mm:ss')
    })

    console.log(output)
    res.json(output)
})

// 商品排序:由新到舊
router.get('/item-management/DESC', async (req, res) => {
    const output = await getListData(req, req.body.id);
    if (output.redirect) {
        return res.redirect(output.redirect)
    }

    output.rows.forEach(i => {
        i.create_time = dayjs(i.create_time).format('YYYY-MM-DD HH:mm:ss')
    })

    console.log(output)
    res.json(output)
})
// 商品排序:由舊到新
router.get('/item-management/ASC', async (req, res) => {
    const output = await getListDataASC(req, parseInt(req.body.id));
    if (output.redirect) {
        return res.redirect(output.redirect)
    }

    output.rows.forEach(i => {
        i.create_time = dayjs(i.create_time).format('YYYY-MM-DD HH:mm:ss')
    })

    console.log(output)
    res.json(output)
})

// 餐廳編輯商品
// 1、先取得資料
router.get('/item-management/editItem/:food_id', async (req, res) => {

    const output = {
        success: false,
        error: '',
        data: null
    }

    console.log(req.params) // { food_id: '100' }
    const food_id = parseInt(req.params.food_id) || 0
    console.log(food_id)    // 100

    const sql = `SELECT * FROM food_items_try WHERE food_id=?`
    const [result] = await db.query(sql, [food_id])

    if (!result.length) {
        output.error = '沒有該筆資料'
        res.json(output)
    } else {
        output.data = result;
        output.success = true;
        res.json(output)
    }

    // res.json(result)
})

// 2、把修改完的資料放回資料庫

// 餐廳刪除商品
router.delete('/item-management/deleteItem/:food_id', async (req, res) => {
    const { food_id } = req.params;

    // res.send(req.params.food_id)

    const sql = `DELETE FROM \`food_items_try\` WHERE food_id=?`;
    const [result] = await db.query(sql, [food_id])

    res.json(result)
})

router.get('/api', async (req, res) => {
    const output = await getListData(req);  // return是output
    output.rows.forEach(i => {
        i.birthday = dayjs(i.birthday).format('YYYY-MM-DD');
        delete i.created_at
    })

    res.json(output)
})

// 商家取得訂單資料
router.post('/getShopOrder', async (req, res) => {
    // res.json(req.body)
    const output = {
        success: false,
        error: '',
        data: null,
        data1: null,
        data2: null,
        data3: null,
        reqBody: req.body
    }

    // 先隨便拿資料
    const sql = "SELECT `subA`.`open_sid`, `subA`.`order_sid`, `buy_for_me_detail`.`order_food`, `buy_for_me_detail`.`order_quantity`, `buy_for_me_detail`.`order_price`, `buy_for_me_detail`.`order_detail_sid`, `subA`.`target_store`, `subA`.`open_time`, `subA`.`order_instructions`, `food_items_try`.`food_title`, `food_items_try`.`food_id` FROM ( SELECT `open_for_you`.`open_sid`, `open_for_you`.`target_store`, `open_for_you`.`open_time`, `buy_for_me`.`order_sid`, `buy_for_me`.`order_instructions` FROM `open_for_you` JOIN `buy_for_me` ON `open_for_you`.`open_sid` = `buy_for_me`.`open_sid` ) AS `subA` JOIN `buy_for_me_detail` ON `buy_for_me_detail`.`order_sid` = `subA`.`order_sid` JOIN `food_items_try` ON `food_items_try`.`food_id` = `buy_for_me_detail`.`order_food` WHERE `target_store` = ?;"

    const sql1 = "SELECT * FROM open_for_you WHERE target_store = ? GROUP BY open_for_you.open_sid;"

    const [rows] = await db.query(sql, [parseInt(req.body.id)])      // rows:array
    const [rows1] = await db.query(sql1, [parseInt(req.body.id)])    // rows1:array

    console.log(rows1)
    for (item of rows1) {
        item.meet_time = dayjs(item.meet_time).format('YYYY-MM-DD HH:mm:ss')
    }
    // rows1[0].meet_time = dayjs(rows1[0].meet_time).format('YYYY-MM-DD HH:mm:ss')

    // console.log(rows)
    const orderSum = rows1.map((v) => {
        let orderArr = [];
        for (i = 0; i < rows.length; i++) {
          if (v.open_sid == rows[i].open_sid) {
            orderArr.push({
              open_sid: rows[i].open_sid,
              title: rows[i].food_title,
              amount: rows[i].order_quantity,
              price: rows[i].order_price,
              meet_time: rows[i].meet_time, // 加入meet_time
            });
          }
        }
        return orderArr;
      });
      
      const result = orderSum.reduce((acc, curr) => {
        curr.forEach((item) => {
          const existingItem = acc.find((i) => i.open_sid === item.open_sid);
          if (existingItem) {
            existingItem.titles.push(item.title);
            existingItem.amounts.push(item.amount);
            existingItem.prices.push(item.price);
            // 若meet_time不同，則合併meet_time，這裡假設相同open_sid的meet_time都一樣
            if (existingItem.meet_time !== item.meet_time) {
              existingItem.meet_time = existingItem.meet_time + " / " + item.meet_time;
            }
          } else {
            acc.push({
              open_sid: item.open_sid,
              titles: [item.title],
              amounts: [item.amount],
              prices: [item.price],
              meet_time: item.meet_time, // 加入meet_time
            });
          }
        });
        return acc;
      }, []);
      
      const mergedData = result.map((dataObj) => {
        const mergedObj = { ...dataObj };
        const titleMap = new Map();
      
        for (let i = 0; i < dataObj.titles.length; i++) {
          const title = dataObj.titles[i];
          const amount = dataObj.amounts[i];
          const price = dataObj.prices[i];
      
          if (titleMap.has(title)) {
            const existingIndex = titleMap.get(title);
            mergedObj.amounts[existingIndex] += amount;
          } else {
            titleMap.set(title, i);
          }
        }
      
        mergedObj.titles = Array.from(titleMap.keys());
        mergedObj.amounts = Array.from(titleMap.values()).map((index) => mergedObj.amounts[index]);
        mergedObj.prices = Array.from(titleMap.values()).map((index) => mergedObj.prices[index]);
      
        return mergedObj;
      });
      

    //   console.log(mergedData);

    output.data = { rows, rows1, orderSum }
    output.data1 = rows1
    output.data2 = orderSum
    output.data3 = mergedData
    res.json(output)
})

// login東西在這

// 取得單筆資料(驗證過登入)
router.get('/api/verify/:sid', async (req, res) => {
    // 1、先設定要輸出的output
    const output = {
        success: false,
        error: '',
        data: null,
    }

    // 如果沒有JSONWebToken && 如果有JWT
    if (!res.locals.jwtData) {
        output.error = '沒有token驗證';
        return res.json(output)
    } else {
        output.jwtData = res.locals.jwtData
    }

    const sid = parseInt(req.params.sid) || 0;
    if (!sid) {
        output.error = '沒有這筆資料';
        return res.json(output)
    }

    const sql = `SELECT * FROM address_book WHERE sid=${sid}`
    const [rows] = await db.query(sql)  // array

    // 檢查是否有這個欄位，沒有就顯示error
    if (!rows.length) {
        output.error = 'No Data';
        return res.json(output)
    } else {
        // 調整時間格式
        rows[0].birthday = dayjs(rows[0].birthday).format('YYYY-MM-DD')
        output.data = rows
        return res.json(output)
    }

})

// 取得單筆資料
router.get('/api/:sid', async (req, res) => {
    // 1、先設定要輸出的output
    const output = {
        success: false,
        error: '',
        data: null,
    }

    const sid = parseInt(req.params.sid) || 0;
    if (!sid) {
        output.error = '沒有這筆資料';
        return res.json(output)
    }

    const sql = `SELECT * FROM address_book WHERE sid=${sid}`
    const [rows] = await db.query(sql)  // array

    // 檢查是否有這個欄位，沒有就顯示error
    if (!rows.length) {
        output.error = 'No Data';
        return res.json(output)
    } else {
        // 調整時間格式
        rows[0].birthday = dayjs(rows[0].birthday).format('YYYY-MM-DD')
        output.data = rows
        return res.json(output)
    }

})


// read data
router.get('/', async (req, res) => {

    const output = await getListData(req);
    if (output.redirect) {
        return res.redirect(output.redirect)
    }
    res.render('address-book/index', output)

})

// 新增表單:用get到表單連結
router.get('/add', async (req, res) => {

    res.render('address-book/add')
})
// 用post方法傳送表單內容到db並在前端render
// upload.none():沒有要上傳任何檔案，但是要解析檔案。
router.post('/', multipartParser, async (req, res) => {

    const sql = "INSERT INTO `address_book`" +
        "(`name`, `email`, `mobile`, `birthday`, `address`, `created_at`)" +
        "VALUES" +
        "(?, ?, ?, ?, ?, NOW())"

    // 檢查date格式
    let birthday = dayjs(req.body.birthday)
    if (birthday.isValid()) {
        birthday = birthday.format('YYYY-MM-DD')
    } else {
        birthday = null
    }

    const [result] = await db.query(sql, [
        req.body.name,
        req.body.email,
        req.body.mobile,
        birthday,
        req.body.address,
    ])

    res.json({
        result,
        postData: req.body
    })
})

// 測試表單(checkbox&radio button)
router.get('/add-try', async (req, res) => {
    res.render('address-book/add-try');
});
router.post('/add-try', multipartParser, async (req, res) => {
    res.json(req.body);
});

// 修改表單的頁面
router.get('/edit/:sid', async (req, res) => {
    // res.json(req.params)
    let { sid } = req.params;
    sid = parseInt(sid);                // 轉換為整數就不會有sql injection的問題
    const [rows] = await db.query(`SELECT * FROM address_book WHERE sid='${sid}'`)
    console.log(rows[0])

    // [rows]拿到陣列，若array沒有值(length為0)就redirect
    if (!rows.length) {
        return res.redirect(req.baseUrl)
    }
    res.render('address-book/edit', { rows: rows[0] })  // rows[0]為物件

    // res.json(rows[0])
})

// 修改餐廳商品的api
router.put('/:food_id', async (req, res) => {
    const output = {
        success: false,
        error: '',
        data: null,
    }
    // res.json({test:'alex'})
    // console.log(req.params) // {food_id: '100'}
    const food_id = parseInt(req.params.food_id) // 100

    // 先找到那筆資料
    const sql = `SELECT * FROM food_items_try WHERE food_id=?`
    const [rows] = await db.query(sql, [food_id])
    // console.log(rows) // array
    if (!rows.length) {
        output.error = '沒有該筆資料'
        res.json(output)
    }

    // 有資料的話，用req.body傳過來的東西以展開運算子更新
    const newData = { ...rows[0], ...req.body }
    const sql2 = `UPDATE \`food_items_try\` SET ? WHERE food_id=?`
    const [result] = await db.query(sql2, [newData, food_id])

    console.log(result)

    output.data = result

    res.json(output)

    // res.json(req.params)
})

// 修改表單的API
router.put('/:sid', async (req, res) => {
    console.log(req.body)

    // 嚴謹的做法:先再找到那筆資料一次
    let { sid } = req.params;
    sid = parseInt(sid);
    const [rows] = await db.query(`SELECT * FROM address_book WHERE sid='${sid}'`)
    if (!rows.length) {
        return res.json({ msg: '編號錯誤' })   // 這邊就return，確保後面不會繼續執行
    }
    let row = { ...rows[0], ...req.body };   // 拿到那個object，並用其餘運算子更新內容
    // console.log(row)
    const sql = `UPDATE \`address_book\` SET ? WHERE sid=?`; // 第一個問號就放更新過的row，第二個放sid
    const [result] = await db.query(sql, [row, sid])


    res.json({
        // result有一個key為changedRows，代表有沒有影響到資料(affectedRows是指有沒有選到那一個rows)
        success: !!result.changedRows, // 用!!changedRows來看有沒有修改成功
        result,
    })
})

// 兩層式表單
router.get('/cate1', async (req, res) => {

    const [rows] = await db.query("SELECT * FROM categories ORDER BY sid");

    // 先編成字典
    const dict = {}
    rows.forEach(i => {
        dict[i.sid] = i
    });

    rows.forEach(i => {
        const parent = dict[i.parent_sid];
        if (parent) {
            parent.nodes = parent.nodes || [];
            parent.nodes.push(i);
        }
    });

    const newAr = [];
    rows.forEach(i => {
        if (i.parent_sid == '0') {
            newAr.push(i);
        }
    });

    res.json(req.body)

});

// delete
router.delete('/:sid', async (req, res) => {

    const { sid } = req.params;

    const sql = `DELETE FROM \`address_book\` WHERE sid=?`;
    const [result] = await db.query(sql, [sid])

    res.json(result)

})



module.exports = router;