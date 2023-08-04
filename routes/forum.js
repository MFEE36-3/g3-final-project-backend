const express = require("express");
const db = require(__dirname + "/../modules/mysql2");
const dayjs = require("dayjs");
const router = express.Router();
const upload = require(__dirname + "/../modules/img-upload");
const multipartParser = upload.none();
const forumUploadImg = require(__dirname + "/../modules/forumupload");
const multer = require("multer");

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
      f.forum_sid,
      f.header,
      f.content AS forum_content,
      f.photo AS forum_photo,
      mi.sid AS member_sid,
      mi.nickname,
      mi.photo AS user_photo
  FROM forum f
  JOIN member_info mi ON f.user_id = mi.sid;
  
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
router.post("/add", forumUploadImg.single("preImg"), async (req, res) => {
  let output = {
    success: true,
  };
  console.log(req.file);
  let photo = "";
  if (req.file && req.file.filename) {
    photo = req.file.filename;
  }
  const { header, content, user_id } = req.body;
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
// router.post("/previewImg", forumUploadImg.single("preImg"), async (req, res) => {
//   // const filename = req.file.filename
//   let output = {
//     success: true,
//   };

//   const { header, content, photo, user_id } = req.body;
//   // 將文章資料插入到資料庫中
//   const sql = `
//     INSERT INTO forum (header, content, photo, user_id, publishedTime)
//     VALUES (?,?,?,?,NOW())`;
//   try {
//     await db.query(sql, [header, content, photo, user_id]);
//     return res.json(output);
//   } catch (error) {
//     console.error(error);
//     output.success = false;
//     return res.json(output);
//   }
//   res.json(req.file);
//   console.log(req.file);
// });
router.get("/forum/:forum_sid", async (req, res) => {
  const { forum_sid } = req.params;

  // 查詢論壇資料
  const forum_sql = `
  SELECT 
  f.forum_sid,
  f.header,
  f.content AS forum_content,
  f.photo AS forum_photo,
  mi.sid AS member_sid,
  mi.nickname,
  mi.photo AS user_photo
FROM forum f
JOIN member_info mi ON f.user_id = mi.sid
WHERE f.forum_sid = ${forum_sid}`;
  const [forum_data] = await db.query(forum_sql);

  forum_data.forEach((i) => {
    i.publishedTime = dayjs(i.publishedTime).format("YYYY-MM-DD HH:mm:ss");
  });

  // 查詢對應的留言資料 ----****
  const message_sql = `SELECT 
    m.message_sid,
    m.publishedTime,
    m.user_id,
    m.forum_sid,
    m.comment_content,
    mi.sid AS member_sid,
    mi.nickname,
    mi.photo
  FROM 
    message m
  JOIN 
    member_info mi ON m.user_id = mi.sid
  WHERE m.forum_sid = ${forum_sid}`;
  const [messageData] = await db.query(message_sql);

  // 合併論壇資料和留言資料到 output 物件
  const output = {
    forum_data: forum_data,
    messageData: messageData,
  };

  return res.json(output);
});

router.get("/message", async (req, res) => {
  console.log(req.query.forum_keyword);

  let where = " where 1 ";
  let order = "";

  const keyword = req.query.forum_keyword || "";
  const orderBy = req.query.forum_orderBy || "";
  console.log(orderBy);
  const page = parseInt(req.query.forum_page) || 1;
  const limit = 100;
  const offset = (page - 1) * limit;

  if (keyword) {
    const kw_escaped = db.escape("%" + keyword + "%");
    where += `AND f.header LIKE ${kw_escaped} OR f.content LIKE ${kw_escaped}`;
  }

  if (orderBy) {
    order = `ORDER BY f.publishedTime ${orderBy}`;
  }
  const sql = `
  SELECT 
  f.forum_sid,
  f.header,
  f.publishedTime,
  f.content AS forum_content,
  f.photo AS forum_photo,
  mi.sid AS member_sid,
  mi.nickname,
  mi.photo AS user_photo,
  COALESCE(c.comment_count, 0) AS comment_count,
  COALESCE(l.like_count, 0) AS like_count
FROM forum f
JOIN member_info mi ON f.user_id = mi.sid
LEFT JOIN (
    SELECT forum_sid, COUNT(comment_content) AS comment_count
    FROM message
    GROUP BY forum_sid
) c ON f.forum_sid = c.forum_sid
LEFT JOIN (
    SELECT forum_sid, COUNT(like_sid) AS like_count
    FROM forum_like
    GROUP BY forum_sid
) l ON f.forum_sid = l.forum_sid
${where}
${order}
LIMIT ${offset}, ${limit}
`;

  const [article] = await db.query(sql);

  // let searchResult = [];

  res.json(article);
  console.log(article);
});
// 新增留言的api
router.post("/addmessage", multipartParser, async (req, res) => {
  let output = {
    success: true,
  };

  const { user_id, comment_content } = req.body;
  // 將留言資料插入到資料庫中
  const sql = `
    INSERT INTO message ( user_id ,comment_content , publishedTime)
    VALUES (?,?,NOW())`;
  try {
    await db.query(sql, [user_id, comment_content]);
    return res.json(output);
  } catch (error) {
    console.error(error);
    output.success = false;
    return res.json(output);
  }
});
//處理蒐藏愛心的API
router.post("/handle-like-list", async (req, res) => {
  let output = {
    success: true,
  };
  let member = "";
  if (res.locals.jwtData) {
    member = res.locals.jwtData.id;
  }
  const receiveData = req.body.data;

  console.log(receiveData);

  let deleteLike = [];
  let addLike = [];
  //確定該會員有經過jwt認證並且有傳資料過來，才去資料庫讀取資料
  if (member && receiveData.length > 0) {
    const sql_prelike = `SELECT forum_sid FROM forum_favorite WHERE member_sid="${member}"`;
    const [prelike_rows] = await db.query(sql_prelike);
    const preLikeRestaurants = prelike_rows.map((v) => {
      return v.rest_sid;
    });

    //將收到前端的資料與原先該會員收藏列表比對，哪些是要被刪除，哪些是要被增加
    deleteLike = receiveData
      .filter((v) => preLikeRestaurants.includes(v.forum_sid))
      .map((v) => `"${v.forum_sid}"`);
    addLike = receiveData.filter(
      (v) => !preLikeRestaurants.includes(v.forum_sid)
    );
  }

  if (deleteLike.length > 0) {
    const deleteItems = deleteLike.join(", ");
    const sql_delete_like = `DELETE FROM forum_favorite WHERE member_sid="${member}" AND forum_sid IN (${deleteItems})`;
    const [result] = await db.query(sql_delete_like);
    output.success = !!result.affectedRows;
  }

  if (addLike.length > 0) {
    const sql_add_like = ` INSERT INTO forum_favorite(member_sid, forum_sid, date ) VALUES ?`;
    const insertLike = addLike.map((v) => {
      return [member, v.rest_sid, res.toDatetimeString(v.time)];
    });

    const [result] = await db.query(sql_add_like, [insertLike]);
    output.success = !!result.affectedRows;
  }
  res.json(output);
});
//讀取收藏清單API
router.get("/show-like", async (req, res) => {
  let output = {
    success: true,
    likeDatas: [],
  };

  let member = "";
  if (res.locals.jwtData) {
    member = res.locals.jwtData.id;
  }

  let likeDatas = [];
  if (member) {
    const sql_likeList = `SELECT
    r.rest_sid,
    r.name,
    r.city,
    r.area,
    (SELECT ru.rule_name FROM restaurant_associated_rule AS ar_sub
    JOIN restaurant_rule AS ru ON ar_sub.rule_sid = ru.rule_sid
    WHERE ar_sub.rest_sid = r.rest_sid
    LIMIT 1) AS rule_name,
    GROUP_CONCAT(DISTINCT s.service_name) AS service_names,
    (SELECT img_name FROM restaurant_img WHERE rest_sid = r.rest_sid LIMIT 1) AS img_name,
    MAX(rl.date) AS date
    FROM
    restaurant_information AS r
    JOIN restaurant_associated_rule AS ar ON r.rest_sid = ar.rest_sid
    JOIN restaurant_associated_service AS asr ON r.rest_sid = asr.rest_sid
    JOIN restaurant_service AS s ON asr.service_sid = s.service_sid
    JOIN restaurant_img AS ri ON r.rest_sid = ri.rest_sid
    JOIN restaurant_like AS rl ON r.rest_sid = rl.rest_sid
    WHERE rl.member_sid = '${member}'
GROUP BY
r.rest_sid,
r.name,
r.city,
r.area
ORDER BY
date DESC`;

    [likeDatas] = await db.query(sql_likeList);
    likeDatas.forEach((v) => {
      v.date = res.toDateString(v.date);
    });
  }
  console.log(likeDatas);
  output = {
    ...output,
    likeDatas,
  };
  return res.json(output);
});
//刪除收藏清單的APIjwtData

router.delete("/likelist/:rid", async (req, res) => {
  let output = {
    success: true,
    likeDatas: [],
  };

  let member = "";
  if (res.locals.jwtData) {
    member = res.locals.jwtData.id;
  }
  const { rid } = req.params;
  let sql_deleteLikeList = "DELETE FROM `restaurant_like` WHERE ";

  if (rid === "all") {
    sql_deleteLikeList += `member_sid = '${member}'`;
  } else {
    sql_deleteLikeList += `member_sid = '${member}' AND rest_sid='${rid}'`;
  }

  try {
    const [result] = await db.query(sql_deleteLikeList);
    res.json({ ...result });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "An error occurred" });
  }
});

module.exports = router;
