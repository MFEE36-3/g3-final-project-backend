const express = require("express");
const db = require(__dirname + "/../modules/mysql2");
const dayjs = require("dayjs");
const router = express.Router();
const upload = require(__dirname + "/../modules/img-upload");
const multipartParser = upload.none();

router.get("/forum/:forum_sid", async (req, res) => {
  const { forum_sid } = req.params;

  // 查詢論壇資料
  const forum_sql = `SELECT * FROM forum WHERE forum_sid = ${forum_sid} ORDER BY publishedTime DESC`; 
  const [forum_data] = await db.query(forum_sql);

  forum_data.forEach((i) => {
    i.publishedTime = dayjs(i.publishedTime).format("YYYY-MM-DD HH:mm:ss");
  });

  // 查詢對應的留言資料
  const message_sql = `SELECT 
    m.message_sid,
    m.publishedTime,
    m.user_id,
    m.forum_sid,
    m.comment_content,
    mi.sid AS member_sid,
    mi.nickname
  FROM 
    message m
  JOIN 
    member_info mi ON m.user_id = mi.sid
  WHERE m.forum_sid = ${forum_sid}`;
  const [messageData] = await db.query(message_sql);

  // 合併論壇資料和留言資料到 output 物件
  const output = {
    forum_data: forum_data,
    messageData: messageData
  };

  return res.json(output);
});

module.exports = router;
