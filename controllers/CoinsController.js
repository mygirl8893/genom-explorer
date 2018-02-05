'use strict';

const mongoose = require('mongoose');
const Block = mongoose.model('Block');

exports.getCoinsAmount = function (req, res) {

    Block.find().limit(1).sort({$natural: -1}).lean(true).exec(function (err, blocks) {
        if (err) {
            res.status(500).send();
            res.end();
        } else {
            if (blocks.length !== 1) {
                res.status(500).send();
                res.end();
            } else {
                res.write(JSON.stringify(blocks[0].number * 5 + 6000000));
                res.end();
            }
        }
    });

};