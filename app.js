const BeaconScanner = require('node-beacon-scanner');
const mqttClient = require("./mqtt-client");
const scanner = new BeaconScanner();
const Beacon = require('./models/Beacon');
var dateFormat = require('dateformat');
const sqlite3 = require('sqlite3').verbose();
require("dotenv/config");

const beaconSet = new Set();

async function sqlInsert() {
    setInterval(() => {
        beaconSet.clear();
    }, 3000);
    setInterval(() => {
        addBeaconstoDB(beaconSet);
        getAllBeaconsFromDB();
    }, 10000);
}

let db = new sqlite3.Database('./beaconDB.db', (err) => {
    console.log('Connected to SQlite database.');
    sqlInsert();
    scanner.onadvertisement = (ad) => {
        if (ad.beaconType == "iBeacon") {
            beaconSet.add(JSON.stringify(ad.iBeacon.uuid, null, '  '));
        }
    };
    scanner.startScan().then(() => {
        console.log('Started to scan.');
    }).catch((error) => {
        console.error(error);
    });
    if (err) {
        return console.error(err.message);
    }
});

//Active Beacons in Region - adding new beacons to DB and changing existed beacons' status to ACTIVE
async function addBeaconstoDB(beaconColl) {
    beaconColl.forEach(async function (beaconIter) {
        db.get("SELECT COUNT(*) as count, STATUS FROM BEACONS WHERE BEACONID = ?", JSON.parse(beaconIter), (err, result) => {
            if (result.count === 0) {
                db.run("INSERT INTO BEACONS(BEACONID,STATUS,INTIME) VALUES (?,?,?)", JSON.parse(beaconIter), process.env.ACTIVE,
                    dateFormat(new Date(), "dddd, mmmm dS, yyyy, h:MM:ss TT"));
                console.log("Beacon Added");
            } else {
                if (result.count === 1 && result.STATUS === process.env.INACTIVE) {
                    db.prepare('UPDATE BEACONS SET STATUS = ?, OUTTIME = ?, INTIME = ? WHERE BEACONID = ? ', [process.env.ACTIVE, '', dateFormat(new Date(),
                        "dddd, mmmm dS, yyyy, h:MM:ss TT"), JSON.parse(beaconIter)]).run();
                }
            }
        });
    });
    getExitedBeacons(beaconColl);
}

//Get beacons that left the room and update the status to INACTIVE
async function getExitedBeacons(beacons) {
    let dbBeaconsSet = new Set();
    var beaconsleft = new Set();
    db.all("SELECT BEACONID FROM BEACONS", (err, docs) => {
        docs.forEach(function (doc) {
            dbBeaconsSet.add(JSON.stringify(doc.BEACONID));
        });
        beaconsleft = difference(dbBeaconsSet, beacons);
        beaconsleft.forEach(async function (beaconIter) {
            db.get("SELECT COUNT(*) as count FROM BEACONS WHERE BEACONID = ? AND STATUS = ?",
                [JSON.parse(beaconIter), process.env.ACTIVE], (err, result) => {
                    if (result.count === 1) {
                        db.prepare("UPDATE BEACONS SET STATUS = ?, OUTTIME = ? WHERE BEACONID = ? ",
                            [process.env.INACTIVE, dateFormat(new Date(), "dddd, mmmm dS, yyyy, h:MM:ss TT"), JSON.parse(beaconIter)]).run();
                    }
                });
            if (err) {
                console.log("Error while updating docs in DB");
            }
        });
        if (err) {
            console.log("Error while fetching Docs in DB");
        }
    });
}

//All beacons present in the DB
function getAllBeaconsFromDB() {
    return db.all("SELECT BEACONID,STATUS,INTIME,OUTTIME FROM BEACONS", (err, docs) => {
        docs.forEach(function (doc) {
            console.log(doc);
            mqttClient.client.publish('/' + process.env.FLOOR_NO + '/' + process.env.ROOM_NO, JSON.stringify(doc));
        });
    });
}

//to calculate exited beacons
function difference(s1, s2) {
    let newSet = new Set();
    s1.forEach(elem => newSet.add(elem));
    s2.forEach(elem => newSet.delete(elem));
    return newSet;
}


module.exports = { addBeaconstoDB, getAllBeaconsFromDB, db };
