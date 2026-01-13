const { InfluxDB, Point } = require('@influxdata/influxdb-client');
const config = require('./config');

class InfluxDBLogger {
    constructor() {
        this.client = null;
        this.writeApi = null;
        this.queryApi = null;
        this.connected = false;
    }

    connect() {
        try {
            const url = config.influxdb.url;
            const token = config.influxdb.token;
            const org = config.influxdb.org;
            const bucket = config.influxdb.bucket;

            this.client = new InfluxDB({ url, token });
            this.writeApi = this.client.getWriteApi(org, bucket, 'ms');
            this.queryApi = this.client.getQueryApi(org);
            
            this.connected = true;
            console.log('💾 InfluxDB connected');
        } catch (error) {
            console.error('❌ InfluxDB connection failed:', error.message);
            this.connected = false;
        }
    }

    logPower(power, timestamp = null) {
        if (!this.connected || !this.writeApi) {
            return;
        }

        // Check that power is a number
        if (typeof power !== 'number' || isNaN(power)) {
            console.warn('⚠️  Invalid power value:', power);
            return;
        }

        try {
            const point = new Point('Power')
                .floatField('value', power)
                .timestamp(timestamp ? new Date(timestamp) : new Date());

            this.writeApi.writePoint(point);
            this.writeApi.flush();
        } catch (error) {
            console.error('❌ InfluxDB write error:', error.message);
        }
    }

    async getCurrentPower() {
        if (!this.connected || !this.queryApi) {
            throw new Error('InfluxDB not connected');
        }

        const query = `
            from(bucket: "${config.influxdb.bucket}")
            |> range(start: -1h)
            |> filter(fn: (r) => r._measurement == "Power")
            |> filter(fn: (r) => r._field == "value")
            |> last()
        `;

        return new Promise((resolve, reject) => {
            const results = [];
            this.queryApi.queryRows(query, {
                next(row, tableMeta) {
                    const obj = tableMeta.toObject(row);
                    results.push({
                        value: obj._value,
                        timestamp: obj._time
                    });
                },
                error(error) {
                    reject(error);
                },
                complete() {
                    resolve(results[0] || null);
                }
            });
        });
    }

    async getPowerHistory(start, stop, interval = '1m') {
        if (!this.connected || !this.queryApi) {
            throw new Error('InfluxDB not connected');
        }

        const query = `
            from(bucket: "${config.influxdb.bucket}")
            |> range(start: ${start}, stop: ${stop})
            |> filter(fn: (r) => r._measurement == "Power")
            |> filter(fn: (r) => r._field == "value")
            |> aggregateWindow(every: ${interval}, fn: mean, createEmpty: false)
            |> yield(name: "mean")
        `;

        return new Promise((resolve, reject) => {
            const results = [];
            this.queryApi.queryRows(query, {
                next(row, tableMeta) {
                    const obj = tableMeta.toObject(row);
                    results.push({
                        value: obj._value,
                        timestamp: obj._time
                    });
                },
                error(error) {
                    reject(error);
                },
                complete() {
                    resolve(results);
                }
            });
        });
    }

    async getEnergyHistory(start, stop, interval = '1h') {
        if (!this.connected || !this.queryApi) {
            throw new Error('InfluxDB not connected');
        }

        // Get power data and calculate cumulative energy (kWh) from it
        // Calculate energy by integrating power over time
        const query = `
            from(bucket: "${config.influxdb.bucket}")
            |> range(start: ${start}, stop: ${stop})
            |> filter(fn: (r) => r._measurement == "Power")
            |> filter(fn: (r) => r._field == "value")
            |> aggregateWindow(every: ${interval}, fn: mean, createEmpty: false)
            |> map(fn: (r) => ({ r with _value: r._value / 1000.0 }))
            |> group(columns: ["_start", "_stop", "_field", "_measurement"])
            |> integral(unit: 1h)
            |> yield(name: "mean")
        `;

        return new Promise((resolve, reject) => {
            const results = [];
            this.queryApi.queryRows(query, {
                next(row, tableMeta) {
                    const obj = tableMeta.toObject(row);
                    const value = obj._value;
                    if (value !== null && value !== undefined && !isNaN(value)) {
                        results.push({
                            value: value,
                            timestamp: obj._time
                        });
                    }
                },
                error(error) {
                    console.error('InfluxDB energy query error:', error);
                    reject(error);
                },
                complete() {
                    // If no results, return empty array
                    resolve(results);
                }
            });
        });
    }

    async getCumulativeEnergyToday(start, stop, interval = '5m') {
        if (!this.connected || !this.queryApi) {
            throw new Error('InfluxDB not connected');
        }

        // Get power data at intervals and calculate cumulative energy
        // This returns running total at each interval
        const query = `
            from(bucket: "${config.influxdb.bucket}")
            |> range(start: ${start}, stop: ${stop})
            |> filter(fn: (r) => r._measurement == "Power")
            |> filter(fn: (r) => r._field == "value")
            |> aggregateWindow(every: ${interval}, fn: mean, createEmpty: false)
            |> map(fn: (r) => ({ r with _value: r._value / 1000.0 }))
            |> cumulativeSum()
            |> map(fn: (r) => ({ r with _value: r._value * (${this.intervalToHours(interval)}) }))
        `;

        return new Promise((resolve, reject) => {
            const results = [];
            this.queryApi.queryRows(query, {
                next(row, tableMeta) {
                    const obj = tableMeta.toObject(row);
                    const value = obj._value;
                    if (value !== null && value !== undefined && !isNaN(value)) {
                        results.push({
                            value: value,
                            timestamp: obj._time
                        });
                    }
                },
                error(error) {
                    console.error('InfluxDB cumulative energy query error:', error);
                    reject(error);
                },
                complete() {
                    resolve(results);
                }
            });
        });
    }

    // Helper to convert interval string to hours
    intervalToHours(interval) {
        const match = interval.match(/^(\d+)([smh])$/);
        if (!match) return 1/12; // default 5m
        const value = parseInt(match[1]);
        const unit = match[2];
        switch (unit) {
            case 's': return value / 3600;
            case 'm': return value / 60;
            case 'h': return value;
            default: return 1/12;
        }
    }

    async getDailyEnergyHistory(start, stop) {
        if (!this.connected || !this.queryApi) {
            throw new Error('InfluxDB not connected');
        }

        // Get power data and calculate daily energy (kWh) from it
        // Calculate energy by integrating power over time, grouped by day
        const query = `
            from(bucket: "${config.influxdb.bucket}")
            |> range(start: ${start}, stop: ${stop})
            |> filter(fn: (r) => r._measurement == "Power")
            |> filter(fn: (r) => r._field == "value")
            |> aggregateWindow(every: 1d, fn: mean, createEmpty: false)
            |> map(fn: (r) => ({ r with _value: r._value / 1000.0 }))
            |> group(columns: ["_start", "_stop", "_field", "_measurement"])
            |> integral(unit: 1h)
            |> yield(name: "daily")
        `;

        return new Promise((resolve, reject) => {
            const results = [];
            this.queryApi.queryRows(query, {
                next(row, tableMeta) {
                    const obj = tableMeta.toObject(row);
                    const value = obj._value;
                    if (value !== null && value !== undefined && !isNaN(value)) {
                        results.push({
                            value: value,
                            timestamp: obj._time
                        });
                    }
                },
                error(error) {
                    console.error('InfluxDB daily energy query error:', error);
                    reject(error);
                },
                complete() {
                    resolve(results);
                }
            });
        });
    }

    async getDailyEnergyPerDay(start, stop) {
        if (!this.connected || !this.queryApi) {
            throw new Error('InfluxDB not connected');
        }

        // Get energy consumption per day (each day separately)
        const query = `
            from(bucket: "${config.influxdb.bucket}")
            |> range(start: ${start}, stop: ${stop})
            |> filter(fn: (r) => r._measurement == "Power")
            |> filter(fn: (r) => r._field == "value")
            |> map(fn: (r) => ({ r with _value: r._value / 1000.0 }))
            |> aggregateWindow(every: 1d, fn: (tables=<-, column) => 
                tables |> integral(unit: 1h), createEmpty: false)
            |> yield(name: "daily_per_day")
        `;

        return new Promise((resolve, reject) => {
            const results = [];
            this.queryApi.queryRows(query, {
                next(row, tableMeta) {
                    const obj = tableMeta.toObject(row);
                    const value = obj._value;
                    if (value !== null && value !== undefined && !isNaN(value)) {
                        results.push({
                            value: value,
                            timestamp: obj._time
                        });
                    }
                },
                error(error) {
                    console.error('InfluxDB daily per day query error:', error);
                    reject(error);
                },
                complete() {
                    resolve(results);
                }
            });
        });
    }

    disconnect() {
        if (this.writeApi) {
            this.writeApi.close();
            this.connected = false;
            console.log('💾 InfluxDB disconnected');
        }
    }
}

module.exports = InfluxDBLogger;
