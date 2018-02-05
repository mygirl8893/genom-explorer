require( '../db.js' );
var etherUnits = require("../lib/etherUnits.js");
var BigNumber = require('bignumber.js');
const fs = require('fs');

const Web3 = require('web3');

const baseUrl = "http://37.143.13.112";
const port = 8545;

const mongoose = require('mongoose');
const Block = mongoose.model('Block');
const Transaction = mongoose.model('Transaction');
const web3 = new Web3(new Web3.providers.HttpProvider(baseUrl + ":" + port));

let started = false;
let initialized = false;

let blocksFailedToFetch = [];

let isDebug = false;

mongoose.set('debug', false);


/**
 * Fetches block from web3, checks that it DNE in DB, and insert them
 * @param number {number} high border to check (f.e. 0 -> number)
 */
const fetchBlocks = function (number) {


    //Grab blocks starting from 0
    const lastBlock = number;
    let iterator = 0;
    console.log('Last block: ', lastBlock);

    fetchBlock(iterator, lastBlock);

};


function writeTransactionToDBPromise(transaction) {
    return new Promise((resolve, reject) => {
        Transaction(transaction).save(function (err) {
            if (typeof err !== 'undefined' && err) {
                if (err.code == 11000) {
                    console.log('Skip: Duplicate key ' +
                        transaction.hash + ': ' +
                        err);
                } else {
                    throw new Error('Error: Aborted due to error on ' +
                        'transaction with hash' + transaction.hash + ': ' +
                        err);
                }
            } else {
                console.log('Transaction with hash ' + transaction.hash + ' successfully written in DB');
            }
        });

    });
}

function writeTransactionToDB(transaction) {
    return new Transaction(transaction).save(function (err) {
        if (typeof err !== 'undefined' && err) {
            if (err.code == 11000) {
                console.log('Skip: Duplicate key ' +
                    transaction.hash + ': ' +
                    err);
            } else {
                throw new Error('Error: Aborted due to error on ' +
                    'transaction with hash' + transaction.hash + ': ' +
                    err);
            }
        } else {
            if (isDebug) {
                console.log('Transaction with hash ' + transaction.hash + ' successfully written in DB');
            }
        }
    });
}

/**
 *
 * @param blocks {Array} array of numbers of blocks to fetch (may be the hashes, but not tested)
 */
function fetchBlockBatch(blocks) {
    let blockNumber = blocks.shift();

    fetchBlockPromise(blockNumber).then(successCallback, errorCallback);

    function successCallback() {
        console.log('Successfully fetched block #' + blockNumber);
        if (blocks.length > 0) {
            blockNumber = blocks.shift();
            fetchBlockPromise(blockNumber).then(successCallback, errorCallback);
        } else {
            console.log('Finished fetching block batch');
            initialized = true;
        }
    }

    function errorCallback(error) {
        console.log('Failed to fetch block #' + blockNumber + ". Possibly web3 is bugging. Adding to unprocessed queue'");
        if (blockNumber == undefined) {
            console.log('Ay');
        }
        blocksFailedToFetch.push(blockNumber);
        blockNumber = blocks.shift();
        fetchBlockPromise(blockNumber).then(successCallback, errorCallback);
    }

}

function fetchBlockPromise(blockNumber) {
    return new Promise((resolve, reject) => {
        web3.eth.getBlock(blockNumber, true, function (error, blockData) {
            if (!error) {
                let promises = [];
                promises.push(writeBlockToDBPromise(blockData));
                promises.push(writeTransactionsToDB(blockData.transactions));
                Promise.all(promises).then(function (result) {
                    resolve(result);
                }, function (error) {
                    reject(error);
                })
            }
            else {
                reject(error);
            }
        });
    })
}


function fetchBlock(i, lastBlock) {
    if (lastBlock != null && i == lastBlock) {
        initialized = true;
        return;
    }
    web3.eth.getBlock(i, true, function (error, blockData) {
        if (!error) {

            //Checking that block is not exists in DB
            //If not, then write it to DB
            Block.find({number: i}, function (err, b) {
                if(i % 200 == 0) {
                    console.log('Processing block #' + i);
                }

                if (b.length == 0) {
                    if(isDebug) {
                        console.log('Block number ' + i + ' does not exists in DB, processing');
                        console.log('Saving block #' + i + ' to DB');
                    }
                    writeBlockToDB(blockData);

                } else {
                    if (b.length > 1) {
                        throw new Error("Something wrong with db, querying returned multiple block result");
                    }
                    console.log('Block number ' + i + ' found, skipping');
                }

            });

            writeTransactionsToDB(blockData.transactions);
            if (lastBlock != null) {
                fetchBlock(++i, lastBlock);
            }
        }
        else {
            console.log('Could not get block #' + i + ". Adding it as failed block to unprocessed pool");
            if (i == undefined) {
                console.log('Ay');
            }
            blocksFailedToFetch.push(i);
            if (lastBlock != null) {
                fetchBlock(++i, lastBlock);
            }
        }
    });
}


/**
 *
 * @param i {number} from block start listen
 */
var listenBlocks = function () {
    var newBlocks = web3.eth.filter("latest");
    newBlocks.watch(function (error, blockHash) {
        if (error) {
            console.error('Watch error: ', error);
            return;
        }

        if (blockHash == null) {
            console.error('Warning: null block hash');
        }

        if (initialized && blocksFailedToFetch.length > 0) {
            console.log('We have failed blocks to fetch in db, processing it');
            let blocksToFetch = [];
            //Fetching blocks with batch size 2k
            for (let i = 0; i < 2000; i++) {
                if (blocksFailedToFetch.length > 0) {
                    let blockToProcess = blocksFailedToFetch.pop();
                    blocksToFetch.push(blockToProcess);
                }
            }
            initialized = false;
            fetchBlockBatch(blocksToFetch);
        }

        console.log('Got block hash:', blockHash);
        web3.eth.getBlock(blockHash, true, function (error, blockData) {
            if (error) {
                throw new Error("Could not get block from listener");
            } else {
                if (!started) {
                    //starting fetching;
                    console.log('Grabber is not initialized, starting checking blocks from db');
                    let blocksToFetch = [];
                    for (let i = 0; i < blockData.number; i++) {
                        blocksToFetch.push(i);
                    }
                    fetchBlockBatch(blocksToFetch);
                    started = true;
                }

                //Saving fresh block
                //write block to db
                console.log('Got new block with number, saving to DB', blockData.number);
                let promises = [];

                promises.push(writeBlockToDBPromise(blockData));
                promises.push(writeTransactionsToDB(blockData.transactions));
                Promise.all(promises).then(function (result) {
                    console.log('Succefully added fresh block to database');
                }, function (error) {
                    console.log('Failed to add fresh block to DB, adding to unprocessed queue');
                    if (blockData.number == undefined) {
                        console.log('Ay');
                    }
                    blocksFailedToFetch.push(blockData.number);
                })
            }
        });
        //grabBlock(config, web3, log);

    });
};

function writeBlockToDBPromise(blockData) {
    let blockNumber = blockData.number;

    return new Promise((resolve, reject) => {
        Block.find({number: blockNumber}, function (err, b) {
            if (b.length == 0) {
                console.log('Block number ' + blockNumber + ' does not exists in DB, processing');
                console.log('Saving block #' + blockNumber + ' to DB');

                Block(blockData).save(function (err, block) {
                    if (typeof err !== 'undefined' && err) {
                        if (err.code == 11000) {
                            console.log('Rejected saving block into db, Duplicate key ', blockData.number, ': ', err);
                            reject(err, blockData)
                        } else {
                            console.log('Rejected saving block into db, error on block number ', blockData.number, ': ', err);
                            reject(err, blockData)
                        }
                    } else {
                        console.log('DB successfully written for block number ', blockData.number);
                        resolve();
                    }
                })

            } else {
                if (b.length > 1) {
                    console.error("ERROR! QUERYING DB RETURNED MULTIPLE RECORDS. SOMETHING WRONG WITH DB");
                    reject("MULTIPLE_DB_RECORDS");
                }
                console.log('Block number ' + blockNumber + ' found, skipping');
                resolve();
            }

        })
    })
}


var writeBlockToDB = function (blockData) {
    return new Block(blockData).save(function (err, block, count) {
        if (typeof err !== 'undefined' && err) {
            if (err.code == 11000) {
                console.log('Skip: Duplicate key ' +
                    blockData.number.toString() + ': ' +
                    err);
            } else {
                console.log('Error: Aborted due to error on ' +
                    'block number ' + blockData.number.toString() + ': ' +
                    err);
                process.exit(9);
            }
        } else {
            console.log('DB successfully written for block number ' +
                blockData.number.toString());
        }
    });
};

/**
 Break transactions out of blocks and write to DB
 **/

function writeTransactionsToDBPromise(transactions) {
    return new Promise((resolve, reject) => {
        transactions.forEach(function (transaction) {
            //Check that we have this transaction in DB
            //If not, then write it to DB
            console.log('Found transaction with hash ' + transaction.hash + ' in block #' + transaction.blockNumber);
            Transaction.find({hash: transaction.hash}, function (err, b) {
                if (b.length == 0) {
                    console.log('Transaction with hash ' + transaction.hash + 'does not exists in DB, processing');
                    let promises = [];
                    promises.push(writeTransactionToDB(transaction));
                    Promise.all(promises).then(function (result) {
                        resolve(result);
                    }, function (error) {
                        reject(error);
                    })
                }
                else {
                    if (b.length > 1) {
                        console.error("ERROR! QUERYING DB RETURNED MULTIPLE RECORDS. SOMETHING WRONG WITH DB")
                        reject("MULTIPLE_DB_RECORDS");
                    }
                    console.log('Transaction with hash ' + transaction.hash + ' found in DB, skipping');
                    resolve();
                }
            })
        });
    });
};

var writeTransactionsToDB = function (transactions) {
    transactions.forEach(function (transaction) {

        //Check that we have this transaction in DB
        //If not, then write it to DB
        console.log('Found transaction with hash ' + transaction.hash + ' in block #' + transaction.blockNumber);
        Transaction.find({hash: transaction.hash}, function (err, b) {
            if (b.length == 0) {
                console.log('Transaction with hash ' + transaction.hash + 'does not exists in DB, processing');
                writeTransactionToDB(transaction)
            }
            else {
                if (b.length > 1) {
                    throw new Error("Something wrong with db, querying returned multiple block result");
                }
                console.log('Transaction with hash ' + transaction.hash + ' found in DB, skipping');
            }
        })
    });

};


/** On Startup **/
// geth --rpc --rpcaddr "localhost" --rpcport "8545"  --rpcapi "eth,net,web3"

//Starting grabber
console.log('Starting grabber');
listenBlocks();

