'use strict';

const mongoose = require('mongoose');
const Block = mongoose.model('Block');
const SummaryStatsDTO = require('../dto/SummaryStatsDTO');
const SummaryStatsService = require('../service/SummaryStatsService');
const DTOMapper = require('../service/DTOMapper');

const filters = require('../routes/filters');

exports.getSummaryStats = function (req, res) {

    let difficulty = null;
    let difficulty24hr = null;
    let blocktime = null;
    let blocktime24hr = null;


    let promises = [];

    SummaryStatsService.getBlocktime(24).then(function (result) {
        blocktime24hr = result;
        return SummaryStatsService.getBlocktime(1).then(result => {
            blocktime = result;
            return SummaryStatsService.getDifficulty(24).then(result => {
                difficulty24hr = result;
                return SummaryStatsService.getDifficulty(1).then(result => {
                    difficulty = result;
                    return SummaryStatsService.getPrices().then(result => {
                        let summaryStatsDTO = DTOMapper.mapSummaryStatsToDTO(result, blocktime, blocktime24hr, difficulty, difficulty24hr);
                        res.write(JSON.stringify(summaryStatsDTO));
                        res.end();
                    });
                })
            })
        });
    }).catch(function (error) {
        let summaryStatsDTO = DTOMapper.mapSummaryStatsToDTO(blocktime, blocktime24hr, difficulty, difficulty24hr);
        res.write(JSON.stringify(summaryStatsDTO));
        res.end();
    });


};