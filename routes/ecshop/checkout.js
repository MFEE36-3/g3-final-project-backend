var express = require('express');
var router = express.Router();
var checkoutController = require('../../controllers/checkout-controller');


router.post('/', checkoutController.simpleCheckout);
router.get('/linepay/confirm', checkoutController.confirmCheckout);
router.get('/linepay/cancel', checkoutController.cancelCheckout);


module.exports = router;
