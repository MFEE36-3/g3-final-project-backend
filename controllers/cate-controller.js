const db = require("../models");
const Category = db.shop.category;

exports.getCategories = (req, res) => {
    Category.findAll()
    .then(data => {
        res.send({
            data: data,
        });
    })
    .catch(err => {
        res.status(500).send({
        message:
            err.message || "Some error occurred while retrieving categories."
        });
    });
}

exports.getCategory = (req, res) => {
    const id = req.params.cat_id;

    Category.findByPk(id)
    .then(data => {
        if (data) {
            res.send({
                data: data,
            });
        } else {
            res.status(404).send({ message: `Cannot find Category with id=${id}.` });
        }
    })
    .catch(err => {
        res.status(500).send({
            message: err.message || `Error retrieving Category with id=${id}.`
        });
    });
};
