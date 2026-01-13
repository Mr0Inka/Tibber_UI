import { useState, useEffect, useCallback, useRef } from 'react'
import type { PowerData, PowerHistoryData, EnergyData, CumulativeEnergyData, DailyEnergyData, ApiResponse } from '../types'
import { API_URL } from '../config/api'

type TimeRange = '1m' | '5m' | '30m' | '1h' | '6h' | '12h' | '24h'

const getIntervalForRange = (range: TimeRange): string => {
  switch (range) {
    case '1m': return '1s'
    case '5m': return '1s'
    case '30m': return '10s'
    case '1h': return '30s'
    case '6h': return '1m'
    case '12h': return '2m'
    case '24h': return '5m'
  }
}

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
  const [todayEnergyGraph, setTodayEnergyGraph] = useState<EnergyData[]>([])
  const [yesterdayEnergyGraph, setYesterdayEnergyGraph] = useState<EnergyData[]>([])
  const [monthConsumption, setMonthConsumption] = useState<number | null>(null)
  const [dailyAverage, setDailyAverage] = useState<number | null>(null)
  const [graphRange, setGraphRange] = useState<TimeRange>('1h')
  const [graphData, setGraphData] = useState<PowerHistoryData[]>([])
  const [dailyEnergyHistory, setDailyEnergyHistory] = useState<DailyEnergyData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
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
        
        const currentRange = graphRangeRef.current
        const isLiveRange = currentRange === '1m' || currentRange === '5m'
        
        if (isLiveRange && newPower !== null && newPowerData.timestamp) {
          setGraphData((prevData) => {
            const now = Date.now()
            const rangeDuration = getRangeDuration(currentRange)
            const cutoffTime = now - rangeDuration
            
            const newPoint: PowerHistoryData = {
              value: newPower,
              timestamp: newPowerData.timestamp!
            }
            
            const filtered = prevData.filter(d => new Date(d.timestamp).getTime() > cutoffTime)
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

  const fetchTodayEnergyGraph = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/energy/today/cumulative`)
      const data: ApiResponse = await response.json()
      
      if (data.success && data.data) {
        const cumulativeData = data.data as CumulativeEnergyData
        setTodayEnergyGraph(cumulativeData.today || [])
        setYesterdayEnergyGraph(cumulativeData.yesterday || [])
      } else {
        setTodayEnergyGraph([])
        setYesterdayEnergyGraph([])
      }
    } catch (err) {
      console.error('Failed to fetch today energy graph:', err)
      setTodayEnergyGraph([])
      setYesterdayEnergyGraph([])
    }
  }, [])

  const fetchMonthData = useCallback(async () => {
    try {
      const [monthRes, avgRes] = await Promise.all([
        fetch(`${API_URL}/api/energy/month`),
        fetch(`${API_URL}/api/energy/month/daily-average`)
      ])
      
      const monthData: ApiResponse = await monthRes.json()
      const avgData = await avgRes.json()
      
      if (monthData.success && Array.isArray(monthData.data)) {
        const energyData = monthData.data as EnergyData[]
        if (energyData.length > 0) {
          const lastValue = energyData[energyData.length - 1].value
          setMonthConsumption(lastValue)
        } else {
          setMonthConsumption(0)
        }
      }
      
      if (avgData.success && avgData.data) {
        setDailyAverage(avgData.data.average)
      }
    } catch (err) {
      console.error('Failed to fetch month data:', err)
    }
  }, [])

  const fetchGraphData = useCallback(async (range: TimeRange) => {
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
    }
  }, [])

  const fetchDailyEnergyHistory = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/energy/daily/12months`)
      const data: ApiResponse = await response.json()
      
      if (data.success && Array.isArray(data.data)) {
        console.log('Daily energy data received:', data.data.length, 'entries')
        if (data.data.length > 0) {
          console.log('Sample entry:', data.data[0])
        }
        setDailyEnergyHistory(data.data as DailyEnergyData[])
      } else {
        console.log('No daily energy data received')
        setDailyEnergyHistory([])
      }
    } catch (err) {
      console.error('Failed to fetch daily energy history:', err)
      setDailyEnergyHistory([])
    }
  }, [])

  useEffect(() => {
    fetchCurrentPower()
    fetchTodayConsumption()
    fetchTodayEnergyGraph()
    fetchMonthData()
    fetchGraphData(graphRange)
    fetchDailyEnergyHistory()
    
    const powerInterval = setInterval(fetchCurrentPower, 1000)
    const consumptionInterval = setInterval(fetchTodayConsumption, 5000)
    const energyGraphInterval = setInterval(fetchTodayEnergyGraph, 60000)
    const monthInterval = setInterval(fetchMonthData, 60000)
    const graphInterval = setInterval(() => fetchGraphData(graphRange), 60000)
    const dailyHistoryInterval = setInterval(fetchDailyEnergyHistory, 300000) // every 5 minutes
    
    return () => {
      clearInterval(powerInterval)
      clearInterval(consumptionInterval)
      clearInterval(energyGraphInterval)
      clearInterval(monthInterval)
      clearInterval(graphInterval)
      clearInterval(dailyHistoryInterval)
    }
  }, [fetchCurrentPower, fetchTodayConsumption, fetchTodayEnergyGraph, fetchMonthData, fetchGraphData, fetchDailyEnergyHistory, graphRange])

  return {
    power,
    prevPower,
    todayConsumption,
    todayEnergyGraph,
    yesterdayEnergyGraph,
    monthConsumption,
    dailyAverage,
    graphRange,
    graphData,
    dailyEnergyHistory,
    loading,
    error,
    setGraphRange,
    fetchGraphData,
  }
}
