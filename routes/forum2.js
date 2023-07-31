const express = require("express");
const db = require(__dirname + "/../modules/mysql2");
const dayjs = require("dayjs");
const router = express.Router();
const upload = require(__dirname + "/../modules/img-upload");
const multipartParser = upload.none();

router.get("/forum/:forum_sid", async (req, res) => {
  let output= {forum_data:[],messageData:[]};
  const{forum_sid}=req.params;
  const sql = `SELECT * FROM forum WHERE forum_sid = ${forum_sid} ORDER BY publishedTime DESC`; 
  const [forum_data] = await db.query(sql);

  forum_data.forEach((i) => {
    i.publishedTime = dayjs(i.publishedTime).format("YYYY-MM-DD HH:mm:ss");
  });

  // 查詢對應的留言資料
  const message_sql = `SELECT * FROM message WHERE forum_sid = ${forum_sid}`;
  
  const [messageData] = await db.query(message_sql);

  output = {...output,forum_data,messageData}
  return res.json(output);
});

module.exports = router;
