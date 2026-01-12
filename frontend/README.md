# Frontend

Simple React + TypeScript + Vite frontend for displaying Tibber power consumption.

## Setup

```bash
npm install
```

## Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Features

- Displays current power consumption in watts
- Auto-refreshes every 5 seconds
- Simple, clean UI

## API Connection

The API URL is **auto-detected** based on where you access the frontend:

- **From localhost**: Automatically uses `http://localhost:3000`
- **From IP address** (e.g., `http://192.168.0.100:5173`): Automatically uses `http://192.168.0.100:3000`

**No configuration needed!** The frontend automatically uses the same hostname/IP you're accessing it from.

**To override** (optional), create a `.env` file:
```env
VITE_API_URL=http://your-custom-api-url:3000
```

**To access from your phone:**
1. Find your computer's local IP address:
   - Mac/Linux: `ifconfig | grep "inet " | grep -v 127.0.0.1`
   - Windows: `ipconfig` (look for IPv4 Address)
2. Access the frontend from your phone using: `http://YOUR_IP:5173`
3. The frontend will automatically connect to `http://YOUR_IP:3000` for the API

**Note:** If your IP changes, just use the new IP - no configuration updates needed!
