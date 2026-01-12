import { useState, useEffect } from 'react'
import './App.css'

interface PowerData {
  value: number | null
  timestamp: string | null
}

interface EnergyData {
  value: number
  timestamp: string
}

interface ApiResponse {
  success: boolean
  data: PowerData | EnergyData[]
}

// Auto-detect API URL based on where the frontend is accessed from
const getApiUrl = () => {
  const hostname = window.location.hostname
  
  // Priority 1: If VITE_API_URL is explicitly set, use it
  // Exception: If it's set to localhost but we're accessing from elsewhere, use auto-detection
  if (import.meta.env.VITE_API_URL) {
    const envUrl = import.meta.env.VITE_API_URL.trim()
    // If env URL is localhost/127.0.0.1 but we're not on localhost, use auto-detection
    const isLocalhostUrl = envUrl.includes('localhost') || envUrl.includes('127.0.0.1')
    if (isLocalhostUrl && hostname !== 'localhost' && hostname !== '127.0.0.1') {
      // Fall through to auto-detection
    } else {
      // Use the explicit URL from env (works for development: laptop frontend → Pi backend)
      return envUrl
    }
  }
  
  // Priority 2: Auto-detect based on where frontend is accessed from
  // If accessing from localhost, use localhost for API
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3000'
  }
  
  // Otherwise, use the same hostname/IP for API
  // This works when accessing frontend via Pi's IP/hostname - it will use the same for API
  return `http://${hostname}:3000`
}

const API_URL = getApiUrl()

// Debug logging (remove in production if desired)
if (import.meta.env.DEV) {
  console.log('API URL Configuration:', {
    'VITE_API_URL from env': import.meta.env.VITE_API_URL,
    'window.location.hostname': window.location.hostname,
    'Final API_URL': API_URL
  })
}

interface HourlyData {
  hour: number
  consumption: number
}

function App() {
  const [activeTab, setActiveTab] = useState<'today' | 'month'>('today')
  const [power, setPower] = useState<PowerData>({ value: null, timestamp: null })
  const [prevPower, setPrevPower] = useState<number | null>(null)
  const [todayConsumption, setTodayConsumption] = useState<number | null>(null)
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCurrentPower = async () => {
    try {
      const response = await fetch(`${API_URL}/api/current`)
      const data: ApiResponse = await response.json()
      
      if (data.success) {
        const newPower = (data.data as PowerData).value
        if (power.value !== null && newPower !== null && newPower !== power.value) {
          setPrevPower(power.value)
          setTimeout(() => setPrevPower(null), 500)
        }
        setPower(data.data as PowerData)
        setError(null)
      } else {
        setError('Failed to fetch power data')
      }
    } catch (err) {
      setError('Unable to connect to API')
    } finally {
      setLoading(false)
    }
  }

  const fetchTodayConsumption = async () => {
    try {
      const response = await fetch(`${API_URL}/api/energy/today`)
      const data: ApiResponse = await response.json()
      
      if (data.success && Array.isArray(data.data)) {
        const energyData = data.data as EnergyData[]
        // Get the last value (most recent cumulative consumption)
        if (energyData.length > 0) {
          const lastValue = energyData[energyData.length - 1].value
          setTodayConsumption(lastValue)
        } else {
          setTodayConsumption(0)
        }
      }
    } catch (err) {
      // Silently fail for consumption, don't show error
      console.error('Failed to fetch today consumption:', err)
    }
  }

  const fetchHourlyData = async () => {
    try {
      const response = await fetch(`${API_URL}/api/energy/today/hourly`)
      const data: ApiResponse = await response.json()
      
      console.log('Hourly data response:', data)
      
      if (data.success && Array.isArray(data.data)) {
        const energyData = data.data as EnergyData[]
        console.log('Energy data received:', energyData.length, 'points', energyData)
        
        // Initialize all 24 hours with 0
        const hourly: HourlyData[] = []
        for (let i = 0; i < 24; i++) {
          hourly.push({ hour: i, consumption: 0 })
        }
        
        // The data from InfluxDB should already be per-hour consumption
        // Map each data point to its hour
        energyData.forEach((item) => {
          const timestamp = new Date(item.timestamp)
          const hour = timestamp.getHours()
          if (hour >= 0 && hour < 24 && item.value > 0) {
            hourly[hour].consumption = item.value
          }
        })
        
        console.log('Processed hourly data:', hourly)
        setHourlyData(hourly)
      } else {
        console.error('Invalid response format or no data:', data)
        // Set empty data if no data available
        const hourly: HourlyData[] = []
        for (let i = 0; i < 24; i++) {
          hourly.push({ hour: i, consumption: 0 })
        }
        setHourlyData(hourly)
      }
    } catch (err) {
      console.error('Failed to fetch hourly data:', err)
      // Set empty data on error
      const hourly: HourlyData[] = []
      for (let i = 0; i < 24; i++) {
        hourly.push({ hour: i, consumption: 0 })
      }
      setHourlyData(hourly)
    }
  }

  useEffect(() => {
    fetchCurrentPower()
    fetchTodayConsumption()
    fetchHourlyData()
    
    const powerInterval = setInterval(fetchCurrentPower, 1000) // Refresh every 1 second
    const consumptionInterval = setInterval(fetchTodayConsumption, 5000) // Refresh every 5 seconds
    const hourlyInterval = setInterval(fetchHourlyData, 60000) // Refresh every minute
    
    return () => {
      clearInterval(powerInterval)
      clearInterval(consumptionInterval)
      clearInterval(hourlyInterval)
    }
  }, [])

  return (
    <div className="app">
      <div className="tabs-container">
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'today' ? 'active' : ''}`}
            onClick={() => setActiveTab('today')}
          >
            Today
          </button>
          <button
            className={`tab ${activeTab === 'month' ? 'active' : ''}`}
            onClick={() => setActiveTab('month')}
          >
            This Month
          </button>
        </div>
      </div>

      <div className="content">
        {activeTab === 'today' ? (
          <div className="page">
            {loading ? (
              <div className="loading">Loading...</div>
            ) : error ? (
              <div className="error">❌ {error}</div>
            ) : (
              <>
                <div className="power-display">
                  <div className="power-value">
                    {prevPower !== null && (
                      <span className="power-number old-value">
                        {Math.round(prevPower)}
                      </span>
                    )}
                    <span key={power.value} className="power-number new-value">
                      {power.value !== null ? `${Math.round(power.value)}` : '--'}
                    </span>
                    <span className="unit">W</span>
                  </div>
                  <div className="consumption">
                    {todayConsumption !== null ? todayConsumption.toFixed(2) : '--'}
                    <span className="unit">kWh</span>
                  </div>
                </div>
                {hourlyData.length > 0 && (
                  <div className="hourly-chart">
                    <div className="chart-bars">
                      <div className="chart-timeline"></div>
                      {Array.from({ length: 24 }, (_, hour) => {
                        const data = hourlyData.find(d => d.hour === hour)
                        const consumption = data?.consumption || 0
                        const maxConsumption = Math.max(...hourlyData.map(d => d.consumption), 0.01)
                        const height = maxConsumption > 0 ? (consumption / maxConsumption) * 200 : 0
                        const isCurrentHour = new Date().getHours() === hour
                        const leftPosition = (hour / 24) * 100
                        
                        return (
                          <div 
                            key={hour} 
                            className="chart-bar-container"
                            style={{ left: `${leftPosition}%` }}
                          >
                            {consumption > 0 && (
                              <div 
                                className={`chart-bar ${isCurrentHour ? 'current' : ''}`}
                                style={{ height: `${Math.max(height, 2)}px` }}
                                title={`${hour}:00 - ${consumption.toFixed(3)} kWh`}
                              />
                            )}
                            <div className="bar-label">{hour}</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="page">
            <div className="power-display">
              <div className="power-value">
                {prevPower !== null && (
                  <span className="power-number old-value">
                    {Math.round(prevPower)}
                  </span>
                )}
                <span key={power.value} className="power-number new-value">
                  {power.value !== null ? `${Math.round(power.value)}` : '--'}
                </span>
                <span className="unit">W</span>
              </div>
              <div className="consumption">
                <span>--</span>
                <span className="unit">kWh</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
