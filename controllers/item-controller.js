const db = require("../models");
const Item = db.shop.item;
const Category = db.shop.category;
const Factory = db.shop.factory;
const ItemRating = db.shop.item_ratings;


exports.getItems = async (req, res) => {

    let { keyword, cate_ids, order_type, order_key, price_min, price_max, rating_filter} = req.query;
    let { limit, page } = req.query;

    if (limit) {
        limit = parseInt(limit);
    }
    else {
        limit = 12;
    }

    if (page) {
        page = parseInt(page);
    }
    else {
        page = 1;
    }

    let rating;
    if (rating_filter) {
        rating = parseInt(rating_filter);
    }
    else {
        rating = 0;
    }

    offset = (page - 1) * limit;

    // Check for order_key and set default to 'item_name' if not provided or invalid
    order_key = order_key || 'item_name';
    // Check for order_type and set default to 'asc' if not provided or invalid
    if (order_type !== 'desc' && order_type !== 'asc') {
        order_type = 'asc';
    }

    // Prepare condition for item_name search
    let condition = keyword ? { item_name: { [db.Sequelize.Op.like]: `%${keyword}%` } } : {};

    // Check for cate_ids and convert to array if string provided
    if (cate_ids && typeof cate_ids === 'string') {
        cate_ids = cate_ids.split('%').map(id => id.trim());
    }

    // Add price conditions if present
    if(price_min) {
        condition.price = { ...condition.price, [db.Sequelize.Op.gte]: price_min };
    }
    if(price_max) {
        condition.price = { ...condition.price, [db.Sequelize.Op.lte]: price_max };
    }

    // Get total item count for pagination
    const totalItemsRes = await Item.findAll({
        attributes: [
            'item_id',
            [db.sequelize.fn('AVG', db.sequelize.col('item_ratings.rating')), 'avg_rating'],
            [db.sequelize.fn('COUNT', db.sequelize.col('item_ratings.rating')), 'sales']
        ],
        where: condition,
        include: [
        {
            model: Category,
            required: true,
            through: {
                where: cate_ids ? { cate_id: { [db.Sequelize.Op.in]: cate_ids } } : null
            }, // this will ignore the attributes of the joining table
            attributes: []
        },{
            model: Factory,
            attributes: ['factory_name']
        },
        {
            model: ItemRating,
            seperate: true,
            attributes: []
        }],
        group: [
            'item_name',
            'item_id',
            'categories.cate_id',
            'factory.factory_id',
            'img_url',
            'price',
            'item_description',
            'item.created_at',
        ],
        having: db.sequelize.where(
            db.sequelize.fn('AVG', db.sequelize.col('item_ratings.rating')),
            '>=',
            rating
        ),
        subQuery: false
    })
    const totalItems = totalItemsRes.length;
    const totalPages = Math.ceil(totalItems / limit);

    Item.findAll({
        attributes: [
            'item_name',
            'item_id',
            'img_url',
            'price',
            'item_description',
            'created_at',
            [db.sequelize.fn('AVG', db.sequelize.col('item_ratings.rating')), 'avg_rating'],
            [db.sequelize.fn('COUNT', db.sequelize.col('item_ratings.rating')), 'sales']
        ],
        where: condition,
        include: [
        {
            model: Category,
            required: true,
            through: {
                where: cate_ids ? { cate_id: { [db.Sequelize.Op.in]: cate_ids } } : null
            }, // this will ignore the attributes of the joining table
            attributes: []
        },{
            model: Factory,
            attributes: ['factory_name']
        },
        {
            model: ItemRating,
            seperate: true,
            attributes: []
        }],
        group: [
            'item_name',
            'item_id',
            'categories.cate_id',
            'factory.factory_id',
            'img_url',
            'price',
            'item_description',
            'created_at',
        ],
        having: db.sequelize.where(
            db.sequelize.fn('AVG', db.sequelize.col('item_ratings.rating')),
            '>=',
            rating
        ),
        order: [[order_key, order_type]],
        limit: limit,
        offset: offset,
        subQuery: false
    })
    .then(data => {
        let itemsData = data.map(itemData => {
            itemData = itemData.toJSON(); // Convert the data to JSON
            itemData.factory_name = itemData.factory.factory_name;
            // itemData.item_name = itemData.item_name.split('(')[0].trim();
            delete itemData.factory;
            return itemData;
        });

        res.send({
            data: itemsData,
            pagination: {
                totalItems: totalItems,
                totalPages: totalPages,
                currentPage: page,
                limit: limit
            }
        });
    })
    .catch(err => {
        res.status(500).send({
        message:
            err.message || "Some error occurred while retrieving items."
        });
    });
}

exports.getItem = (req, res) => {
    const id = req.params.item_id;

    Item.findByPk(id, {
        attributes: [
            'item_name',
            'item_id',
            'img_url',
            'price',
            'item_description',
            'created_at',
            [db.sequelize.fn('AVG', db.sequelize.col('item_ratings.rating')), 'avg_rating'],
            [db.sequelize.fn('COUNT', db.sequelize.col('item_ratings.rating')), 'sales']
        ],
        include: [
        {
            model: Category,
            required: true,
            attributes: ['cate_name']
        },{
            model: Factory,
            attributes: ['factory_name']
        },
        {
            model: ItemRating,
            seperate: true,
            attributes: []
        }],
        group: [
            'item_name',
            'item_id',
            'categories.cate_id',
            'factory.factory_id',
            'img_url',
            'price',
            'item_description',
            'created_at',
        ]
    })
    .then(data => {
        if (data) {
            let itemData = data.toJSON(); // Convert the data to JSON

            // Map through the array of categories and get the cate_name
            itemData.cate_names = itemData.categories.map(cate => cate.cate_name);
            itemData.factory_name = itemData.factory.factory_name;

            // Remove the category and factory objects
            delete itemData.categories;
            delete itemData.factory;

            res.send({
                data: itemData,
            });
        } else {
            res.status(404).send({ message: `Cannot find Item with id=${id}.` });
        }
    })
    .catch(err => {
        res.status(500).send({
            message: err.message || `Error retrieving Item with id=${id}.`
        });
    });
};
