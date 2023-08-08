const axios = require('axios');
const db = require('../../models');
const linepay = require('../../modules/config').linepay;
const { createSignature } = require('./utils');

const Shop = db.shop;


exports.confirmCheckout = async (req, res) => {
    const { transactionId, orderId } = req.query;
    const transaction = await db.sequelize.transaction();

    try {
        // 建立 LINE Pay 請求規定的資料格式
        const uri = `/payments/${transactionId}/confirm`;
        const order = await Shop.orders.findOne({
            where: {
                order_id: orderId
            }
        });
        const totalPrice = order.amount + order.shipfee;
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
            }, { transaction });
            await transaction.commit();
            res.redirect(linepay.confirm_client_url);
        } else {
            console.error(linePayRes?.data?.returnMessage);
            throw new Error('Payment failed: ' + linePayRes?.data?.returnMessage);
        }
      } catch (error) {
        // Rollback the transaction
        console.error(error.message);
        await transaction.rollback();
        res.redirect(linepay.cancel_client_url);
      }
}

exports.cancelCheckout = async (req, res) => {
    const { transactionId, orderId } = req.query;
    res.redirect(linepay.cancel_client_url);
}
