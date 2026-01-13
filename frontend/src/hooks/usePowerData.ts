import { useState, useEffect, useCallback, useRef } from 'react'
import type { PowerData, PowerHistoryData, HourlyData, EnergyData, ApiResponse } from '../types'
import { API_URL } from '../config/api'

type TimeRange = '1m' | '5m' | '30m' | '1h' | '6h' | '12h' | '24h'

// Get suitable interval for each time range
const getIntervalForRange = (range: TimeRange): string => {
  switch (range) {
    case '1m': return '1s' // All live values
    case '5m': return '1s' // All live values (1 second intervals)
    case '30m': return '10s'
    case '1h': return '30s'
    case '6h': return '1m'
    case '12h': return '2m'
    case '24h': return '5m'
  }
}

// Get range duration in milliseconds
const getRangeDuration = (range: TimeRange): number => {
  switch (range) {
    case '1m': return 1 * 60 * 1000
    case '5m': return 5 * 60 * 1000
    case '30m': return 30 * 60 * 1000
    case '1h': return 60 * 60 * 1000
    case '6h': return 6 * 60 * 60 * 1000
    case '12h': return 12 * 60 * 60 * 1000
    case '24h': return 24 * 60 * 60 * 1000
  }
}

export function usePowerData() {
  const [power, setPower] = useState<PowerData>({ value: null, timestamp: null })
  const [prevPower, setPrevPower] = useState<number | null>(null)
  const [todayConsumption, setTodayConsumption] = useState<number | null>(null)
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([])
  const [graphRange, setGraphRange] = useState<TimeRange>('1h')
  const [graphData, setGraphData] = useState<PowerHistoryData[]>([])
  const [graphLoading, setGraphLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Use ref to access current graphRange in callbacks without stale closures
  const graphRangeRef = useRef(graphRange)
  graphRangeRef.current = graphRange

  const fetchCurrentPower = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/current`)
      const data: ApiResponse = await response.json()
      
      if (data.success) {
        const newPowerData = data.data as PowerData
        const newPower = newPowerData.value
        
        setPower((prev) => {
          if (prev.value !== null && newPower !== null && newPower !== prev.value) {
            setPrevPower(prev.value)
            setTimeout(() => setPrevPower(null), 500)
          }
          return newPowerData
        })
        
        // Add new value to graph data for live updates (only for short ranges with 1s intervals)
        const currentRange = graphRangeRef.current
        const isLiveRange = currentRange === '1m' || currentRange === '5m'
        
        if (isLiveRange && newPower !== null && newPowerData.timestamp) {
          setGraphData((prevData) => {
            const now = Date.now()
            const rangeDuration = getRangeDuration(currentRange)
            const cutoffTime = now - rangeDuration
            
            // Add new point
            const newPoint: PowerHistoryData = {
              value: newPower,
              timestamp: newPowerData.timestamp!
            }
            
            // Filter out old points and add new one
            const filtered = prevData.filter(d => new Date(d.timestamp).getTime() > cutoffTime)
            
            // Avoid duplicates (same timestamp)
            const lastPoint = filtered[filtered.length - 1]
            if (lastPoint && lastPoint.timestamp === newPoint.timestamp) {
              return filtered
            }
            
            return [...filtered, newPoint]
          })
        }
        
        setError(null)
      } else {
        setError('Failed to fetch power data')
      }
    } catch (err) {
      setError('Unable to connect to API')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchTodayConsumption = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/energy/today`)
      const data: ApiResponse = await response.json()
      
      if (data.success && Array.isArray(data.data)) {
        const energyData = data.data as EnergyData[]
        if (energyData.length > 0) {
          const lastValue = energyData[energyData.length - 1].value
          setTodayConsumption(lastValue)
        } else {
          setTodayConsumption(0)
        }
      }
    } catch (err) {
      console.error('Failed to fetch today consumption:', err)
    }
  }, [])

  const fetchHourlyData = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/energy/today/hourly`)
      const data: ApiResponse = await response.json()
      
      if (data.success && Array.isArray(data.data)) {
        const energyData = data.data as EnergyData[]
        
        const hourly: HourlyData[] = []
        for (let i = 0; i < 24; i++) {
          hourly.push({ hour: i, consumption: 0 })
        }
        
        energyData.forEach((item) => {
          const timestamp = new Date(item.timestamp)
          const hour = timestamp.getHours()
          if (hour >= 0 && hour < 24 && item.value > 0) {
            hourly[hour].consumption = item.value
          }
        })
        
        setHourlyData(hourly)
      } else {
        const hourly: HourlyData[] = []
        for (let i = 0; i < 24; i++) {
          hourly.push({ hour: i, consumption: 0 })
        }
        setHourlyData(hourly)
      }
    } catch (err) {
      console.error('Failed to fetch hourly data:', err)
      const hourly: HourlyData[] = []
      for (let i = 0; i < 24; i++) {
        hourly.push({ hour: i, consumption: 0 })
      }
      setHourlyData(hourly)
    }
  }, [])

  const fetchGraphData = useCallback(async (range: TimeRange) => {
    setGraphLoading(true)
    try {
      const interval = getIntervalForRange(range)
      const response = await fetch(`${API_URL}/api/power?range=${range}&interval=${interval}`)
      const data: ApiResponse = await response.json()
      
      if (data.success && Array.isArray(data.data)) {
        setGraphData(data.data as PowerHistoryData[])
      } else {
        setGraphData([])
      }
    } catch (err) {
      console.error('Failed to fetch graph data:', err)
      setGraphData([])
    } finally {
      setGraphLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCurrentPower()
    fetchTodayConsumption()
    fetchHourlyData()
    fetchGraphData(graphRange)
    
    const powerInterval = setInterval(fetchCurrentPower, 1000)
    const consumptionInterval = setInterval(fetchTodayConsumption, 5000)
    const hourlyInterval = setInterval(fetchHourlyData, 60000)
    // Refresh full graph data less frequently since we're adding live values
    const graphInterval = setInterval(() => fetchGraphData(graphRange), 60000)
    
    return () => {
      clearInterval(powerInterval)
      clearInterval(consumptionInterval)
      clearInterval(hourlyInterval)
      clearInterval(graphInterval)
    }
  }, [fetchCurrentPower, fetchTodayConsumption, fetchHourlyData, fetchGraphData, graphRange])

  return {
    power,
    prevPower,
    todayConsumption,
    hourlyData,
    graphRange,
    graphData,
    graphLoading,
    loading,
    error,
    setGraphRange,
    fetchGraphData,
  }
}
