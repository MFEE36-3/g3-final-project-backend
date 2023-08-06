const axios = require('axios');
const hmacSHA256 = require('crypto-js/hmac-sha256');
const Base64 = require('crypto-js/enc-base64');
const linepay = require('../../modules/config').linepay;


function createLinePayBody(order, confirm_url = null, cancel_url = null) {
    confirm_url = confirm_url || `${linepay.return_host}${linepay.return_confirm_url}`;
    cancel_url = cancel_url || `${linepay.return_host}${linepay.return_cancel_url}`;
    return {
      ...order,
      currency: 'TWD',
      redirectUrls: {
        confirmUrl: confirm_url,
        cancelUrl: cancel_url,
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

async function linepayRequest(order, confirm_url = null, cancel_url = null) {
    try {
        // 建立 LINE Pay 請求規定的資料格式
        const linePayBody = createLinePayBody(order, confirm_url, cancel_url);
  
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

module.exports = {
    linepayRequest,
    createSignature,
    createLinePayBody
}
