var express = require('express');
var router = express.Router();
var checkoutController = require('../../controllers/checkout/checkout-controller');
var linepayController = require('../../controllers/checkout/linepay-controller');


router.get('/linepay/confirm', linepayController.confirmCheckout);
router.get('/linepay/cancel', linepayController.cancelCheckout);

router.use((req, res, next) => {
    if (!res.locals.jwtData) {
        return res.status(400).json({
            success: false,
            error: "請先登入會員"
        });
    }
    next();
});
router.post('/', checkoutController.simpleCheckout);

module.exports = router;
