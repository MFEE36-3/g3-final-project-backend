var express = require('express');
var router = express.Router();
var cateController = require('../../controllers/cate-controller');


//Get specify client
router.get('/:cat_id',cateController.getCategory);
//Get client list
router.get('/',cateController.getCategories);



module.exports = router;
