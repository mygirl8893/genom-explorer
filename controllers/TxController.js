'use strict';

const mongoose = require('mongoose');
const Transaction = mongoose.model('Transaction');
const TransactionDTO = require('../dto/TransactionDTO');
const DTOMapper = require('../service/DTOMapper');

exports.getTx = function (req, res) {
    if (req.params['txHash'] && new RegExp(/^(0x)([0-9a-z]{64,64})+$/).test(req.params['txHash'])) {
        let txHash = req.params['txHash'];

        Transaction.find({hash: txHash}, function (err, b) {
            if (err) {
                console.error('Error while finding tx', tx);
                res.status(500).send();
                res.end();
            } else {
                if (b.length == 0) {
                    console.log('Tx searching returned not found');
                    res.status(404).send();
                    res.end();
                    return;
                }
                if (b.length > 1) {
                    console.error('Tx finding returned multiple transactions');
                    res.status(500).send();
                    res.end();
                    return;
                }
                let transactionDTO = new TransactionDTO();
                transactionDTO = DTOMapper.mapMongooseTransactionToDTO(b[0]);
                res.write(JSON.stringify(transactionDTO));
                res.end();
            }
        });
    } else {
        res.status(400).send();
        res.end();
    }
};

exports.fromAddress = function (req, res) {
    if (req.params['address'] && new RegExp(/^(0x)([0-9a-z]{40,40})+$/).test(req.params['address'])) {
        let address = req.params['address'];
        Transaction.find({from: address}, function (err, b) {
            if (err) {
                console.error('Error while finding tx with address from', err, tx);
                res.status(500).send();
                res.end();
            } else {
                if (b.length == 0) {
                    res.write(JSON.stringify([]));
                    res.end();
                } else {
                    let result = [];
                    b.forEach(function (tx) {
                        let transactionDTO = DTOMapper.mapMongooseTransactionToDTO(tx);
                        result.push(transactionDTO);

                    });
                    res.write(JSON.stringify(result));
                    res.end();
                }
            }
        });
    } else {
        res.status(400).send();
        res.end();
    }
};

exports.toAddress = function (req, res) {
    if (req.params['address'] && new RegExp(/^(0x)([0-9a-z]{40,40})+$/).test(req.params['address'])) {
        let address = req.params['address'];
        Transaction.find({to: address}, function (err, b) {
            if (err) {
                console.error('Error while finding tx with address from', err, tx);
                res.status(500).send();
                res.end();
            } else {
                if (b.length == 0) {
                    res.write(JSON.stringify([]));
                    res.end();
                } else {
                    let result = [];
                    b.forEach(function (tx) {
                        let transactionDTO = DTOMapper.mapMongooseTransactionToDTO(tx);
                        result.push(transactionDTO);
                    });
                    res.write(JSON.stringify(result));
                    res.end();
                }
            }
        });
    } else {
        res.status(400).send();
        res.end();
    }
};

exports.getLatest = function (req, res) {
    Transaction.find().limit(10).sort('-blockNumber').exec(function (err, transactions) {
        if (err) {
            res.status(500).send();
            res.end();
        }
        else {
            let result = [];
            transactions.forEach(function (transaction) {
                result.push(DTOMapper.mapMongooseTransactionToDTO(transaction));
            });
            res.write(JSON.stringify(result));
            res.end();
        }
    });
};