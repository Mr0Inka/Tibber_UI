# Tibber UI - Real-time Power Consumption Monitor

This project connects to the Tibber API websocket to display real-time power consumption data.

## Setup

1. **Get your Tibber API key:**
   - Visit https://developer.tibber.com/
   - Sign in and create an API token

2. **Get your Home ID:**
   - You can find your home ID by running a quick script or checking the Tibber app
   - Alternatively, the backend will help you find it (see below)

3. **Create a `.env` file in the `backend` directory:**
   ```bash
   cd backend
   ```
   
   Create a file named `.env` with the following content:
   ```
   TIBBER_API_KEY=your-api-key-here
   TIBBER_HOME_ID=your-home-id-here
   ```
   
   Replace the placeholder values with your actual API key and home ID.

## Running the Backend

```bash
cd backend
node backend.js
```

The backend will:
- Connect to the Tibber websocket feed
- Display real-time power consumption data as it arrives
- Show current power, accumulated consumption, costs, and more

## Output Format

The backend displays:
- ⚡ Current Power (W and kW)
- 📊 Last Meter Consumption (kWh)
- 📈 Accumulated Consumption (kWh)
- 💰 Accumulated Cost
- 📉 Min/Average/Max Power values
- 🕐 Timestamp for each measurement

## Finding Your Home ID

If you need to find your home ID, you can create a quick script:

```javascript
const { TibberQuery } = require('tibber-api');

const config = {
    apiEndpoint: {
        apiKey: 'YOUR_API_KEY',
        queryUrl: 'https://api.tibber.com/v1-beta/gql',
    },
};

const tibberQuery = new TibberQuery(config);
tibberQuery.getHomes().then(homes => {
    console.log('Your homes:');
    homes.forEach(home => {
        console.log(`- ${home.appNickname || 'Unnamed'}: ${home.id}`);
    });
});
```

## Stopping the Application

Press `Ctrl+C` to gracefully disconnect and exit.

