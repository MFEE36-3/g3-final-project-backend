module.exports = app => {
    var category_router = require('./category');
    var factory_router = require('./factory');
    var item_router = require('./item');
    var checkout_router = require('./checkout');

    var router = require("express").Router();

    router.use('/category', category_router);
    router.use('/factory', factory_router);
    router.use('/item', item_router);
    router.use('/checkout', checkout_router);

    app.use('/ecshop', router);
};
