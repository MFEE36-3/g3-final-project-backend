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
router.post("/forum", multipartParser, async (req, res) => {
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

module.exports = router;
