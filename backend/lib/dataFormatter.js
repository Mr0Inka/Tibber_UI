const formatPower = (power) => {
    if (power == null) return null;
    return power;
};

const formatTimestamp = (timestamp) => {
    if (!timestamp) return null;
    return new Date(timestamp).toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
};

const displayData = (data, influxLogger = null) => {
    // Log power value to console
    if (data.power !== null && data.power !== undefined) {
        console.log(`⚡ ${data.power} W`);
    }
    
    // Log to InfluxDB if logger is provided
    if (influxLogger) {
        influxLogger.logPower(data.power, data.timestamp);
    }
};

module.exports = {
    formatPower,
    formatTimestamp,
    displayData,
};
