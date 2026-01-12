const express = require('express');
const cors = require('cors');

class API {
    constructor(influxLogger, port = 3000) {
        this.app = express();
        this.port = port;
        this.influxLogger = influxLogger;

        this.setupMiddleware();
        this.setupRoutes();
    }

    setupMiddleware() {
        this.app.use(cors());
        this.app.use(express.json());
    }

    setupRoutes() {
        // Current power consumption
        this.app.get('/api/current', async (req, res) => {
            try {
                const current = await this.influxLogger.getCurrentPower();
                res.json({
                    success: true,
                    data: current || { value: null, timestamp: null }
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Power history (watts)
        this.app.get('/api/power/history', async (req, res) => {
            try {
                const { start, stop, interval = '1m' } = req.query;

                if (!start || !stop) {
                    return res.status(400).json({
                        success: false,
                        error: 'start and stop parameters are required (ISO 8601 format)'
                    });
                }

                const data = await this.influxLogger.getPowerHistory(start, stop, interval);
                res.json({
                    success: true,
                    data: data
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Energy history (kWh)
        this.app.get('/api/energy/history', async (req, res) => {
            try {
                const { start, stop, interval = '1h' } = req.query;

                if (!start || !stop) {
                    return res.status(400).json({
                        success: false,
                        error: 'start and stop parameters are required (ISO 8601 format)'
                    });
                }

                const data = await this.influxLogger.getEnergyHistory(start, stop, interval);
                res.json({
                    success: true,
                    data: data
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Convenience endpoints with common time ranges
        this.app.get('/api/power/today', async (req, res) => {
            try {
                const now = new Date();
                const start = new Date(now.setHours(0, 0, 0, 0)).toISOString();
                const stop = new Date().toISOString();
                const data = await this.influxLogger.getPowerHistory(start, stop, '5m');
                res.json({ success: true, data });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        this.app.get('/api/power/today/1m', async (req, res) => {
            try {
                const now = new Date();
                const start = new Date(now.setHours(0, 0, 0, 0)).toISOString();
                const stop = new Date().toISOString();
                console.log(`📊 Fetching 1-minute power data from ${start} to ${stop}`);
                const data = await this.influxLogger.getPowerHistory(start, stop, '1m');
                console.log(`📊 Retrieved ${data.length} 1-minute power data points`);
                res.json({ success: true, data });
            } catch (error) {
                console.error('❌ Error fetching 1-minute power data:', error);
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // Flexible power endpoint with time range and interval parameters
        // Usage: /api/power?range=5m&interval=1m
        // Range options: 5m, 1h, 3h, 12h, 24h
        // Interval options: 1m, 5m, 15m, 30m, 1h (or any valid Flux duration)
        this.app.get('/api/power', async (req, res) => {
            try {
                const { range = '1h', interval = '1m' } = req.query;

                // Validate range parameter
                const validRanges = ['5m', '1h', '3h', '12h', '24h'];
                if (!validRanges.includes(range)) {
                    return res.status(400).json({
                        success: false,
                        error: `Invalid range. Must be one of: ${validRanges.join(', ')}`
                    });
                }

                // Calculate start time based on range
                const now = new Date();
                let start;
                switch (range) {
                    case '5m':
                        start = new Date(now.getTime() - 5 * 60 * 1000);
                        break;
                    case '1h':
                        start = new Date(now.getTime() - 60 * 60 * 1000);
                        break;
                    case '3h':
                        start = new Date(now.getTime() - 3 * 60 * 60 * 1000);
                        break;
                    case '12h':
                        start = new Date(now.getTime() - 12 * 60 * 60 * 1000);
                        break;
                    case '24h':
                        start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                        break;
                }

                const startISO = start.toISOString();
                const stopISO = now.toISOString();

                console.log(`📊 Fetching power data: range=${range}, interval=${interval}, from ${startISO} to ${stopISO}`);
                const data = await this.influxLogger.getPowerHistory(startISO, stopISO, interval);
                console.log(`📊 Retrieved ${data.length} power data points`);

                res.json({
                    success: true,
                    data,
                    meta: {
                        range,
                        interval,
                        start: startISO,
                        stop: stopISO,
                        count: data.length
                    }
                });
            } catch (error) {
                console.error('❌ Error fetching power data:', error);
                res.status(500).json({ success: false, error: error.message });
            }
        });

        this.app.get('/api/power/week', async (req, res) => {
            try {
                const now = new Date();
                const start = new Date(now.setDate(now.getDate() - 7)).toISOString();
                const stop = new Date().toISOString();
                const data = await this.influxLogger.getPowerHistory(start, stop, '1h');
                res.json({ success: true, data });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        this.app.get('/api/energy/today', async (req, res) => {
            try {
                const now = new Date();
                const start = new Date(now.setHours(0, 0, 0, 0)).toISOString();
                const stop = new Date().toISOString();
                const data = await this.influxLogger.getEnergyHistory(start, stop, '15m');
                res.json({ success: true, data });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        this.app.get('/api/energy/today/hourly', async (req, res) => {
            try {
                const now = new Date();
                const start = new Date(now.setHours(0, 0, 0, 0)).toISOString();
                const stop = new Date().toISOString();
                console.log(`📊 Fetching hourly energy data from ${start} to ${stop}`);
                const data = await this.influxLogger.getEnergyHistory(start, stop, '1h');
                console.log(`📊 Retrieved ${data.length} hourly data points`);
                res.json({ success: true, data });
            } catch (error) {
                console.error('❌ Error fetching hourly energy data:', error);
                res.status(500).json({ success: false, error: error.message });
            }
        });

        this.app.get('/api/energy/today/1m', async (req, res) => {
            try {
                const now = new Date();
                const start = new Date(now.setHours(0, 0, 0, 0)).toISOString();
                const stop = new Date().toISOString();
                console.log(`📊 Fetching 1-minute energy data from ${start} to ${stop}`);
                const data = await this.influxLogger.getEnergyHistory(start, stop, '1m');
                console.log(`📊 Retrieved ${data.length} 1-minute data points`);
                res.json({ success: true, data });
            } catch (error) {
                console.error('❌ Error fetching 1-minute energy data:', error);
                res.status(500).json({ success: false, error: error.message });
            }
        });

        this.app.get('/api/energy/week', async (req, res) => {
            try {
                const now = new Date();
                const start = new Date(now.setDate(now.getDate() - 7)).toISOString();
                const stop = new Date().toISOString();
                const data = await this.influxLogger.getEnergyHistory(start, stop, '1h');
                res.json({ success: true, data });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        this.app.get('/api/energy/daily/12months', async (req, res) => {
            try {
                const now = new Date();
                // Calculate start date: 12 months ago at midnight
                const start = new Date(now.getFullYear(), now.getMonth() - 12, 1, 0, 0, 0, 0);
                // End date: end of yesterday (last full day)
                const stop = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

                console.log(`📊 Fetching daily energy data from ${start.toISOString()} to ${stop.toISOString()}`);
                const data = await this.influxLogger.getDailyEnergyHistory(start.toISOString(), stop.toISOString());
                console.log(`📊 Retrieved ${data.length} daily data points`);
                res.json({ success: true, data });
            } catch (error) {
                console.error('❌ Error fetching daily energy data:', error);
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // Health check
        this.app.get('/api/health', (req, res) => {
            res.json({
                success: true,
                status: 'healthy',
                timestamp: new Date().toISOString()
            });
        });
    }

    start() {
        this.app.listen(this.port, '0.0.0.0', () => {
            console.log(`🌐 API server running on http://0.0.0.0:${this.port}`);
            console.log(`   Access from network: http://<your-ip>:${this.port}`);
        });
    }
}

module.exports = API;
