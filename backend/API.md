# API Documentation

## Base URL
`http://localhost:3000` (or your configured API_PORT)

## Endpoints

### Current Power Consumption
Get the most recent power reading.

**GET** `/api/current`

**Response:**
```json
{
  "success": true,
  "data": {
    "value": 209,
    "timestamp": "2025-01-12T12:30:00Z"
  }
}
```

---

### Power History (Watts)
Get historical power consumption data.

**GET** `/api/power/history?start={start}&stop={stop}&interval={interval}`

**Query Parameters:**
- `start` (required): Start time in ISO 8601 format (e.g., `2025-01-12T00:00:00Z`)
- `stop` (required): Stop time in ISO 8601 format (e.g., `2025-01-12T23:59:59Z`)
- `interval` (optional): Aggregation interval (default: `1m`). Examples: `1m`, `5m`, `1h`, `1d`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "value": 209,
      "timestamp": "2025-01-12T12:00:00Z"
    },
    {
      "value": 215,
      "timestamp": "2025-01-12T12:01:00Z"
    }
  ]
}
```

---

### Energy History (kWh)
Get historical energy consumption data (calculated from power).

**GET** `/api/energy/history?start={start}&stop={stop}&interval={interval}`

**Query Parameters:**
- `start` (required): Start time in ISO 8601 format
- `stop` (required): Stop time in ISO 8601 format
- `interval` (optional): Aggregation interval (default: `1h`). Examples: `15m`, `1h`, `1d`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "value": 0.125,
      "timestamp": "2025-01-12T12:00:00Z"
    },
    {
      "value": 0.250,
      "timestamp": "2025-01-12T13:00:00Z"
    }
  ]
}
```

---

### Convenience Endpoints

#### Today's Power Data
**GET** `/api/power/today`

Returns power data for today with 5-minute intervals.

#### This Week's Power Data
**GET** `/api/power/week`

Returns power data for the last 7 days with 1-hour intervals.

#### Today's Energy Data
**GET** `/api/energy/today`

Returns energy consumption for today with 15-minute intervals.

#### This Week's Energy Data
**GET** `/api/energy/week`

Returns energy consumption for the last 7 days with 1-hour intervals.

---

### Health Check
**GET** `/api/health`

**Response:**
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2025-01-12T12:30:00Z"
}
```

---

## Example Usage

### Get current power consumption
```bash
curl http://localhost:3000/api/current
```

### Get power history for today
```bash
curl "http://localhost:3000/api/power/history?start=2025-01-12T00:00:00Z&stop=2025-01-12T23:59:59Z&interval=5m"
```

### Get energy consumption for this week
```bash
curl http://localhost:3000/api/energy/week
```

---

## Error Responses

All endpoints return errors in the following format:

```json
{
  "success": false,
  "error": "Error message here"
}
```

Common HTTP status codes:
- `400`: Bad Request (missing or invalid parameters)
- `500`: Internal Server Error (database or server error)
