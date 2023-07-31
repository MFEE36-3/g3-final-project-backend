const express = require("express");
const db = require(__dirname + "/../modules/mysql2");
const dayjs = require("dayjs");
const router = express.Router();
const upload = require(__dirname + "/../modules/img-upload");
const multipartParser = upload.none();


router.get("/", async (req, res) => {
  console.log(req.query.forum_keyword)
  try {
    const query = "SELECT * FROM forum;";
    const [result, fields] = await db.query(query);

    // 獲取前端傳遞過來的關鍵字參數
    const keyword = req.query.forum_keyword;
    if (keyword) {
      const kw_escaped = db.escape('%'+keyword+'%');
      // const searchSql = `
      //   SELECT * FROM forum
      //   WHERE header LIKE ${kw_escaped}
      //   OR content LIKE ${kw_escaped}
      //   OR nickname LIKE ${kw_escaped}
      // `;
      const searchSql = `
        SELECT * FROM forum
        WHERE header LIKE ${kw_escaped}
        OR content LIKE ${kw_escaped}
      `;
      const [searchResult] = await db.query(searchSql);
      console.log(searchResult)
      return res.json(searchResult);
    } else {
      return res.json(result);
    }
  } catch (error) {
    console.error("Error fetching data:", error);
    return res.status(500).json({ error: "從 forum 表格獲取數據失敗", message: error.message });
  }
  
});


// router.get("/:keyword", async (req, res) => {
//   console.log(req.query.forum_keyword)
//   try {
//     const query = "SELECT * FROM forum;";
//     const [result, fields] = await db.query(query);

//     // 獲取前端傳遞過來的關鍵字參數
//     const keyword = req.query.forum_keyword;
//     if (keyword) {
//       const kw_escaped = db.escape('%'+keyword+'%');
//       // const searchSql = `
//       //   SELECT * FROM forum
//       //   WHERE header LIKE ${kw_escaped}
//       //   OR content LIKE ${kw_escaped}
//       //   OR nickname LIKE ${kw_escaped}
//       // `;
//       const searchSql = `
//         SELECT * FROM forum
//         WHERE header LIKE ${kw_escaped}
//         OR content LIKE ${kw_escaped}
//       `;
//       const [searchResult] = await db.query(searchSql);
//       console.log(searchResult)
//       return res.json(searchResult);
//     } else {
//       return res.json(result);
//     }
//   } catch (error) {
//     console.error("Error fetching data:", error);
//     return res.status(500).json({ error: "從 forum 表格獲取數據失敗", message: error.message });
//   }
  
// });

module.exports = router;
