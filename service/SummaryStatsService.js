const mongoose = require('mongoose');
const requestify = require('requestify');
const Block = mongoose.model('Block');
const SummaryStats = mongoose.model('SummaryStats');


module.exports = {
    getBlocktime: getBlocktime,
    getDifficulty: getDifficulty,
    getPrices: getPrices,
};

/**
 * Fetches all blocks from DB (!) for given last hours and computes average blocktime;
 * @param hours {number}
 * @returns {Promise}
 */
function getBlocktime(hours) {
    return new Promise((resolve, reject) => {
        //Current timestamp in seconds
        let now = Math.floor(Date.now() / 1000);
        let nowMinusHour = now - 60 * 60 * hours;

        Block.find({timestamp: {$gt: nowMinusHour}}).lean(true).exec(function (err, b) {
            if (err) {
                reject(err);
            } else {
                if (b.length > 0) {
                    let sum = 0;
                    let i = 0;
                    let lastTimestamp = null;
                    let sortedByNumber = b.sort(function (a, b) {
                        return a.number - b.number;
                    });
                    sortedByNumber.forEach(function (block) {
                        if (lastTimestamp != null) {
                            sum += block.timestamp - lastTimestamp;
                            i++;
                        }
                        lastTimestamp = block.timestamp;
                    });
                    let result = sum / i + 1;
                    resolve(result);
                }
                else {
                    reject('NOT_FOUND');
                }
            }
        });
    })
}

/**
 * Gets diff from DB. optional hours for diff hours ago
 * @param hours
 */
function getDifficulty(hours) {
    return new Promise((resolve, reject) => {
        //Current timestamp in seconds
        if (hours != null) {
            let now = Math.floor(Date.now() / 1000);
            let nowMinusHour = now - 60 * 60 * hours;
            Block.find({timestamp: {$lt: nowMinusHour}}).sort('-number').limit(1).lean(true).exec(function (err, blocks) {
                if (err) {
                    reject();
                } else {
                    if (blocks.length != 1) {
                        reject();
                    } else {
                        resolve(blocks[0].difficulty);
                    }
                }
            })
        } else {
            Block.find().limit(1).sort('-number').lean(true).exec(function (err, blocks) {
                if (err) {
                    reject();
                } else {
                    if (blocks.length != 1) {
                        reject();
                    } else {
                        resolve(blocks[0].difficulty);
                    }
                }
            })
        }

    })

}


function getPrices() {
    return new Promise((resolve, reject) => {
        requestify.get('https://stocks.exchange/api2/ticker')
            .then(function (response) {
                    let responseBody = response.getBody();

                    let shfTicks = responseBody.filter(function (coinTicker) {
                        return coinTicker.market_name === 'SHF_BTC';
                    });

                    if (shfTicks.length !== 1) {
                        reject();
                    }

                    let shfTick = shfTicks[0];
                    let shfBtcRate = parseFloat(shfTick.last);
                    let shfBtcChange = parseFloat(shfTick.spread);
                    requestify.get('https://bitpay.com/rates')
                        .then(function (response) {
                                let responseBody = response.getBody();

                                let usdTickers = responseBody.data.filter(function (ticker) {
                                    return ticker.code === 'USD';
                                });

                                if (usdTickers.length !== 1) {
                                    reject();
                                }

                                let usdTicker = usdTickers[0];

                                let btcUsdRate = usdTicker.rate;

                                let result = {
                                    shfBtcRate: shfBtcRate,
                                    shfBtcChange: shfBtcChange,
                                    btcUsdRate: btcUsdRate
                                };
                                resolve(result);
                            }
                        ).fail(function (error) {
                        reject(error)
                    })
                }
            ).fail(function (error) {
            reject(error)
        })
    });
}
