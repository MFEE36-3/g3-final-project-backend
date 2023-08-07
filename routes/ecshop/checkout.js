var express = require('express');
var router = express.Router();
var checkoutController = require('../../controllers/checkout/checkout-controller');
var linepayController = require('../../controllers/checkout/linepay-controller');
var topupController = require('../../controllers/checkout/topup-controller');


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
router.post('/buyforme', checkoutController.buyForMeCheckout);
router.post('/easytopup', topupController.easy_topup);
router.post('/linepaytopup', topupController.linepay_topup);

module.exports = router;
