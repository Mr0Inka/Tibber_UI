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
