# Backend Setup

## Environment Variables

Create a `.env` file in this directory with the following variables:

```env
# Tibber API Configuration
TIBBER_API_KEY=your-tibber-api-key-here
TIBBER_HOME_ID=your-tibber-home-id-here
TIBBER_QUERY_URL=https://api.tibber.com/v1-beta/gql
TIBBER_TIMEOUT=5000

# InfluxDB Configuration
INFLUXDB_IP=192.168.0.162
INFLUXDB_PORT=8086
INFLUXDB_TOKEN=9qe9NyaWj3FIXzW8JlFD15WFg3gKr-HS56twVHFqRoET3ifLA5VG7PEBeoVXdWgA1SvqqmIhl_ELZcD1XwXmlw==
INFLUXDB_ORG=Home
INFLUXDB_BUCKET=Tibber

# Note: If INFLUXDB_IP is empty, it will default to localhost
```

## Running

```bash
node backend.js
```

This will start:
- The Tibber websocket connection (logs power data to InfluxDB)
- The API server on port 3000 (default, configurable via `API_PORT`)

## API

The API server provides endpoints for querying power and energy data. See [API.md](./API.md) for full documentation.

**Quick Start:**
- Current power: `GET http://localhost:3000/api/current`
- Today's power: `GET http://localhost:3000/api/power/today`
- Today's energy: `GET http://localhost:3000/api/energy/today`

## Project Structure

```
backend/
├── lib/
│   ├── config.js          # Configuration loader
│   ├── tibberClient.js    # Tibber websocket client
│   ├── influxdb.js        # InfluxDB logger & query methods
│   ├── dataFormatter.js   # Data formatting utilities
│   └── api.js             # Express API server
├── backend.js             # Main entry point
├── API.md                 # API documentation
└── .env                   # Environment variables (create this)
```
