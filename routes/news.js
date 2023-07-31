const express = require('express');
const db = require(__dirname + '/../modules/mysql2');
const dayjs = require('dayjs');
const router = express.Router();
const upload = require(__dirname + '/../modules/img-upload');
const multipartParser = upload.none();


router.get('/',async(req, res)=>{
    const sql = `SELECT * FROM news WHERE 1`
    const [data] = await db.query(sql)
    return res.json(data)
    
    
})


module.exports = router;