require('dotenv').config({ quiet: true });

const config = {
    apiEndpoint: {
        apiKey: process.env.TIBBER_API_KEY,
        queryUrl: process.env.TIBBER_QUERY_URL || 'https://api.tibber.com/v1-beta/gql',
        requestTimeout: parseInt(process.env.TIBBER_TIMEOUT) || 5000,
    },
    homeId: process.env.TIBBER_HOME_ID,
    power: true,
    active: true,
    timestamp: true,
    influxdb: {
        ip: process.env.INFLUXDB_IP || 'localhost',
        port: process.env.INFLUXDB_PORT || '8086',
        token: process.env.INFLUXDB_TOKEN,
        org: process.env.INFLUXDB_ORG || 'Home',
        bucket: process.env.INFLUXDB_BUCKET || 'Tibber',
    },
};

// Construct InfluxDB URL from IP and port
config.influxdb.url = `http://${config.influxdb.ip}:${config.influxdb.port}`;

module.exports = config;
