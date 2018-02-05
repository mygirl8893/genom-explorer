'use strict';

const mongoose = require('mongoose');
const Transaction = mongoose.model('Transaction');
const DTOMapper = require('../service/DTOMapper');
const BigNumber = require('bignumber.js');
const filters = require('../routes/filters');
const Web3Service = require('../service/Web3Service');
var etherUnits = require('../libs/etherUnits');


exports.broadcast = function (req, res) {
    if (req.body !== null && req.body.rawTx !== null) {
        let rawTx = req.body.rawTx;
        let isTx = new RegExp(/^(0x)([0-9a-z])+$/).test(rawTx);
        if (isTx) {
            Web3Service.sendRawTx(rawTx).then(function (hash) {
                console.log('Successfully sent rawTx into the network hash:', hash);

                res.status(200).send();
                res.write(JSON.stringify({hash: hash}));
                res.end();
            }, function (error) {
                res.status(520).send();
                res.end();
            })
        } else {
            res.status(400).send();
            res.end();
        }
    } else {
        res.status(400).send();
        res.end();
    }
};
