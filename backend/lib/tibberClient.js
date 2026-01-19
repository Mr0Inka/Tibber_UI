const { TibberFeed, TibberQuery } = require('tibber-api');
const config = require('./config');
const { displayData } = require('./dataFormatter');

class TibberClient {
    constructor(influxLogger = null) {
        this.tibberQuery = null;
        this.tibberFeed = null;
        this.influxLogger = influxLogger;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.reconnectDelay = 5000; // Start with 5 seconds
        this.isConnected = false;
        this.reconnectTimeout = null;
        this.lastDataTime = null;
        this.healthCheckInterval = null;
    }

    async connect() {
        // Clean up any existing connection first
        await this.cleanup();

        console.log('🔌 Connecting to Tibber...');

        try {
            this.tibberQuery = new TibberQuery(config);
            this.tibberFeed = new TibberFeed(this.tibberQuery, 5000);

            this.setupEventHandlers();
            this.tibberFeed.connect();
        } catch (error) {
            console.error('❌ Failed to create Tibber connection:', error.message);
            this.scheduleReconnect();
        }
    }

    setupEventHandlers() {
        // Store reference to current feed to check if events are from current connection
        const currentFeed = this.tibberFeed;

        currentFeed.on('connected', () => {
            // Ignore if this is from an old connection
            if (currentFeed !== this.tibberFeed) {
                console.log('⚠️ Ignoring connected event from old connection');
                return;
            }

            console.log('✅ Tibber websocket connected');
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.reconnectDelay = 5000;
            this.lastDataTime = Date.now();

            // Clear any pending reconnect
            if (this.reconnectTimeout) {
                clearTimeout(this.reconnectTimeout);
                this.reconnectTimeout = null;
            }

            // Start health check
            this.startHealthCheck();
        });

        currentFeed.on('disconnected', (reason) => {
            // Ignore if this is from an old connection
            if (currentFeed !== this.tibberFeed) {
                console.log('⚠️ Ignoring disconnected event from old connection');
                return;
            }

            console.log('🔌 Tibber websocket disconnected:', reason || 'unknown reason');
            this.isConnected = false;
            this.stopHealthCheck();
            this.scheduleReconnect();
        });

        currentFeed.on('error', (error) => {
            // Ignore if this is from an old connection
            if (currentFeed !== this.tibberFeed) {
                return;
            }
            console.error('❌ Tibber error:', error.message || error);
        });

        currentFeed.on('data', (data) => {
            // Ignore if this is from an old connection
            if (currentFeed !== this.tibberFeed) {
                console.log('⚠️ Ignoring data from old connection');
                return;
            }

            this.lastDataTime = Date.now();
            displayData(data, this.influxLogger);
        });
    }

    startHealthCheck() {
        this.stopHealthCheck();
        this.healthCheckInterval = setInterval(() => {
            const now = Date.now();
            const timeSinceLastData = now - (this.lastDataTime || 0);

            // If no data for 3 minutes, something is wrong
            if (timeSinceLastData > 3 * 60 * 1000) {
                console.warn(`⚠️ No data received for ${Math.round(timeSinceLastData / 1000)}s, forcing reconnect...`);
                this.connect(); // This will cleanup first
            }
        }, 2 * 60 * 1000); // Check every 2 minutes
    }

    stopHealthCheck() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
        }
    }

    scheduleReconnect() {
        // Don't schedule if already scheduled
        if (this.reconnectTimeout) {
            return;
        }

        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error(`❌ Max reconnect attempts (${this.maxReconnectAttempts}) reached. Waiting 5 minutes before trying again...`);
            this.reconnectTimeout = setTimeout(() => {
                this.reconnectTimeout = null;
                this.reconnectAttempts = 0;
                this.reconnectDelay = 5000;
                this.connect();
            }, 5 * 60 * 1000);
            return;
        }

        this.reconnectAttempts++;
        const delay = Math.min(this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1), 60000);

        console.log(`🔄 Reconnecting in ${Math.round(delay / 1000)}s (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

        this.reconnectTimeout = setTimeout(() => {
            this.reconnectTimeout = null;
            this.connect();
        }, delay);
    }

    async cleanup() {
        this.stopHealthCheck();
        this.isConnected = false;

        // Clear pending reconnect
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        // Close existing connection
        if (this.tibberFeed) {
            const oldFeed = this.tibberFeed;
            this.tibberFeed = null; // Clear reference first to ignore future events
            this.tibberQuery = null;

            try {
                // Remove all listeners to prevent duplicate events
                oldFeed.removeAllListeners();
                
                if (typeof oldFeed.close === 'function') {
                    oldFeed.close();
                } else if (typeof oldFeed.disconnect === 'function') {
                    oldFeed.disconnect();
                }
            } catch (e) {
                console.log('⚠️ Error closing old connection:', e.message);
            }

            // Wait a bit for the old connection to fully close
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    async disconnect() {
        await this.cleanup();
    }
}

module.exports = TibberClient;
