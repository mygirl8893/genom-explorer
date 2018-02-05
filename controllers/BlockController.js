'use strict';

const mongoose = require('mongoose');
const Block = mongoose.model('Block');
const Transaction = mongoose.model('Transaction');
const DTOMapper = require('../service/DTOMapper');

const filters = require('../routes/filters');

exports.getBlock = function (req, res) {

    const blockNumberOrHash = req.params.blockNumberOrHash;
    let isBlockNumber = new RegExp(/^\d+$/).test(blockNumberOrHash);
    let isBlockHash = new RegExp(/^(0x)([0-9a-z])+$/).test(blockNumberOrHash);

    if (isBlockNumber) {
        let blockNumber = parseInt(blockNumberOrHash);
        let blockFind = Block.findOne({number: blockNumber}).lean(true);
        blockFind.exec(function (err, doc) {
            if (err) {
                console.log('Error', err, doc);
                res.write(JSON.stringify({error: true, reason: "Unknown"}));
                res.status(500).send();
                res.end();
                return;
            }
            if (!err && !doc) {
                console.log('BlockFind: Not found, blockNumber:', blockNumber);
                res.status(404).send();
                res.end();
                return;
            }
            if (doc) {
                let block = filters.filterBlocks(doc);
                let blockDTO = DTOMapper.mapMongooseBlockToDTO(block);
                res.write(JSON.stringify(blockDTO));
                res.end();
                return;
            }
            console.error('Unexpected error while blockFind', err, doc);
            res.write(JSON.stringify({error: true, reason: "Unknown"}));
            res.status(500).send();
            res.end();
        });
        return;
    }

    if (isBlockHash) {
        let blockHash = blockNumberOrHash;
        let blockFind = Block.findOne({hash: blockHash}).lean(true);
        blockFind.exec(function (err, doc) {
            if (err) {
                console.log('Error', err, doc);
                res.write(JSON.stringify({error: true, reason: "Unknown"}));
                res.status(500).send();
                res.end();
                return;
            }
            if (!err && !doc) {
                console.log('BlockFind: Not found, blockHash:', blockHash);
                res.status(404).send();
                res.end();
                return;
            }
            if (doc) {
                let block = filters.filterBlocks(doc);
                let blockDTO = DTOMapper.mapMongooseBlockToDTO(block);
                res.write(JSON.stringify(blockDTO));
                res.end();
                return;
            }
            console.error('Unexpected error while blockFind', err, doc);
            res.write(JSON.stringify({error: true, reason: "Unknown"}));
            res.status(500).send();
            res.end();
        });
        return;
    }
    console.error("BlockFind error: invalid block number request: " + blockNumberOrHash);
    console.error(req.params);
    res.write(JSON.stringify({error: true, reason: "Invalid block request"}));
    res.end();

};

exports.getLatestBlocks = function (req, res) {

    Block.find().limit(10).sort({$natural: -1}).lean(true).exec(function (err, blocks) {
        if (err) {
            res.status(500).send();
            res.end();
        }
        else {
            let result = [];
            blocks.forEach(function (block) {
                result.push(DTOMapper.mapMongooseBlockToDTO(block));
            });
            res.write(JSON.stringify(result));
            res.end();
        }

    });

};

exports.getBlockTransactions = function (req, res) {
    const blockNumberOrHash = req.params.blockNumberOrHash;
    let isBlockNumber = new RegExp(/^\d+$/).test(blockNumberOrHash);
    let isBlockHash = new RegExp(/^(0x)([0-9a-z])+$/).test(blockNumberOrHash);

    if (isBlockNumber) {
        let blockNumber = parseInt(blockNumberOrHash);
        let transactionsFind = Transaction.find({blockNumber: blockNumber}).sort("-blockNumber").lean(true);
        transactionsFind.exec(function (err, transactions) {
            if (err) {
                console.log('Error', err, transactions);
                res.write(JSON.stringify({error: true, reason: "Unknown"}));
                res.status(500).send();
                res.end();
                return;
            }
            if (!err && !transactions) {
                res.write(JSON.stringify([]));
                res.end();
                return;
            }
            if (transactions) {
                let result = [];
                transactions.forEach(function (tx) {
                    let txDTO = DTOMapper.mapMongooseTransactionToDTO(tx);
                    result.push(txDTO);
                });
                res.write(JSON.stringify(result));
                res.end();
                return;
            }
            console.error('Unexpected error while blockFind', err, transactions);
            res.write(JSON.stringify({error: true, reason: "Unknown"}));
            res.status(500).send();
            res.end();
        });
        return;
    }

    if (isBlockHash) {
        let blockHash = blockNumberOrHash;
        let transactionsFind = Transaction.find({blockHash: blockHash}).sort("-blockNumber").lean(true);
        transactionsFind.exec(function (err, transactions) {
            if (err) {
                console.log('Error', err, transactions);
                res.write(JSON.stringify({error: true, reason: "Unknown"}));
                res.status(500).send();
                res.end();
                return;
            }
            if (!err && !transactions) {
                res.write(JSON.stringify([]));
                res.end();
                return;
            }
            if (transactions) {
                let result = [];
                transactions.forEach(function (tx) {
                    let txDTO = DTOMapper.mapMongooseTransactionToDTO(tx);
                    result.push(txDTO);
                });
                res.write(JSON.stringify(result));
                res.end();
                return;
            }
            console.error('Unexpected error while blockFind', err, transactions);
            res.write(JSON.stringify({error: true, reason: "Unknown"}));
            res.status(500).send();
            res.end();
        });
        return;
    }
    console.error("BlockFind error: invalid block number request: " + blockNumberOrHash);
    console.error(req.params);
    res.write(JSON.stringify({error: true, reason: "Invalid block request"}));
    res.end();
};