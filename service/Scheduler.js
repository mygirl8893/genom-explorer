const nodecron = require('node-cron');
const mongoose = require('mongoose');

const SummaryStats = mongoose.model('SummaryStats');


module.exports = {
    initScheduler: initScheduler,
};

/**
 * Initializing all schedulers
 */
function initScheduler() {

}

function scheduleTaskEveryMinute(callback) {
    nodecron.schedule('* * * * *', callback);
}

