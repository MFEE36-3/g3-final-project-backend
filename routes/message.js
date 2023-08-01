const express = require("express");
const db = require(__dirname + "/../modules/mysql2");
const dayjs = require("dayjs");
const router = express.Router();
const upload = require(__dirname + "/../modules/img-upload");
const multipartParser = upload.none();

router.get("/", async (req, res) => {
  const sql = `
    SELECT 
        m.message_sid,
        m.publishedTime,
        m.user_id,
        m.forum_sid,
        m.comment_content,
        f.header,
        f.content as forum_content,
        f.photo as forum_photo,
        mi.sid as user_id,
        mi.nickname,
        mi.photo as user_photo,
        c.comment_count
    FROM message m
    JOIN forum f ON m.forum_sid = f.forum_sid
    JOIN member_info mi ON m.user_id = mi.sid
    JOIN (
        SELECT forum_sid, COUNT(comment_content) AS comment_count
        FROM message
        GROUP BY forum_sid
    ) c ON m.forum_sid = c.forum_sid
    WHERE 1;
  `;
  
  try {
    const [messages] = await db.query(sql);
    console.log(messages);
    return res.json(messages);
  } catch (error) {
    console.error("Error fetching data:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
