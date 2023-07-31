const express = require("express");
const db = require(__dirname + "/../modules/mysql2");
const dayjs = require("dayjs");
const router = express.Router();
const upload = require(__dirname + "/../modules/img-upload");
const multipartParser = upload.none();

router.get("/", async (req, res) => {
  const mes_sql = `SELECT *
  FROM message
  WHERE article_sid = ?`;
  ;

  const [message] = await db.query(mes_sql);
  console.log(message);
  return res.json(message);
  
});

module.exports = router;
