# API Documentation

This document contains instructions for setting up, structuring and interacting with the APIs for our project.

## API Endpoints

Below is the list of available API endpoints:

### 1. Category APIs

#### GET /ecshop/category
Retrieves a list of all categories.

#### GET /ecshop/category/:cat_id
Retrieves a specific category using the given ID.

### 2. Item APIs

#### GET /ecshop/item/:item_id
Retrieves a specific item using the given ID. The response includes item details as well as associated category and factory details.

#### GET /ecshop/item
Retrieves a list of items based on provided query parameters.

- `keyword`: (Optional) A string used to search items by name.
- `cate_ids`: (Optional) An array of category IDs to filter items (should be concatenated by '%').
- `order_key`: (Optional) Key used for ordering, defaults to 'item_name'.
    * `item_name`: Order by item name.
    * `price`: Order by item price.
    * `created_at`: Order by item created time.
    * `avg_rating`: Order by item rating
    * `sales`: Order by item sales
- `order_type`: (Optional) The order of the results, can be 'asc' (ascending, default) or 'desc' (descending).
- `price_min`: (Optional) The minimum price of the items.
- `price_max`: (Optional) The maximum price of the items.
- `rating_filter`: (Optional) The minimum rating of the items.
- `limit`: (Optional) The number of results to return, defaults to 10.
- `page`: (Optional) The number of current page, defaults to 1.

```javascript
{
    "data":[
        {
            "item_name": "乳酸菌藍莓優格麥片300gx1盒",
            "item_id": "bbf6b512-ef19-4055-8410-bf32683454d0",
            "img_url": "https://i2.momoshop.com.tw/1676617399/goodsimg/0010/485/716/10485716_O_m.webp",
            "price": 177,
            "item_description": "NA",
            "created_at": "2023-07-17T08:23:43.000Z",
            "avg_rating": 4.580000019073486,
            "sales": 13,
            "factory_name": "Vilson 米森"
        }
    ], // Array of items
    "pagination": {
        "totalItems": 1169,
        "totalPages": 117,
        "currentPage": 10,
        "limit": 10
    }
}
```

### Checkout APIs

#### POST　/ecshop/checkout (NEED JWT)
Creates an order and returns the order ID.
Body Payload:
1. items: Array of item_id and amount
2. address_info: Object of name, address, phone_number
3. payment_info: Object of payment_type

Json format would as follow:
```javascript
{
    "items": [
        {
            "item_id": "a7b0e4e1-1c1b-4365-a66e-c61df95481e1",
            "amount": 2
        },
        {
            "item_id": "903a3894-7e7f-4e62-aa3f-3c74ecd9f911",
            "amount": 1
        }
    ],
    "address_info": {
        "name": "John",
        "address": "123 Main St",
        "phone_number": "123-456-7890"
    },
    "payment_info": {
        "payment_type": "wallet",
        "coupon_sid": 1 | null,
        "shipfee": 60 | null (default 60)
    }
}
```

Response:
```javascript
{
    "message": "Order created successful!",
    "order_id": "1d5c9b98-c717-4631-b309-e94ee893d0d7",
    "linepay_redirect": "redirect_url"
}
```

#### GET /ecshop/checkout/linepay/confirm
Confirm linepay payment and update order status.
If return status is 200, it means payment is successful.

Query Params:
1. transactionId: transactionId from linepay
2. orderId: orderId from linepay (also same to our EC order_id)

Response:
```javascript
{
    "message":"Payment successful!",
    "order_id":"81bfffa8-d447-437f-81a3-364a2666b16c"
}
```

### Linepay Flow

1. Create order in our EC system, and get order_id, linepay_redirect_url from response.
2. Redirect to linepay_redirect_url, and pay in linepay.
3. After payment, linepay will redirect to LINEPAY_RETURN_HOST/checkout/linepay/confirm?transactionId=xxx&orderId=xxx
4. After front-end handle the redirect, it will need to call our EC system to confirm payment also update order status.
5. If payment is successful, it will return 200 status code, and front-end can redirect to success page.

Note:
    * Need to set LINEPAY_RETURN_HOST in .env file for frone-end redirection.

## Topup

### POST /ecshop/checkout/easytopup (NEED JWT)

Directly topup to user wallet without any order created.

Body Payload:
1. amount: topup amount

Response:
```javascript
{
    success: true,
    message: "儲值成功"
}
```

### POST /ecshop/checkout/linepaytopup (NEED JWT)

Create linepay order for topup, but no validation for order, wallet would be topup before user pay in linepay.

Body Payload:
1. amount: topup amount

Response:
```javascript
{
    message: "Order created successful!",
    linepay_redirect: "redirect_url"
}
```

## Buy For me

### POST /ecshop/checkout/buyforme (NEED JWT)

Create order for buy for me, and return order_id, just support 'wallet' payment type.

Body Payload:
```javascript
{
    "open_sid": 1,
    "nickname": "test",
    "mobile_number": "0912-345-678",
    "order_amount": 160, // Should be total amount of items (exclude shipfee & coupon)
    "order_instructions": "",
    "items": [
        {
            "order_food": 18,
            "order_quantity": 1,
            "order_price": 60
        },
        {
            "order_food": 148,
            "order_quantity": 2,
            "order_price": 100
        }
    ],
    "payment_info": {
        "payment_type": "wallet",
        "shipfee": 600, // If this member is VIP, shipfee would be 0
        "coupon_sid": 55
    }
}
```

Response:
```javascript
{
    "message": "Order created successful!",
    "order_sid": 806
}
```

### Other Refs

1. [Linepay Payment Request Docs](https://pay.line.me/th/developers/apis/onlineApis?locale=zh_TW)
