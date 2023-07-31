const db = require("../models");
const Factory = db.shop.factory;

exports.getFactories = (req, res) => {
    Factory.findAll()
    .then(data => {
        res.send({
            data: data,
        });
    })
    .catch(err => {
        res.status(500).send({
        message:
            err.message || "Some error occurred while retrieving factories."
        });
    });
}

exports.getFactory = (req, res) => {
    const id = req.params.factory_id;

    Factory.findByPk(id)
    .then(data => {
        if (data) {
            res.send({
                data: data,
            });
        } else {
            res.status(404).send({ message: `Cannot find Factory with id=${id}.` });
        }
    })
    .catch(err => {
        res.status(500).send({
            message: err.message || `Error retrieving Factory with id=${id}.`
        });
    });
};
