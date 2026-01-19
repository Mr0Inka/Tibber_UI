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
        this.isConnecting = false;
        this.lastDataTime = null;
        this.healthCheckInterval = null;
    }

    connect() {
        if (this.isConnecting) {
            console.log('⏳ Already attempting to connect...');
            return;
        }

        this.isConnecting = true;
        console.log('🔌 Connecting to Tibber...');

        try {
            this.tibberQuery = new TibberQuery(config);
            this.tibberFeed = new TibberFeed(this.tibberQuery, 5000);

            this.setupEventHandlers();
            this.tibberFeed.connect();
        } catch (error) {
            console.error('❌ Failed to create Tibber connection:', error.message);
            this.isConnecting = false;
            this.scheduleReconnect();
        }
    }

    setupEventHandlers() {
        this.tibberFeed.on('connected', () => {
            console.log('✅ Tibber websocket connected');
            this.reconnectAttempts = 0;
            this.reconnectDelay = 5000;
            this.isConnecting = false;
            this.lastDataTime = Date.now();
            
            // Start health check
            this.startHealthCheck();
        });

        this.tibberFeed.on('disconnected', (reason) => {
            console.log('🔌 Tibber websocket disconnected:', reason || 'unknown reason');
            this.isConnecting = false;
            this.stopHealthCheck();
            this.scheduleReconnect();
        });

        this.tibberFeed.on('error', (error) => {
            console.error('❌ Tibber error:', error.message || error);
            // Don't immediately reconnect on error, wait for disconnect event
            // But if we're stuck, the health check will catch it
        });

        this.tibberFeed.on('data', (data) => {
            this.lastDataTime = Date.now();
            displayData(data, this.influxLogger);
        });
    }

    startHealthCheck() {
        // Check every 2 minutes if we're still receiving data
        this.stopHealthCheck();
        this.healthCheckInterval = setInterval(() => {
            const now = Date.now();
            const timeSinceLastData = now - (this.lastDataTime || 0);
            
            // If no data for 3 minutes, something is wrong
            if (timeSinceLastData > 3 * 60 * 1000) {
                console.warn(`⚠️ No data received for ${Math.round(timeSinceLastData / 1000)}s, forcing reconnect...`);
                this.forceReconnect();
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
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error(`❌ Max reconnect attempts (${this.maxReconnectAttempts}) reached. Waiting 5 minutes before trying again...`);
            setTimeout(() => {
                this.reconnectAttempts = 0;
                this.reconnectDelay = 5000;
                this.connect();
            }, 5 * 60 * 1000);
            return;
        }

        this.reconnectAttempts++;
        const delay = Math.min(this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1), 60000); // Max 60 seconds
        
        console.log(`🔄 Reconnecting in ${Math.round(delay / 1000)}s (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
        
        setTimeout(() => {
            this.connect();
        }, delay);
    }

    forceReconnect() {
        console.log('🔄 Forcing reconnection...');
        this.stopHealthCheck();
        this.isConnecting = false;
        
        // Try to close existing connection safely
        try {
            if (this.tibberFeed) {
                if (typeof this.tibberFeed.close === 'function') {
                    this.tibberFeed.close();
                } else if (typeof this.tibberFeed.disconnect === 'function') {
                    this.tibberFeed.disconnect();
                }
            }
        } catch (e) {
            console.log('⚠️ Error closing existing connection:', e.message);
        }
        
        // Clear references
        this.tibberFeed = null;
        this.tibberQuery = null;
        
        // Reconnect after a short delay
        setTimeout(() => {
            this.connect();
        }, 2000);
    }

    disconnect() {
        this.stopHealthCheck();
        try {
            if (this.tibberFeed) {
                if (typeof this.tibberFeed.close === 'function') {
                    this.tibberFeed.close();
                } else if (typeof this.tibberFeed.disconnect === 'function') {
                    this.tibberFeed.disconnect();
                }
            }
        } catch (e) {
            console.log('⚠️ Error during disconnect:', e.message);
        }
    }
}

module.exports = TibberClient;
