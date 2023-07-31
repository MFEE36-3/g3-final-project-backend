var express = require('express');
var router = express.Router();
var itemController = require('../../controllers/item-controller');


//Get specify client
router.get('/:item_id',itemController.getItem);
//Get client list
router.get('/',itemController.getItems);



module.exports = router;
