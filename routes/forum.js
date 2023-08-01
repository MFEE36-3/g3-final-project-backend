const express = require("express");
const db = require(__dirname + "/../modules/mysql2");
const dayjs = require("dayjs");
const router = express.Router();
const upload = require(__dirname + "/../modules/img-upload");
const multipartParser = upload.none();

// 取得所有留言及論壇資料的路由
router.get("/", async (req, res) => {
  console.log(req.query.forum_keyword);
  try {
    const query = "SELECT * FROM forum;";
    const [result, fields] = await db.query(query);
    // 獲取前端傳遞過來的關鍵字參數
    const keyword = req.query.forum_keyword;
    if (keyword) {
      const kw_escaped = db.escape("%" + keyword + "%");
      const searchSql = `
        SELECT * FROM forum
        WHERE header LIKE ${kw_escaped}
        OR content LIKE ${kw_escaped}
      `;
      const [searchResult] = await db.query(searchSql);
      console.log(searchResult);

      // 查詢所有留言資料及論壇資料
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
        WHERE f.header LIKE ${kw_escaped}
        OR f.content LIKE ${kw_escaped}
      `;
      const [messages] = await db.query(sql);

      return res.json({ messages, searchResult });
    } else {
      return res.json(result);
    }
  } catch (error) {
    console.error("Error fetching data:", error);
    return res
      .status(500)
      .json({ error: "從 forum 表格獲取數據失敗", message: error.message });
  }
});

// 新增文章的api
router.post("/add", multipartParser, async (req, res) => {
  let output = {
    success: true,
  };

  const { header, content, photo, user_id } = req.body;
  // 將文章資料插入到資料庫中
  const sql = `
    INSERT INTO forum (header, content, photo, user_id, publishedTime)
    VALUES (?,?,?,?,NOW())`;
  try {
    await db.query(sql, [header, content, photo, user_id]);
    return res.json(output);
  } catch (error) {
    console.error(error);
    output.success = false;
    return res.json(output);
  }
});
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
router.get("/message", async (req, res) => {
 
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
  
  const [messages] = await db.query(sql);

  
  const keyword = req.query.forum_keyword;
  let searchResult = [];
  if (keyword) {
    const kw_escaped = db.escape("%" + keyword + "%");
    const searchSql = `
      SELECT * FROM forum
      WHERE header LIKE ${kw_escaped}
      OR content LIKE ${kw_escaped}
    `;
    [searchResult] = await db.query(searchSql);
  } 

  res.json({ messages, searchResult });
});
module.exports = router;
