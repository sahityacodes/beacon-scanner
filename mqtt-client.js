const BeaconScanner = require('node-beacon-scanner');
const { addBeaconstoDB } = require('./services/dbService');
const mongoose = require('mongoose');
const scanner = new BeaconScanner();
const beaconSet = new Set();
var mqtt = require('mqtt');
const Beacon = require('./models/Beacon');

connectToMongo();
async function mongoInsert() {
	setInterval(() => {
		beaconSet.clear();
	}, 9000);
	setInterval(() => {
		addBeaconstoDB(beaconSet).then(() =>{
			getDataToPublish();
		});
	}, 10000);
}

async function connectToMongo() {
	await mongoose.connect(process.env.DB_CONNECTION, { useUnifiedTopology: true, useNewUrlParser: true, useFindAndModify: false })
		.then(() => {
			console.log("Connected to Mongo DB");
			scanner.onadvertisement = (ad) => {
				if (ad.beaconType == "iBeacon") {
					beaconSet.add(JSON.stringify(ad.iBeacon.uuid, null, '  '));
				}
			};
			mongoInsert();
			scanner.startScan().then(() => {
				console.log('Started to scan.');
			}).catch((error) => {
				console.error(error);
			});
		})
		.catch(err => console.error('Something went wrong', err));
}

var getDataToPublish = function () {
	Beacon.find({'status' : 'ACTIVE','room': '101'}, { 'room':1,'floor':1,'beaconId': 1, 'status': 1, 'inTime': 1, '_id' : 0 }).lean().exec().then((result) => {
		if(result.length > 0)
		client.publish(topic, JSON.stringify(result));
	});
}

var settings = {
	port: 1883,
	clientId: 'scanner1'
};
topic = '/' + process.env.FLOOR_NO + '/' + process.env.ROOM_NO
var client = mqtt.connect('mqtt://localhost', settings);

client.on('connect', function () {
	console.log("Scanner in Room 101 in 1st floor connected " + client.connected);
	client.subscribe(topic);
	client.publish(topic, 'Scanner 1');
});

// fired when new message is received
client.on('message', function (topic, message) {
	console.log(message.toString());
});