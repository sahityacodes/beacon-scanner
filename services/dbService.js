const Beacon = require('../models/Beacon');
var dateFormat = require('dateformat');
require("dotenv/config");

//Active Beacons in Region - adding new beacons to DB and changing existed beacons' status to ACTIVE
async function addBeaconstoDB(beaconColl) {
    beaconColl.forEach(async function (beaconIter) {
        let beaconPresent = await Beacon.exists({ beaconId: JSON.parse(beaconIter) });
        let checkBeaconStatus = await Beacon.exists({ beaconId: JSON.parse(beaconIter), status: process.env.INACTIVE });
        if (!beaconPresent) {
            const beacon = new Beacon({
                room : process.env.ROOM_NO,
                floor : process.env.FLOOR_NO,
                beaconId: JSON.parse(beaconIter),
                status: process.env.ACTIVE,
                inTime: new Date().setHours( new Date().getHours() + 1 )
            });
            beacon.save();
            console.log('Beacon Added');
        }
        if (checkBeaconStatus) {
            const update = {
                status: process.env.ACTIVE,
                inTime: new Date().setHours( new Date().getHours() + 1 ),
                outTime: ''
            };
            const filter = { beaconId: JSON.parse(beaconIter) };
            (await Beacon.findOneAndUpdate(filter, update)).save;
            console.log('Status Change to Active');
        }

    });
    await getExitedBeacons(beaconColl);
}

//Get beacons that left the room and update the status to INACTIVE
async function getExitedBeacons(beacons) {
    let beaconsleft = new Set();
    beaconsleft = await getAllBeaconsFromDB().then(function (result) {
        return difference(result, beacons);
    });
    beaconsleft.forEach(async function (beaconIter) {
    let beaconPresent = await Beacon.exists({ beaconId: JSON.parse(beaconIter), status: process.env.ACTIVE });
        if (beaconPresent) {
            console.log('active now',beaconPresent);
            console.log(beaconIter);
            const update = {
                status: process.env.INACTIVE,
                outTime: new Date().setHours( new Date().getHours() + 1 )
            };
           // console.log(beaconIter);
            const filter = { beaconId: JSON.parse(beaconIter) };
            await Beacon.findOneAndUpdate(filter, update);
            console.log("Done");
        }
    });
}

//All beacons present in the DB
function getAllBeaconsFromDB() {
    let beaconSet = new Set();
    const beaconDocs = Beacon.find({ 'room':'101'}, { 'beaconId': 1, '_id': 0 }, function (err, docs) {
        if (err) {
            console.log(err);
        } else {
            return docs;
        }
    });
    var set = beaconDocs.then((value) => {
        for (let i = 0; i < value.length; i++) {
            beaconSet.add(JSON.stringify(value[i].beaconId, null, '  '));
        }
        return beaconSet;
    }).catch(err => console.log("Error", err));
    return set;
}

//to calculate exited beacons
function difference(s1, s2) {
    if (!s1 instanceof Set || !s2 instanceof Set) {
        console.log("The given objects are not of type MySet");
        return new Set();
    }
    let newSet = new Set();
    s1.forEach(elem => newSet.add(elem));
    s2.forEach(elem => newSet.delete(elem));
    return newSet;
}


module.exports = { addBeaconstoDB, getAllBeaconsFromDB };
