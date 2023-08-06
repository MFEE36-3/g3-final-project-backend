const { v4: uuidv4 } = require('uuid');
const db = require('../../models');
const { linepayRequest } = require('./utils');
const linepay = require('../../modules/config').linepay;


const Member = db.member;

exports.linepay_topup = async (req, res) => {
    const { amount } = req.body;
    const member_id = res.locals.jwtData.id;
    const transaction = await db.sequelize.transaction();

    try {
        const member = await Member.member_info.findOne({
            where: {
                sid: member_id
            }
        });

        if (!member) {
            return res.status(400).json({
                success: false,
                error: "會員不存在"
            });
        }

        await Member.member_wallet_record.create({
            member_id: member_id,
            amount: amount,
            content: `儲值 ${amount} 元`,
        }, {
            transaction
        });

        const total_price_discount = amount;
        const flat_products = {
            id: uuidv4(),
            name: '儲值 ' + amount + ' 元',
            quantity: 1,
            price: total_price_discount,   
        }
    
        const packages = {
            id: uuidv4(),
            amount: total_price_discount,
            products: [flat_products]
        }
    
        const orderPayload = {
            amount: total_price_discount,
            currency: 'TWD',
            orderId: uuidv4(),
            packages: [packages],
        }
        const linepayRes = await linepayRequest(orderPayload, linepay.confirm_client_url, linepay.cancel_client_url);

        if (linepayRes?.data?.returnCode !== '0000') {
            throw new Error('Payment failed: ' + linepayRes?.data?.returnMessage);
        }
        linepayRedirect = linepayRes?.data.info.paymentUrl.web;

        await Member.member_info.update({
            wallet: member.wallet + amount
        }, {
            where: {
                sid: member_id
            }
        }, { transaction });

        await transaction.commit();
        res.status(200).send({
            message: "Order created successful!",
            linepay_redirect: linepayRedirect
        });
    } catch (error) {
        await transaction.rollback();
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

exports.easy_topup = async (req, res) => {
    const { amount } = req.body;
    const member_id = res.locals.jwtData.id;
    const transaction = await db.sequelize.transaction();

    try {
        const member = await Member.member_info.findOne({
            where: {
                sid: member_id
            }
        });

        if (!member) {
            return res.status(400).json({
                success: false,
                error: "會員不存在"
            });
        }

        await Member.member_wallet_record.create({
            member_id: member_id,
            amount: amount,
            content: `儲值 ${amount} 元`,
        }, {
            transaction
        });

        await Member.member_info.update({
            wallet: member.wallet + amount
        }, {
            where: {
                sid: member_id
            }
        }, { transaction });

        await transaction.commit();
        return res.status(200).json({
            success: true,
            message: "儲值成功"
        });
    } catch (error) {
        await transaction.rollback();
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}