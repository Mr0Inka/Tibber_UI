const { TibberFeed, TibberQuery } = require('tibber-api');
const config = require('./config');
const { displayData } = require('./dataFormatter');

class TibberClient {
    constructor(influxLogger = null) {
        this.tibberQuery = null;
        this.tibberFeed = null;
        this.influxLogger = influxLogger;
    }

    connect() {
        console.log('🔌 Connecting to Tibber...');

        this.tibberQuery = new TibberQuery(config);
        this.tibberFeed = new TibberFeed(this.tibberQuery, 5000);

        this.setupEventHandlers();
        this.tibberFeed.connect();
    }

    setupEventHandlers() {
        this.tibberFeed.on('connected', () => {
            console.log('✅ Tibber websocket connected');
        });

        this.tibberFeed.on('disconnected', () => {
            console.log('🔌 Tibber websocket disconnected');
        });

        this.tibberFeed.on('error', (error) => {
            console.error('❌ Tibber error:', error.message || error);
        });

        this.tibberFeed.on('data', (data) => {
            displayData(data, this.influxLogger);
        });
    }

    disconnect() {
        if (this.tibberFeed) {
            this.tibberFeed.disconnect();
        }
    }
}

module.exports = TibberClient;
