const express = require('express');
const db = require(__dirname + '/../modules/mysql2');
const dayjs = require('dayjs');
const router = express.Router();
const upload = require(__dirname + '/../modules/img-upload');
const multipartParser = upload.none();


router.get('/',async(req, res)=>{
    const sql = `SELECT * FROM news WHERE 1`
    const [data] = await db.query(sql)
    return res.json(data)
})
const getListData = async (req) => {
    let output = {
      redirect: "",
      totalRows: 0,
      perPage: 18, // 每頁顯示的新聞筆數
      totalPages: 0,
      page: 1,
      rows: [],
      randomData: [],
    };
  
    const perPage = 18; // 每頁顯示的新聞筆數
    let keyword = req.query.keyword || "";
    let page = req.query.page ? parseInt(req.query.page) : 1;
    if (!page || page < 1) {
      output.redirect = req.baseUrl;
      return output;
    }
  
    let where = " WHERE 1 ";
  
    const t_sql = `SELECT COUNT(1) totalRows FROM news ${where}`;
    const random_sql = `SELECT * FROM news ${where} ORDER BY RAND() LIMIT 1;`;
    const [randomData] = await db.query(random_sql);
    const [[{ totalRows }]] = await db.query(t_sql);
    let totalPages = 0;
    let rows = [];
    if (totalRows) {
      totalPages = Math.ceil(totalRows / perPage);
      if (page > totalPages) {
        output.redirect = req.baseUrl + "?page=" + totalPages;
        return output;
      }
      const sql = ` SELECT * FROM news ${where} LIMIT ${
        perPage * (page - 1)
      }, ${perPage}`;
      [rows] = await db.query(sql);
    }
    output = {
      ...output,
      totalRows,
      perPage,
      totalPages,
      page,
      rows,
      keyword,
      randomData,
    };
    return output;
  };
  
  router.get("/demo", async (req, res) => {
    const output = await getListData(req);
    console.log(output);
    res.json(output);
  });
  router.get("/article", async (req, res) => {
    const output = await getListData(req);
    output.rows.forEach((i) => {
      i.publishedTime = dayjs(i.publishedTime).format("YYYY-MM-DD HH:mm:ss");
    });
    console.log(output);
    res.json(output);
  });
  router.get("/new", async (req, res) => {
    const output = await getListData1(req);
    console.log(output);
    res.json(output);
  });
  router.get("/news/:news_sid", async (req, res) => {
    const news_sid = req.params.news_sid;
    const sql = `SELECT * FROM news WHERE news_sid = ?;`;
    const [data] = await db.query(sql, [news_sid]);
    data.forEach((i) => {
      i.publishedTime = dayjs(i.publishedTime).format("YYYY-MM-DD HH:mm:ss");
    });
    res.json(data);
  });
  router.get("/rand", async (req, res) => {
    const r_sql = `SELECT * FROM news ORDER BY RAND() LIMIT 4`;
    const [rand] = await db.query(r_sql);
    res.json(rand);
    console.log(rand);
  });
  router.get("/rand2", async (req, res) => {
      const r_sql2 = `SELECT * FROM news ORDER BY RAND() LIMIT 2`;
      const [rand2] = await db.query(r_sql2);
      res.json(rand2);
      console.log(rand2);
    });
module.exports = router;