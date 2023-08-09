const { v4: uuidv4 } = require('uuid');
const db = require('../../models');
const { linepayRequest } = require('./utils');


const Shop = db.shop;
const Member = db.member;
const BFM = db.buyforme;


async function getCoupon(member_id, get_coupon_sid) {
    try {
        const coupon = await Member.user_coupon.findOne({
            where: {
                member_id: member_id,
                get_coupon_sid: get_coupon_sid,
                coupon_status_sid: 1
            },
            include: [
                {
                    model: Member.coupon,
                    attributes: ['coupon_discount']
                }
            ]
        });


        if (!coupon) {
            throw new Error('Invalid coupon');
        }

        return coupon;
    } catch (error) {
        throw error;
    }
}

async function linepayCheckout(basket, order, total_price, discount = 0, shipfee = 60) {
    const total_price_discount = total_price - discount + shipfee;
    const flat_products = {
        id: basket[0].item_id,
        name: basket[0].name + ' 等商品',
        quantity: 1,
        price: total_price_discount,   
    }

    const packages = {
        id: order.order_id,
        amount: total_price_discount,
        products: [flat_products]
    }

    const orderPayload = {
        amount: total_price_discount,
        currency: 'TWD',
        orderId: order.order_id,
        packages: [packages],
    }
    const linepayRes = await linepayRequest(orderPayload);

    if (linepayRes?.data?.returnCode !== '0000') {
        throw new Error('Payment failed: ' + linepayRes?.data?.returnMessage);
    }
    linepayRedirect = linepayRes?.data.info.paymentUrl.web;
    return linepayRedirect;
}

async function walletCheckout(order, total_price, discount = 0, shipfee = 60) {
    const total_price_discount = total_price - discount + shipfee;
    const member = await Member.member_info.findOne({
        where: {
            sid: order.member_id
        }
    });

    if (member.wallet < total_price_discount + shipfee) {
        throw new Error('Not enough money');
    }

    return;
}

exports.simpleCheckout = async (req, res) => {
    const transaction = await db.sequelize.transaction();

    try {
        // Extract data from the request
        const { items, address_info, payment_info } = req.body;
        const userId = res.locals.jwtData.id;

        let total_price = 0;
        let basket = [];
        let discount = 0;
        let shipfee = payment_info.shipfee || 60;

        // Get member
        const member = await Member.member_info.findOne({
            where: {
                sid: userId
            }
        });

        // If member level > 1, shipfee = 0
        if (member.level > 1) {
            shipfee = 0;
        }

        // Get coupon
        if (payment_info.coupon_sid) {
            const coupon = await getCoupon(userId, payment_info.coupon_sid);
            discount = coupon.coupon.coupon_discount;
        }

        for (const item of items) {
            const item_detail = await Shop.item.findOne({
                where: {
                    item_id: item.item_id
                }
            }, { transaction });

            if (!item_detail) {
                throw new Error('Invalid item');
            }

            total_price += item_detail.price * item.amount;
            basket.push({
                item_id: item.item_id,
                name: item_detail.item_name,
                price: item_detail.price,
                amount: item.amount
            })
        }


        const payment = await Shop.payments.create({
            payment_id: uuidv4(),
            member_id: userId,
            payment_type: payment_info.payment_type,
            provider: payment_info.provider || '',
            account_identifier: 'test',
            payment_gateway_token: 'test'
        }, { transaction });

        const address = await Shop.addresses.create({
            address_id: uuidv4(),
            member_id: userId,
            name: address_info.name,
            address: address_info.address || "",
            phone_number: address_info.phone_number || "",
        }, { transaction });

        // If payment is successful, create the order
        const order = await Shop.orders.create({
            order_id: uuidv4(),
            address_id: address.address_id,
            payment_id: payment.payment_id,
            member_id: userId,
            coupon_sid: payment_info.coupon_sid || null,
            status: payment_info.payment_type === 'wallet'? 1 : 0,
            amount: total_price - discount,
            shipfee: shipfee
        }, { transaction });

        // Create the order items
        for (const item of basket) {
            await Shop.orderdetail.create({
                order_id: order.order_id,
                item_id: item.item_id,
                price: item.price,
                amount: item.amount
            }, { transaction });
        }

        let linepayRedirect = null;
        switch (payment_info.payment_type) {
            case 'linepay':
                linepayRedirect = await linepayCheckout(basket, order, total_price, discount, shipfee);
                break;
            case 'wallet':
                // update wallet
                await walletCheckout(order, total_price, discount, shipfee);
                await Member.member_info.update({
                    wallet: member.wallet - (total_price + discount + shipfee)
                }, {
                    where: {
                        sid: userId
                    }
                }, { transaction });
                await Member.member_wallet_record.create({
                    member_id: userId,
                    amount: -(total_price + discount + shipfee),
                    content: `購買 ${basket[0].name} 等商品`,
                }, {
                    transaction
                });
                break;
            default:
                break;
        }

        if (payment_info.coupon_sid) {
            // update coupon status
            await Member.user_coupon.update({
                coupon_status_sid: 2,
                coupon_use_time: new Date()
            }, {
                where: {
                    member_id: userId,
                    get_coupon_sid: payment_info.coupon_sid
                }
            }, { transaction });
        }

        // Commit the transaction
        await transaction.commit();

        res.status(200).send({
            message: "Order created successful!",
            order_id: order.order_id,
            linepay_redirect: linepayRedirect
        });
    } catch (error) {
        // Rollback the transaction
        await transaction.rollback();

        res.status(400).send({
            error: error.message
        });
    }
}

exports.buyForMeCheckout = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    const { open_sid, nickname, mobile_number, order_amount, order_instructions, items, payment_info } = req.body;
    const userId = res.locals.jwtData.id;
    let { payment_type, coupon_sid, shipfee } = payment_info;
    /*
        items: [
            {
                order_food: 1,
                order_quantity: 1,
                order_price: 100
            },
            {
                order_food: 2,
                order_quantity: 2,
                order_price: 200
            }
        ]

        "payment_info": {
            "payment_type": "wallet",
            "coupon_sid": 1 | null,
            "shipfee": 60 | null (default 60)
        }
    }
    */

    try {
        // Get member
        const member = await Member.member_info.findOne({
            where: {
                sid: userId
            }
        });

        // If member level > 1, shipfee = 0
        if (member.level > 1) {
            shipfee = 0;
        }

        let discount = 0;
        // Get coupon
        if (coupon_sid) {
            const coupon = await getCoupon(userId, coupon_sid);
            discount = coupon.coupon.coupon_discount;
        }

        const total_price = order_amount - discount + shipfee;
        // Check if the wallet is enough
        if (payment_type === 'wallet' && member.wallet < total_price) {
            throw new Error('Not enough money');
        }

        // Create the order
        const order = await BFM.buy_for_me.create({
            open_sid: open_sid,
            order_member_id: userId,
            nickname: nickname,
            mobile_number: mobile_number,
            order_amount: total_price,
            order_time: new Date(),
            order_status: payment_type === 'wallet'? 1 : 0,
            order_instructions: order_instructions
        }, { transaction });

        // Create the order items
        for (const item of items) {
            await BFM.buy_for_me_detail.create({
                order_sid: order.order_sid,
                order_food: item.order_food,
                order_quantity: item.order_quantity,
                order_price: item.order_price
            }, { transaction });
        }

        if (payment_type === 'wallet') {
            // update wallet
            await Member.member_info.update({
                wallet: member.wallet - total_price
            }, {
                where: {
                    sid: userId
                }
            }, { transaction });

        }

        // Commit the transaction
        await transaction.commit();

        res.status(200).send({
            message: "Order created successful!",
            order_sid: order.order_sid
        });
    } catch (error) {
        // Rollback the transaction
        await transaction.rollback();

        res.status(400).send({
            error: error.message
        });
    }
}

exports.foodCheckout = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    const { shop_id, amount, order_date, order_time, foods, payment_info } = req.body;
    const userId = res.locals.jwtData.id;
    let { coupon_sid, shipfee } = payment_info;
    /*
        foods: [
            {
                food_id: 1,
                order_item: "name",
                order_num: 1,
                price: 100
            },
            {
                food_id: 2,
                order_item: "name",
                order_num: 1,
                price: 100
            }
        ]
    }
    */

    try {
        // Get member
        const member = await Member.member_info.findOne({
            where: {
                sid: userId
            }
        });

        // If member level > 1, shipfee = 0
        if (member.level > 1) {
            shipfee = 0;
        }

        let discount = 0;
        // Get coupon
        if (coupon_sid) {
            const coupon = await getCoupon(userId, coupon_sid);
            discount = coupon.coupon.coupon_discount;
        }

        const total_price = amount - discount + shipfee;
        // Check if the wallet is enough
        if (member.wallet < total_price) {
            throw new Error('Not enough money');
        }

        // Create the order
        const order = await Shop.food_orders.create({
            shop_id: shop_id,
            Id: userId,
            amount: total_price,
            order_date: order_date,
            order_time: order_time,
            status: 0,
        }, { transaction });

        if (!order.sid) {
            throw new Error('Order create failed');
        }

        // Create the order items
        for (const food of foods) {
            await Shop.food_order_detail.create({
                order_id: order.sid,
                food_id: food.food_id,
                order_item: food.order_item,
                order_num: food.order_num,
                price: food.price
            }, { transaction });
        }

        // update wallet
        await Member.member_info.update({
            wallet: member.wallet - total_price
        }, {
            where: {
                sid: userId
            }
        }, { transaction });

        await Member.member_wallet_record.create({
            member_id: userId,
            amount: -(total_price + discount + shipfee),
            content: `購買 ${foods[0].order_item} 等商品`,
        }, {
            transaction
        });

        if (coupon_sid) {
            // update coupon status
            await Member.user_coupon.update({
                coupon_status_sid: 2,
                coupon_use_time: new Date()
            }, {
                where: {
                    member_id: userId,
                    get_coupon_sid: coupon_sid
                }
            }, { transaction });
        }

        // Commit the transaction
        await transaction.commit();

        res.status(200).send({
            message: "Food order create successful!",
            order_sid: order.sid
        });
    } catch (error) {
        // Rollback the transaction
        await transaction.rollback();

        res.status(400).send({
            error: error.message
        });
    }
}