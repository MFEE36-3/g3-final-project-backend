const express = require("express");
const db = require(__dirname + "/../modules/mysql2");
const dayjs = require("dayjs");
const router = express.Router();
const upload = require(__dirname + "/../modules/img-upload");
const multipartParser = upload.none();

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
      return res.json(searchResult);
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
router.post("/forum",multipartParser, async (req, res) => {
  let output={
    success:true,
  };
  
    const { header, content, photo, user_id } = req.body;
    // const publishedTime = dayjs().format("YYYY-MM-DD HH:mm:ss");

    // 將文章資料插入到資料庫中
    const sql = `
      INSERT INTO forum (header, content, photo, user_id, publishedTime)
      VALUES (?,?,?,?,NOW())`;
    try{
      await db.query(sql, [header, content, photo, user_id]);
      return res.json(output);
    }catch(error){
      console.error(error);
      output.success = false;
      return res.json(output);
    }
   

    // // 檢查是否成功插入文章
    // if (result.affectedRows === 1) {
    //   res.json({ success: true, message: "文章新增成功" });
    // } else {
    //   res.json({ success: false, message: "文章新增失敗" });
    // }
  
    // console.error("新增文章時發生錯誤:", error);
    // res.status(500).json({ success: false, message: "伺服器錯誤" });
  
});

module.exports = router;
