const express = require("express");
const db = require(__dirname + "/../modules/mysql2");
const dayjs = require("dayjs");
const router = express.Router();
const upload = require(__dirname + "/../modules/img-upload");
const multipartParser = upload.none();

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
