const { db, getAllBeaconsFromDB } = require('./app');
var mqtt = require('mqtt');
require("dotenv/config");


var settings = {
    port: 1883,
    qos : 2,
    clientId : 'scanner'
};
topic = '/'+process.env.FLOOR_NO+'/'+process.env.ROOM_NO;

var client = mqtt.connect('mqtt://127.0.0.1', settings);

client.on('connect',function(){	
    console.log("Connected : "+client.connected);
    });

console.log('Client publishing...');
 

module.exports = {client}