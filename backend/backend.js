const TibberClient = require('./lib/tibberClient');
const InfluxDBLogger = require('./lib/influxdb');
const API = require('./lib/api');
const config = require('./lib/config');

// Initialize InfluxDB logger
const influxLogger = new InfluxDBLogger();
influxLogger.connect();

// Initialize API server
const api = new API(influxLogger, process.env.API_PORT || 3000);
api.start();

// Initialize Tibber client with InfluxDB logger
const client = new TibberClient(influxLogger);
client.connect();

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down...');
    client.disconnect();
    influxLogger.disconnect();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down...');
    client.disconnect();
    influxLogger.disconnect();
    process.exit(0);
});
