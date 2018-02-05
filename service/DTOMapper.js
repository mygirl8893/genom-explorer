const BlockDTO = require('../dto/BlockDTO');
const SummaryStatsDTO = require('../dto/SummaryStatsDTO');
const TransactionDTO = require('../dto/TransactionDTO');

module.exports = {
    mapMongooseBlockToDTO: mapMongooseBlockToDTO,
    mapMongooseTransactionToDTO: mapMongooseTransactionToDTO,
    mapSummaryStatsToDTO: mapSummaryStatsToDTO,
};

/**
 * Maps mongoose's model to BlockDTO
 * @param blockModel
 * @returns {BlockDTO}
 */
function mapMongooseBlockToDTO(blockModel) {
    let blockDTO = new BlockDTO();

    blockDTO.difficulty = blockModel.difficulty;
    blockDTO.extraData = blockModel.extraData;
    blockDTO.gasLimit = blockModel.gasLimit;
    blockDTO.gasUsed = blockModel.gasUsed;
    blockDTO.hash = blockModel.hash;
    blockDTO.logsBloom = blockModel.logsBloom;
    blockDTO.miner = blockModel.miner;
    blockDTO.nonce = blockModel.nonce;
    blockDTO.number = blockModel.number;
    blockDTO.parentHash = blockModel.parentHash;
    blockDTO.sha3Uncles = blockModel.sha3Uncles;
    blockDTO.size = blockModel.size;
    blockDTO.stateRoot = blockModel.stateRoot;
    blockDTO.timestamp = blockModel.timestamp;
    blockDTO.totalDifficulty = blockModel.totalDifficulty;
    blockDTO.transactionsRoot = blockModel.transactionsRoot;
    blockDTO.uncles = blockModel.uncles;

    return blockDTO;
}


function mapSummaryStatsToDTO(prices, blocktime, blocktime24hr, difficulty, difficulty24hr) {
    let summaryStatsDTO = new SummaryStatsDTO();
    summaryStatsDTO.price = prices.shfBtcRate * prices.btcUsdRate;
    summaryStatsDTO.priceChange24hr = prices.shfBtcChange;
    summaryStatsDTO.hashrate = difficulty / blocktime;
    summaryStatsDTO.hashrate24hr = (difficulty24hr / blocktime24hr);
    summaryStatsDTO.difficulty = difficulty;
    summaryStatsDTO.difficulty24hr = difficulty24hr;
    summaryStatsDTO.blocktime = blocktime;
    summaryStatsDTO.blocktime24hr = blocktime24hr;

    return summaryStatsDTO;
}

function mapMongooseTransactionToDTO(transactionModel) {
    let transactionDTO = new TransactionDTO();
    transactionDTO.blockHash = transactionModel.blockHash;
    transactionDTO.blockNumber = transactionModel.blockNumber;
    transactionDTO.from = transactionModel.from;
    transactionDTO.gas = transactionModel.gas;
    transactionDTO.gasPrice = transactionModel.gasPrice;
    transactionDTO.hash = transactionModel.hash;
    transactionDTO.input = transactionModel.input;
    transactionDTO.nonce = transactionModel.nonce;
    transactionDTO.to = transactionModel.to;
    transactionDTO.transactionIndex = transactionModel.transactionIndex;
    transactionDTO.value = transactionModel.value;
    return transactionDTO;
}




