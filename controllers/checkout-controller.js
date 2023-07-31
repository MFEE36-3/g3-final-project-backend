const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const hmacSHA256 = require('crypto-js/hmac-sha256');
const Base64 = require('crypto-js/enc-base64');
const db = require('../models');
const linepay = require('../modules/config').linepay;

const Shop = db.shop;

function createLinePayBody(order) {
    return {
      ...order,
      currency: 'TWD',
      redirectUrls: {
        confirmUrl: `${linepay.return_host}${linepay.return_confirm_url}`,
        cancelUrl: `${linepay.return_host}${linepay.return_cancel_url}`,
      },
    };
  }

  function createSignature(uri, linePayBody) {
    const nonce = new Date().getTime();
    const encrypt = hmacSHA256(
      `${linepay.channel_secret}/${linepay.version}${uri}${JSON.stringify(
        linePayBody,
      )}${nonce}`,
      linepay.channel_secret,
    );
    const signature = Base64.stringify(encrypt);

    const headers = {
      'X-LINE-ChannelId': linepay.channel_id,
      'Content-Type': 'application/json',
      'X-LINE-Authorization-Nonce': nonce,
      'X-LINE-Authorization': signature,
    };
    return headers;
  }

async function linepayCheckout(order) {
    try {
        // 建立 LINE Pay 請求規定的資料格式
        const linePayBody = createLinePayBody(order);
  
        // CreateSignature 建立加密內容
        const uri = '/payments/request';
        const headers = createSignature(uri, linePayBody);
  
        // API 位址
        const url = `${linepay.site}/${linepay.version}${uri}`;
        const linePayRes = await axios.post(url, linePayBody, { headers });
  
        return linePayRes;
    } catch (error) {
       throw error;
    }
}


exports.simpleCheckout = async (req, res) => {
    const transaction = await db.sequelize.transaction();

    try {
        // Extract data from the request
        const { items, address_info, payment_info } = req.body;
        const userId = 'test';

        let total_price = 0;
        let basket = [];
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
            status: payment_info.payment_type === 'wallet'? 1 : 0,
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
        if (payment_info.payment_type === 'linepay') {
            const packages = {
                id: order.order_id,
                amount: total_price,
                products: basket.map((item) => {
                    return {
                        id: item.item_id,
                        name: item.name,
                        quantity: item.amount,
                        price: item.price,
                    }
                }),
            }
            const orderPayload = {
                amount: total_price,
                currency: 'TWD',
                orderId: order.order_id,
                packages: [packages],
            }
            const linepayRes = await linepayCheckout(orderPayload);

            linepayRedirect = linepayRes?.data.info.paymentUrl.web;
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

exports.confirmCheckout = async (req, res) => {
    const { transactionId, orderId } = req.query;

    try {
        // 建立 LINE Pay 請求規定的資料格式
        const uri = `/payments/${transactionId}/confirm`;
        const order = await Shop.orders.findOne({
            where: {
                order_id: orderId
            },
            include: [
                {
                    model: Shop.orderdetail,
                    attributes: ['price', 'amount']
                }
            ]
        });
        const totalPrice = order.orderdetails.reduce((acc, cur) => {
            return acc + (cur.price * cur.amount);
        }, 0);
        const linePayBody = {
          amount: totalPrice,
          currency: 'TWD',
        }
  
        // CreateSignature 建立加密內容
        const headers = createSignature(uri, linePayBody);
  
        // API 位址
        const url = `${linepay.site}/${linepay.version}${uri}`;
        const linePayRes = await axios.post(url, linePayBody, { headers });

        // 請求成功...
        if (linePayRes?.data?.returnCode === '0000') {
            // 更新訂單狀態
            await Shop.orders.update({
                status: 1
            }, {
                where: {
                    order_id: orderId
                }
            });
            res.status(200).send({
                message: "Payment successful!",
                order_id: orderId,
            });
        } else {
            console.error(linePayRes?.data?.returnMessage);
            throw new Error('Payment failed: ' + linePayRes?.data?.returnMessage);
        }
      } catch (error) {
        res.status(400).send({
            message: error.message,
        });
      }
}

exports.cancelCheckout = async (req, res) => {
    const { transactionId, orderId } = req.query;
    res.status(200).send({
        message: "Payment canceled!",
        order_id: orderId,
    });
}
