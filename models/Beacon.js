const mongoose = require('mongoose');

const Beacon = mongoose.Schema({
    room: {
        type: String,
    },
    floor: {
        type: String,
    },
    beaconId: {
        type: String,
    },
    status: {
        type: String,
    },
    inTime: {
        type: Date
    },
    outTime: {
        type: Date
    },
});

module.exports = mongoose.model('Beacon', Beacon);