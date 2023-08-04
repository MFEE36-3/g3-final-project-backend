var express = require('express');
var router = express.Router();
var checkoutController = require('../../controllers/checkout-controller');


router.get('/linepay/confirm', checkoutController.confirmCheckout);
router.get('/linepay/cancel', checkoutController.cancelCheckout);

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
