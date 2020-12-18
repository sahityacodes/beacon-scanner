const mongoose = require('mongoose');

const Beacon= mongoose.Schema({
    beaconId: {
        type: String,
    },
    status : {
        type: String,
    },
    inTime: {
        type: String
        },
     outTime: {
        type: String
        },
    });

module.exports = mongoose.model('Beacon',Beacon);