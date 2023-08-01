var express = require('express');
var router = express.Router();
var factoryController = require('../../controllers/factory-controller');


//Get specify client
router.get('/:factory_id',factoryController.getFactory);
//Get client list
router.get('/',factoryController.getFactories);



module.exports = router;
